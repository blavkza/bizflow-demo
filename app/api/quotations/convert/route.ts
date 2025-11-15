import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { StockMovementType, InvoiceStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { quotationId } = await request.json();

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const quotation = await db.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: true,
        client: true,
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Generate invoice number
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    const invoiceNumber = lastInvoice
      ? `INV-${(parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1)
          .toString()
          .padStart(4, "0")}`
      : "INV-0001";

    const amount = Number(quotation.amount);
    const taxAmount = Number(quotation.taxAmount);
    const totalAmount = Number(quotation.totalAmount);

    const discountAmount = Number(quotation.discountAmount || 0);
    const discountType = quotation.discountType;

    // Use the existing depositAmount from quotation (already calculated)
    const depositAmount = Number(quotation.depositAmount || 0);

    // Get or create payment category for invoice payments
    let paymentCategory = await db.category.findFirst({
      where: {
        name: "Invoice Payments",
        type: "INCOME",
      },
    });

    if (!paymentCategory) {
      paymentCategory = await db.category.create({
        data: {
          name: "Invoice Payments",
          type: "INCOME",
          description: "Payments received from invoices",
          createdBy: creator.id,
        },
      });
    }

    // Perform the entire operation in a single transaction
    const result = await db.$transaction(async (prisma) => {
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          clientId: quotation.clientId,
          amount,
          currency: quotation.currency || "ZAR",
          status: depositAmount > 0 ? "PARTIALLY_PAID" : "DRAFT",
          issueDate: new Date(),
          dueDate: new Date(quotation.validUntil),
          description: quotation.description || undefined,
          taxAmount,
          taxRate: quotation.taxRate || 0,
          discountAmount: discountAmount,
          discountType: discountType,
          totalAmount,
          paymentTerms: quotation.paymentTerms || undefined,
          notes: quotation.notes || undefined,
          createdBy: creator.id,
          depositRequired: quotation.depositRequired || false,
          depositType: quotation.depositType,
          depositAmount: depositAmount,
          depositRate:
            quotation.depositType === "PERCENTAGE"
              ? quotation.depositAmount
              : 0,
        },
      });

      await prisma.invoiceItem.createMany({
        data: quotation.items.map((item) => ({
          invoiceId: invoice.id,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          amount: Number(item.amount),
          currency: quotation.currency || "ZAR",
          taxRate: Number(item.taxRate),
          taxAmount: Number(item.taxAmount),
          shopProductId: item.shopProductId,
        })),
      });

      // Create deposit payment if quotation has deposit
      if (quotation.depositRequired && depositAmount > 0) {
        const payment = await prisma.invoicePayment.create({
          data: {
            invoiceId: invoice.id,
            amount: depositAmount,
            method: "INVOICE",
            reference: `DEPOSIT-${invoiceNumber}`,
            notes: `Initial deposit payment from quotation ${quotation.quotationNumber}`,
            paidAt: new Date(),
            status: "COMPLETED",
          },
        });

        // Create transaction record for deposit
        await prisma.transaction.create({
          data: {
            amount: depositAmount,
            currency: "ZAR",
            type: "INCOME",
            status: "COMPLETED",
            description: `Deposit payment for invoice ${invoiceNumber} from ${quotation.client.name}`,
            reference: payment.id,
            date: new Date(),
            method: "INVOICE",
            invoiceId: invoice.id,
            clientId: quotation.clientId,
            categoryId: paymentCategory.id,
            createdBy: creator.id,
            taxAmount: 0,
            netAmount: depositAmount,
            invoiceNumber: invoice.invoiceNumber,
          },
        });

        // Update invoice status based on deposit amount
        if (depositAmount >= totalAmount) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: InvoiceStatus.PAID,
            },
          });
        }
      }

      // Check if quotation has shop products and create sale if needed
      const itemsWithProducts = quotation.items.filter(
        (item) => item.shopProductId
      );

      let sale = null;

      if (itemsWithProducts.length > 0) {
        // Generate sale number
        const lastSale = await prisma.sale.findFirst({
          orderBy: { createdAt: "desc" },
          select: { saleNumber: true },
        });

        const saleNumber = lastSale
          ? `SALE-${(parseInt(lastSale.saleNumber.split("-")[1]) + 1)
              .toString()
              .padStart(4, "0")}`
          : "SALE-0001";

        // Get client information for the sale
        const client = await prisma.client.findUnique({
          where: { id: quotation.clientId },
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
          const existingCustomer = await prisma.customer.findFirst({
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

        // Calculate product-specific totals for sales
        const productsSubtotal = itemsWithProducts.reduce(
          (sum: number, item: any) =>
            sum + Number(item.unitPrice) * Number(item.quantity),
          0
        );

        const productsTax = itemsWithProducts.reduce(
          (sum: number, item: any) => sum + (Number(item.taxAmount) || 0),
          0
        );

        const productsTotal = productsSubtotal + productsTax;

        // Create the sale with PRODUCT totals, not invoice totals
        sale = await prisma.sale.create({
          data: {
            saleNumber,
            customerId: customerId,
            customerName: client?.name || "Invoice Customer",
            customerEmail: client?.email,
            customerPhone: client?.phone,
            customerAddress: client?.address,
            status: "COMPLETED",
            subtotal: Number(productsSubtotal), // Product subtotal only
            tax: Number(productsTax), // Product tax only
            total: Number(productsTotal), // Product total only
            paymentStatus: "COMPLETED",
            paymentMethod: "INVOICE",
            amountReceived: Number(productsTotal), // Product total only
            saleDate: new Date(),
            createdBy: creator.id,
            orderId: invoice.id,
          },
        });

        // Create sale items and update product stock
        for (const item of itemsWithProducts) {
          const shopProductId = item.shopProductId;
          const quantity = Math.floor(Number(item.quantity));

          if (!shopProductId) continue;

          // Create sale item
          await prisma.saleItem.create({
            data: {
              saleId: sale.id,
              shopProductId: shopProductId,
              quantity: quantity,
              price: Number(item.unitPrice),
              total: Number(item.amount),
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
        }
      }

      // Update quotation status - THIS MUST BE INSIDE THE TRANSACTION
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: "CONVERTED",
          acceptedDate: new Date(),
          convertedToInvoice: true,
          invoiceId: invoice.id,
        },
      });

      return { invoice, sale };
    }); // Transaction ends here

    // Create notifications - OUTSIDE the transaction
    await db.notification.create({
      data: {
        title: "Quotation Converted",
        message: `Quotation ${quotation.quotationNumber} has been converted by ${creator.name}.${quotation.depositRequired ? " A deposit payment has been recorded." : ""}`,
        type: "QUOTATION",
        isRead: false,
        actionUrl: `/dashboard/quotations/${quotation.id}`,
        userId: creator.id,
      },
    });

    await db.notification.create({
      data: {
        title: "New Invoice Created",
        message: `Invoice ${result.invoice.invoiceNumber} has been created by ${creator.name}.${quotation.depositRequired ? " A deposit payment has been recorded." : ""}`,
        type: "INVOICE",
        isRead: false,
        actionUrl: `/dashboard/invoices/${result.invoice.id}`,
        userId: creator.id,
      },
    });

    // Create sale notification if sale was created
    if (result.sale) {
      await db.notification.create({
        data: {
          title: "New Sale Created",
          message: `Sale for ${result.invoice.invoiceNumber} has been created by ${creator.name}.${quotation.depositRequired ? " A deposit payment has been recorded." : ""}`,
          type: "SALE",
          isRead: false,
          actionUrl: `/dashboard/shop/sales/${result.sale.id}`,
          userId: creator.id,
        },
      });

      // Create stock movement notification
      await db.notification.create({
        data: {
          title: "Stock Updated",
          message: `Stock levels have been updated for products from sale ${result.sale.saleNumber}`,
          type: "SALE",
          isRead: false,
          actionUrl: `/dashboard/shop/inventory`,
          userId: creator.id,
        },
      });
    }

    return NextResponse.json({ invoice: result.invoice });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Failed to convert quotation" },
      { status: 500 }
    );
  }
}
