import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { InvoiceStatus, DiscountType, StockMovementType } from "@prisma/client";
import { z } from "zod";
import { InvoiceSchema } from "@/lib/formValidationSchemas";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const data = InvoiceSchema.parse(json);

    const lastInvoice = await db.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    const invoiceNumber = lastInvoice
      ? `INV-${parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1}`
      : "INV-0001";

    const itemsWithAmounts = data.items.map((item) => ({
      ...item,
      amount: item.quantity * item.unitPrice,
      taxAmount: item.taxRate
        ? (item.quantity * item.unitPrice * item.taxRate) / 100
        : 0,
    }));

    const subtotal = itemsWithAmounts.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalTax = itemsWithAmounts.reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0
    );

    const totalAmount = subtotal + totalTax - (data.discountAmount ?? 0);

    // Calculate tax rate as decimal (0-1) instead of percentage (0-100)
    const taxRate = subtotal > 0 ? (totalTax / subtotal) * 100 : 0;

    // Create the invoice first
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId,
        project: data.project,
        amount: subtotal,
        currency: data.currency,
        status: data.status,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        description: data.description,
        taxAmount: totalTax,
        taxRate: taxRate,
        discountAmount: data.discountAmount,
        discountType: data.discountType,
        totalAmount,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        createdBy: creator.id,
      },
    });

    // Create invoice items
    await db.invoiceItem.createMany({
      data: itemsWithAmounts.map((item) => ({
        invoiceId: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        currency: data.currency,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        shopProductId: (item as any).shopProductId || null,
      })),
    });

    // Check if invoice has shop products and create sale if needed
    const itemsWithProducts = itemsWithAmounts.filter(
      (item) => (item as any).shopProductId
    );

    if (itemsWithProducts.length > 0) {
      // Generate sale number
      const lastSale = await db.sale.findFirst({
        orderBy: { createdAt: "desc" },
        select: { saleNumber: true },
      });

      const saleNumber = lastSale
        ? `SALE-${parseInt(lastSale.saleNumber.split("-")[1]) + 1}`
        : "SALE-0001";

      // Get client information for the sale
      const client = await db.client.findUnique({
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

      // Try to find existing customer by email if available
      if (client?.email) {
        const existingCustomer = await db.customer.findFirst({
          where: { email: client.email },
        });
        if (existingCustomer) {
          customerId = existingCustomer.id;
        }
      }

      // If no customer found by email, create a new one with required fields
      if (!customerId) {
        // Create a unique email if client email doesn't exist
        const customerEmail =
          client?.email || `invoice-${invoiceNumber}@temp.com`;

        const newCustomer = await db.customer.create({
          data: {
            firstName: client?.name?.split(" ")[0] || "Invoice",
            lastName: client?.name?.split(" ").slice(1).join(" ") || "Customer",
            email: customerEmail,
            phone: client?.phone || "",
            address: client?.address || "",
            createdBy: creator.id,
          },
        });
        customerId = newCustomer.id;
      }

      // Create the sale
      const sale = await db.sale.create({
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
          saleDate: new Date(data.issueDate),
          createdBy: creator.id,
          orderId: invoice.id,
        },
      });

      // Create sale items and update product stock in smaller transactions
      for (const item of itemsWithProducts) {
        const shopProductId = (item as any).shopProductId;
        const quantity = Math.floor(item.quantity);

        // Use a separate transaction for each product to avoid timeout
        await db.$transaction(async (prisma) => {
          // Create sale item
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
                reason: `Sale from invoice ${invoiceNumber}`,
                reference: sale.saleNumber,
                creater: creator.name,
              },
            });
          }
        });
      }
    }

    // Create notification
    await db.notification.create({
      data: {
        title: "New Invoice Created",
        message: `Invoice ${invoiceNumber} has been created by ${creator.name}.`,
        type: "INVOICE",
        isRead: false,
        actionUrl: `/dashboard/invoices/${invoice.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("[INVOICE_POST]", error);

    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 });
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all invoices where status is not CANCELLED
    const invoices = await db.invoice.findMany({
      where: {
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            description: true,
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("[INVOICES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
