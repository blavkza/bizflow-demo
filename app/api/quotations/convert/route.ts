import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { StockMovementType } from "@prisma/client";
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
      ? `INV-${parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1}`
      : "INV-0001";

    const amount = Number(quotation.amount);
    const taxAmount = Number(quotation.taxAmount);
    const totalAmount = Number(quotation.totalAmount);

    // FIX: Store the ORIGINAL discount values from quotation, not calculated amounts
    const discountAmount = Number(quotation.discountAmount || 0);
    const discountType = quotation.discountType;
    const discountPercentage =
      discountType === "PERCENTAGE" ? discountAmount : 0;

    // Create the invoice with required createdBy field
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        clientId: quotation.clientId,
        amount,
        currency: quotation.currency || "ZAR",
        status: "DRAFT",
        issueDate: new Date(),
        dueDate: new Date(quotation.validUntil),
        description: quotation.description || undefined,
        taxAmount,
        taxRate: quotation.taxRate || 0,
        discountAmount: discountAmount, // Store original discount value (5 for 5%)
        discountType: discountType, // Store original discount type
        totalAmount,
        paymentTerms: quotation.paymentTerms || undefined,
        notes: quotation.notes || undefined,
        createdBy: creator.id,
      },
    });

    // Create invoice items
    await db.invoiceItem.createMany({
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

    // Check if quotation has shop products and create sale if needed
    const itemsWithProducts = quotation.items.filter(
      (item) => item.shopProductId
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

      // FIX: Calculate the actual discount amount for the sale record
      let calculatedDiscountAmount = 0;
      if (discountType === "PERCENTAGE" && discountAmount > 0) {
        calculatedDiscountAmount =
          (amount + taxAmount) * (discountAmount / 100);
      } else if (discountType === "AMOUNT" && discountAmount > 0) {
        calculatedDiscountAmount = discountAmount;
      }

      // Create the sale with proper discount calculation
      const sale = await db.sale.create({
        data: {
          saleNumber,
          customerId: customerId,
          customerName: client?.name || "Invoice Customer",
          customerEmail: client?.email,
          customerPhone: client?.phone,
          customerAddress: client?.address,
          status: "COMPLETED",
          subtotal: Number(amount),
          tax: Number(taxAmount),
          discount: calculatedDiscountAmount,
          discountPercent: discountPercentage,
          total: Number(totalAmount),
          paymentStatus: "COMPLETED",
          paymentMethod: "INVOICE",
          amountReceived: Number(totalAmount),
          saleDate: new Date(),
          createdBy: creator.id,
          orderId: invoice.id,
        },
      });

      // Create sale items and update product stock in smaller transactions
      for (const item of itemsWithProducts) {
        const shopProductId = item.shopProductId;
        const quantity = Math.floor(Number(item.quantity));

        if (!shopProductId) continue;

        // Use a separate transaction for each product to avoid timeout
        await db.$transaction(async (prisma) => {
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
        });
      }
    }

    // Update quotation status
    await db.quotation.update({
      where: { id: quotationId },
      data: {
        status: "CONVERTED",
        acceptedDate: new Date(),
        convertedToInvoice: true,
        invoiceId: invoice.id,
      },
    });

    await db.notification.create({
      data: {
        title: "Quotation Converted",
        message: `Quotation ${quotation.quotationNumber} has been converted by ${creator.name}.`,
        type: "QUOTATION",
        isRead: false,
        actionUrl: `/dashboard/quotations/${quotation.id}`,
        userId: creator.id,
      },
    });

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

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Failed to convert quotation" },
      { status: 500 }
    );
  }
}
