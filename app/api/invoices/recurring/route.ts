import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { RecurringInvoiceSchema } from "@/lib/formValidationSchemas";
import { z } from "zod";
import { InvoiceStatus, DiscountType, StockMovementType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();

    // Parse and validate the data
    const data = RecurringInvoiceSchema.parse(json);

    // Calculate next date based on frequency
    const nextDate = calculateNextDate(
      data.startDate,
      data.frequency,
      data.interval,
    );

    // Calculate amounts with proper order: discount first, then tax
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // Calculate discount
    let discountAmount = 0;
    if (data.discountType === "PERCENTAGE" && data.discountAmount) {
      discountAmount = subtotal * (data.discountAmount / 100);
    } else if (data.discountType === "AMOUNT" && data.discountAmount) {
      discountAmount = data.discountAmount;
    }

    // Prevent discount from exceeding subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    // Calculate discounted subtotal
    const discountedSubtotal = subtotal - discountAmount;

    // Calculate tax on DISCOUNTED amount (proportionally per item)
    const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0;

    const itemsWithAmounts = data.items.map((item) => {
      const itemAmount = item.quantity * item.unitPrice;
      const discountedItemAmount = itemAmount - itemAmount * discountRatio;
      const taxAmount = item.taxRate
        ? (discountedItemAmount * item.taxRate) / 100
        : 0;

      return {
        ...item,
        amount: itemAmount, // Original amount for record keeping
        taxAmount, // Tax calculated on discounted amount
      };
    });

    const totalTax = itemsWithAmounts.reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0,
    );

    // Total amount is discounted subtotal + tax
    const totalAmount = discountedSubtotal + totalTax;

    // Calculate effective tax rate based on discounted subtotal
    const taxRate =
      discountedSubtotal > 0 ? (totalTax / discountedSubtotal) * 100 : 0;

    // Generate invoice number
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    const invoiceNumber = lastInvoice
      ? `INV-${parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1}`
      : "INV-0001";

    // Use transaction to ensure both recurring invoice and first invoice are created
    const result = await db.$transaction(
      async (prisma) => {
        // Create recurring invoice template
        const recurringInvoice = await prisma.recurringInvoice.create({
          data: {
            clientId: data.clientId,
            frequency: data.frequency,
            interval: data.interval,
            startDate: data.startDate,
            endDate: data.endDate || null,
            nextDate,
            description: data.description,
            items: data.items as any,
            currency: data.currency,
            discountAmount: data.discountAmount,
            discountType: data.discountType,
            paymentTerms: data.paymentTerms,
            notes: data.notes,
            creator: creator.id,
            totalInvoicesGenerated: 1,
            lastGeneratedAt: new Date(),
          },
        });

        // Create the first invoice
        const firstInvoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            clientId: data.clientId,
            project:
              data.description ||
              `Recurring Invoice ${data.frequency.toLowerCase()}`,
            amount: subtotal, // Original subtotal before discount
            currency: data.currency,
            status: InvoiceStatus.DRAFT,
            issueDate: new Date(data.startDate),
            dueDate: calculateDueDate(new Date(data.startDate), 30),
            description: data.description,
            taxAmount: totalTax, // Tax calculated on discounted amount
            taxRate: taxRate, // Effective tax rate based on discounted subtotal
            discountAmount: discountAmount,
            discountType: data.discountType,
            totalAmount, // Final total (discounted subtotal + tax)
            paymentTerms: data.paymentTerms,
            notes: data.notes,
            createdBy: creator.id,
            isRecurring: true,
            recurringId: recurringInvoice.id,
          },
        });

        // Create invoice items
        await prisma.invoiceItem.createMany({
          data: itemsWithAmounts.map((item) => ({
            invoiceId: firstInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount, // Original amount (quantity * unitPrice)
            currency: data.currency,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount, // Tax calculated on discounted item amount
            shopProductId: item.shopProductId || null,
            details: item.details || null,
          })),
        });

        const itemsWithProducts = itemsWithAmounts.filter(
          (item): item is typeof item & { shopProductId: string } =>
            !!item.shopProductId && typeof item.shopProductId === "string",
        );

        if (itemsWithProducts.length > 0) {
          // Generate sale number
          const lastSale = await prisma.sale.findFirst({
            orderBy: { createdAt: "desc" },
            select: { saleNumber: true },
          });

          const saleNumber = lastSale
            ? `SALE-${parseInt(lastSale.saleNumber.split("-")[1]) + 1}`
            : "SALE-0001";

          // Get client information for the sale
          const client = await prisma.client.findUnique({
            where: { id: data.clientId },
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
            },
          });

          // Create or find a customer record from the client
          let customerId: string | undefined;

          if (client?.email) {
            const existingCustomer = await prisma.customer.findFirst({
              where: { email: client.email },
            });
            if (existingCustomer) {
              customerId = existingCustomer.id;
            }
          }

          // If no customer found by email, create a new one with required fields
          if (!customerId) {
            const customerEmail =
              client?.email || `invoice-${invoiceNumber}@temp.com`;
            const newCustomer = await prisma.customer.create({
              data: {
                firstName: client?.name?.split(" ")[0] || "Invoice",
                lastName:
                  client?.name?.split(" ").slice(1).join(" ") || "Customer",
                email: customerEmail,
                phone: client?.phone || "",
                address: client?.address || "",
                createdBy: creator.id,
              },
            });
            customerId = newCustomer.id;
          }

          // Create the sale
          const sale = await prisma.sale.create({
            data: {
              saleNumber,
              customerId: customerId,
              customerName: client?.name || "Invoice Customer",
              customerEmail: client?.email,
              customerPhone: client?.phone,
              customerAddress: client?.address,
              status: "COMPLETED",
              subtotal: Number(totalAmount),
              total: Number(totalAmount),
              paymentStatus: "COMPLETED",
              paymentMethod: "INVOICE",
              amountReceived: Number(totalAmount),
              saleDate: new Date(data.startDate),
              createdBy: creator.id,
              orderId: firstInvoice.id,
            },
          });

          // Create sale items and update product stock
          for (const item of itemsWithProducts) {
            const shopProductId = item.shopProductId;
            const quantity = Math.floor(item.quantity);

            // Create sale item - shopProductId is guaranteed to be string here
            await prisma.saleItem.create({
              data: {
                saleId: sale.id,
                shopProductId: shopProductId,
                quantity: quantity,
                price: item.unitPrice,
                total: item.amount,
              },
            });

            // Update product stock
            const product = await prisma.shopProduct.findUnique({
              where: { id: shopProductId },
            });

            if (product) {
              const newStock = product.stock - quantity;

              // Update product stock
              await prisma.shopProduct.update({
                where: { id: shopProductId },
                data: {
                  stock: Math.max(0, newStock),
                },
              });

              // Create stock movement record
              await prisma.stockMovement.create({
                data: {
                  shopProductId: shopProductId,
                  type: StockMovementType.OUT,
                  quantity: quantity,
                  previousStock: product.stock,
                  newStock: Math.max(0, newStock),
                  reason: `Sale from recurring invoice ${invoiceNumber}`,
                  reference: sale.saleNumber,
                  creater: creator.name,
                },
              });
            }
          }
        }

        return { recurringInvoice, firstInvoice };
      },
      {
        timeout: 30000, // 30 seconds
      },
    );

    // Create notification
    await db.notification.create({
      data: {
        title: "New Recurring Invoice Created",
        message: `Recurring invoice has been created by ${creator.name} with first invoice ${invoiceNumber}.`,
        type: "INVOICE",
        isRead: false,
        actionUrl: `/dashboard/invoices/${result.firstInvoice.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json(result.recurringInvoice, { status: 201 });
  } catch (error) {
    console.error("[RECURRING_INVOICE_POST]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Helper function to calculate next invoice date

// Helper function to calculate next invoice date
function calculateNextDate(
  startDate: Date,
  frequency: string,
  interval: number,
): Date {
  const date = new Date(startDate);

  switch (frequency) {
    case "DAILY":
      date.setDate(date.getDate() + interval);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + interval * 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + interval);
      break;
    case "QUARTERLY":
      date.setMonth(date.getMonth() + interval * 3);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + interval);
      break;
  }

  return date;
}

function calculateDueDate(issueDate: Date, days: number): Date {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const recurringInvoices = await db.recurringInvoice.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            issueDate: true,
            totalAmount: true,
          },
          orderBy: {
            issueDate: "desc",
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(recurringInvoices);
  } catch (error) {
    console.error("[RECURRING_INVOICES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
