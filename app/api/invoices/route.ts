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
      ? `INV-${(parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1)
          .toString()
          .padStart(4, "0")}`
      : "INV-0001";

    // 1. Calculate subtotal (original amount before discount)
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // 2. Calculate discount
    let discountAmount = 0;
    if (data.discountType === DiscountType.PERCENTAGE && data.discountAmount) {
      discountAmount = subtotal * (data.discountAmount / 100);
    } else if (
      data.discountType === DiscountType.AMOUNT &&
      data.discountAmount
    ) {
      discountAmount = data.discountAmount;
    }

    // Prevent discount from exceeding subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    // 3. Calculate discounted subtotal
    const discountedSubtotal = subtotal - discountAmount;

    // 4. Calculate tax on DISCOUNTED amount (proportionally per item)
    const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0;

    const itemsWithAmounts = data.items.map((item) => {
      const itemAmount = item.quantity * item.unitPrice;
      const discountedItemAmount = itemAmount - itemAmount * discountRatio;
      const taxAmount = item.taxRate
        ? (discountedItemAmount * item.taxRate) / 100
        : 0;

      return {
        ...item,
        amount: itemAmount,
        taxAmount,
      };
    });

    const totalTax = itemsWithAmounts.reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0
    );

    // 5. Total amount is discounted subtotal + tax
    const totalAmount = discountedSubtotal + totalTax;

    let calculatedDepositAmount = 0;
    if (data.depositRequired) {
      if (data.depositType === "PERCENTAGE" && data.depositAmount) {
        calculatedDepositAmount = totalAmount * (data.depositAmount / 100);
      } else if (data.depositType === "AMOUNT" && data.depositAmount) {
        calculatedDepositAmount = data.depositAmount;
      }

      // Ensure deposit cannot exceed total amount
      calculatedDepositAmount = Math.min(calculatedDepositAmount, totalAmount);
    }

    // 6. Calculate effective tax rate based on discounted subtotal
    const taxRate =
      discountedSubtotal > 0 ? (totalTax / discountedSubtotal) * 100 : 0;

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

    const result = await db.$transaction(
      async (prisma) => {
        // Create the invoice
        const invoice = await prisma.invoice.create({
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
            depositRequired: data.depositRequired || false,
            depositType: data.depositType,
            depositAmount: calculatedDepositAmount,
            depositRate:
              data.depositType === "PERCENTAGE" ? data.depositAmount : 0,
          },
        });

        // Create invoice items
        await prisma.invoiceItem.createMany({
          data: itemsWithAmounts.map((item) => ({
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount, // Original amount (quantity * unitPrice)
            currency: data.currency,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount, // Tax calculated on discounted item amount
            shopProductId: item.shopProductId || null,
          })),
        });

        // Handle deposit payment if required
        if (data.depositRequired && calculatedDepositAmount > 0) {
          await handleDepositPayment(prisma, {
            invoice,
            invoiceNumber,
            depositAmount: calculatedDepositAmount,
            totalAmount,
            data,
            creator,
            paymentCategory,
          });
        }

        return invoice;
      },
      {
        timeout: 30000,
        maxWait: 30000,
      }
    );

    // Handle shop products and sales outside the main transaction
    await handleShopProductsAndSales({
      itemsWithAmounts,
      data,
      creator,
      result,
      totalAmount,
      depositAmount: calculatedDepositAmount,
      invoiceNumber,
    });

    // Create notification
    await db.notification.create({
      data: {
        title: "New Invoice Created",
        message: `Invoice ${result.invoiceNumber} has been created by ${creator.name}.${data.depositRequired ? " A deposit payment has been recorded." : ""}`,
        type: "INVOICE",
        isRead: false,
        actionUrl: `/dashboard/invoices/${result.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[INVOICE_POST]", error);

    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 });
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Helper function to handle deposit payment
async function handleDepositPayment(
  prisma: any,
  params: {
    invoice: any;
    invoiceNumber: string;
    depositAmount: number;
    totalAmount: number;
    data: any;
    creator: any;
    paymentCategory: any;
  }
) {
  const {
    invoice,
    invoiceNumber,
    depositAmount,
    totalAmount,
    data,
    creator,
    paymentCategory,
  } = params;

  // Create invoice payment for deposit
  const payment = await prisma.invoicePayment.create({
    data: {
      invoiceId: invoice.id,
      amount: depositAmount,
      method: "INVOICE",
      reference: `DEPOSIT-${invoiceNumber}`,
      notes: `Initial deposit payment for invoice ${invoiceNumber}`,
      paidAt: new Date(data.issueDate),
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
      description: `Deposit payment for invoice ${invoiceNumber} from ${data.clientId}`,
      reference: payment.id,
      date: new Date(data.issueDate),
      method: "INVOICE",
      invoiceId: invoice.id,
      clientId: data.clientId,
      categoryId: paymentCategory.id,
      createdBy: creator.id,
      taxAmount: 0,
      netAmount: depositAmount,
      invoiceNumber: invoice.invoiceNumber,
    },
  });

  await db.notification.create({
    data: {
      title: "Transaction Created",
      message: `Transaction , has been Created By ${creator.name}.`,
      type: "PAYMENT",
      isRead: false,
      actionUrl: `/dashboard/transations`,
      userId: creator.id,
    },
  });

  // Update invoice status based on deposit
  let newStatus: InvoiceStatus = InvoiceStatus.PARTIALLY_PAID;
  if (depositAmount >= totalAmount) {
    newStatus = InvoiceStatus.PAID;
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: newStatus },
  });
}

// Helper function to handle shop products and sales
async function handleShopProductsAndSales(params: {
  itemsWithAmounts: any[];
  data: any;
  creator: any;
  result: any;
  totalAmount: number;
  depositAmount: number;
  invoiceNumber: string;
}) {
  const {
    itemsWithAmounts,
    data,
    creator,
    result,
    totalAmount,
    depositAmount,
    invoiceNumber,
  } = params;

  const itemsWithProducts = itemsWithAmounts.filter(
    (item) => (item as any).shopProductId
  );

  if (itemsWithProducts.length === 0) return;

  try {
    // Generate sale number
    const lastSale = await db.sale.findFirst({
      orderBy: { createdAt: "desc" },
      select: { saleNumber: true },
    });

    const saleNumber = lastSale
      ? `SALE-${(parseInt(lastSale.saleNumber.split("-")[1]) + 1)
          .toString()
          .padStart(4, "0")}`
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

    if (client?.email) {
      const existingCustomer = await db.customer.findFirst({
        where: { email: client.email },
      });
      if (existingCustomer) {
        customerId = existingCustomer.id;
      }
    }

    if (!customerId) {
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

    const productsTotal = itemsWithProducts.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const productsSubTotal = itemsWithProducts.reduce(
      (sum, item) => sum + item.unitPrice,
      0
    );

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
        subtotal: Number(productsSubTotal),
        total: Number(productsTotal),
        paymentStatus: "COMPLETED",
        paymentMethod: "INVOICE",
        amountReceived: Number(totalAmount),
        saleDate: new Date(data.issueDate),
        createdBy: creator.id,
        orderId: result.id,
      },
    });

    // Process sale items and update stock in batches
    for (const item of itemsWithProducts) {
      const shopProductId = (item as any).shopProductId;
      const quantity = Math.floor(item.quantity);

      // Create sale item
      await db.saleItem.create({
        data: {
          saleId: sale.id,
          shopProductId: shopProductId,
          quantity: quantity,
          price: item.unitPrice,
          total: item.amount,
        },
      });

      // Update product stock and create stock movement
      await updateProductStock(
        shopProductId,
        quantity,
        sale.saleNumber,
        creator.name,
        invoiceNumber
      );

      if (result.sale) {
        await db.notification.create({
          data: {
            title: "New Sale Created",
            message: `Sale for ${result.invoice.invoiceNumber} has been created by ${creator.name} `,
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
            message: `Stock levels have been updated for sale ${result.sale.saleNumber}`,
            type: "SALE",
            isRead: false,
            actionUrl: `/dashboard/shop/inventory`,
            userId: creator.id,
          },
        });
      }
    }
  } catch (error) {
    console.error("[SHOP_PRODUCTS_ERROR]", error);
  }
}

// Helper function to update product stock
async function updateProductStock(
  shopProductId: string,
  quantity: number,
  saleNumber: string,
  creatorName: string,
  invoiceNumber: string
) {
  const product = await db.shopProduct.findUnique({
    where: { id: shopProductId },
  });

  if (!product) return;

  const newStock = product.stock - quantity;

  // Update product stock
  await db.shopProduct.update({
    where: { id: shopProductId },
    data: {
      stock: Math.max(0, newStock),
    },
  });

  // Create stock movement record
  await db.stockMovement.create({
    data: {
      shopProductId: shopProductId,
      type: StockMovementType.OUT,
      quantity: quantity,
      previousStock: product.stock,
      newStock: Math.max(0, newStock),
      reason: `Sale from invoice ${invoiceNumber}`,
      reference: saleNumber,
      creater: creatorName,
    },
  });
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
        payments: true,
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
