import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { StockMovementType, InvoiceStatus } from "@prisma/client";
import { NextResponse } from "next/server";

// Helper: Robustly convert Prisma Decimal / Strings to Number
const safeFloat = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && typeof val.toNumber === "function") {
    return val.toNumber();
  }
  if (typeof val === "object" && typeof val.toString === "function") {
    return parseFloat(val.toString());
  }
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? 0 : parsed;
};

export async function POST(request: Request) {
  try {
    const { quotationId } = await request.json();
    const { userId } = await auth();

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!creator)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quotation = await db.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true, client: true },
    });

    if (!quotation)
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );

    // Generate invoice number
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    const invoiceNumber = lastInvoice
      ? `INV-${(parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1).toString().padStart(4, "0")}`
      : "INV-0001";

    const depositAmount = safeFloat(quotation.depositAmount);

    let paymentCategory = await db.category.findFirst({
      where: { name: "Invoice Payments", type: "INCOME" },
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

    // --- START TRANSACTION ---
    const result = await db.$transaction(
      async (prisma) => {
        // 1. Create Invoice Header
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            clientId: quotation.clientId,
            projectId: quotation.projectId,
            amount: safeFloat(quotation.amount),
            currency: quotation.currency || "ZAR",
            status: depositAmount > 0 ? "PARTIALLY_PAID" : "DRAFT",
            issueDate: new Date(),
            dueDate: new Date(quotation.validUntil),
            description: quotation.description,
            taxAmount: safeFloat(quotation.taxAmount),
            taxRate: safeFloat(quotation.taxRate),
            discountAmount: safeFloat(quotation.discountAmount),
            discountType: quotation.discountType,
            totalAmount: safeFloat(quotation.totalAmount),
            depositRequired: quotation.depositRequired,
            depositType: quotation.depositType,
            depositAmount: safeFloat(quotation.depositAmount),
            depositRate: safeFloat(quotation.depositRate),
            paymentTerms: quotation.paymentTerms,
            notes: quotation.notes,
            terms: quotation.terms,
            createdBy: creator.id,
          },
        });

        // 2. Create Invoice Items
        await prisma.invoiceItem.createMany({
          data: quotation.items.map((item) => ({
            invoiceId: invoice.id,
            description: item.description,
            quantity: safeFloat(item.quantity),
            unitPrice: safeFloat(item.unitPrice),
            amount: safeFloat(item.amount),
            currency: quotation.currency || "ZAR",
            taxRate: safeFloat(item.taxRate),
            taxAmount: safeFloat(item.taxAmount),
            shopProductId: item.shopProductId,
            serviceId: item.serviceId,
            itemDiscountType: item.itemDiscountType,
            itemDiscountAmount: safeFloat(item.itemDiscountAmount),
          })),
        });

        // 3. UPDATE SERVICE REVENUE (Aggregated)
        const itemsWithServices = quotation.items.filter(
          (item) => item.serviceId
        );
        if (itemsWithServices.length > 0) {
          const serviceUpdates = new Map<string, number>();

          for (const item of itemsWithServices) {
            if (!item.serviceId) continue;

            const qty = safeFloat(item.quantity);
            const price = safeFloat(item.unitPrice);
            const grossAmount = qty * price;

            // 2. Calculate Discount Value
            const discInput = safeFloat(item.itemDiscountAmount);
            let discountVal = 0;

            if (item.itemDiscountType === "PERCENTAGE") {
              discountVal = grossAmount * (discInput / 100);
            } else if (item.itemDiscountType === "AMOUNT") {
              discountVal = discInput;
            }

            // Cap discount so revenue doesn't go negative
            discountVal = Math.min(discountVal, grossAmount);

            // 3. Net Amount (Revenue after discount)
            const netRevenue = grossAmount - discountVal;

            // 4. Aggregate
            const currentTotal = serviceUpdates.get(item.serviceId) || 0;
            serviceUpdates.set(item.serviceId, currentTotal + netRevenue);
          }

          for (const [serviceId, totalRevenue] of serviceUpdates.entries()) {
            await prisma.service.update({
              where: { id: serviceId },
              data: {
                revenue: { increment: totalRevenue },
              },
            });
          }
        }

        // 4. Create Deposit Payment
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

          if (depositAmount >= safeFloat(quotation.totalAmount)) {
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: { status: InvoiceStatus.PAID },
            });
          }
        }

        // 5. Handle Shop Products (Stock & Sales)
        // Filter for items that are products
        const itemsWithProducts = quotation.items.filter(
          (item) => item.shopProductId
        );
        let sale = null;

        if (itemsWithProducts.length > 0) {
          // --- 5a. CALCULATE SALE TOTALS FROM ITEM DISCOUNTS ---
          let saleGrossSubtotal = 0;
          let saleTotalDiscount = 0;
          let saleTotalTax = 0;

          // Prepare sale items payload with calculations
          const saleItemsPayload = itemsWithProducts.map((item) => {
            const qty = safeFloat(item.quantity);
            const price = safeFloat(item.unitPrice);
            const taxRate = safeFloat(item.taxRate);
            const discInput = safeFloat(item.itemDiscountAmount);

            // 1. Gross Amount (Qty * Price)
            const gross = qty * price;

            // 2. Calculate Discount Money
            let discountVal = 0;
            if (item.itemDiscountType === "PERCENTAGE") {
              discountVal = gross * (discInput / 100);
            } else if (item.itemDiscountType === "AMOUNT") {
              discountVal = discInput;
            }

            // Cap discount at gross amount
            discountVal = Math.min(discountVal, gross);

            // 3. Net Amount
            const net = gross - discountVal;

            // 4. Tax Amount
            const tax = net * (taxRate / 100);

            // Aggregate for Sale Header
            saleGrossSubtotal += gross;
            saleTotalDiscount += discountVal;
            saleTotalTax += tax;

            return {
              shopProductId: item.shopProductId!,
              quantity: qty,
              price: price,
              total: net, // Sale Item total is usually the Net Amount (Customer price)
            };
          });

          const saleFinalTotal =
            saleGrossSubtotal - saleTotalDiscount + saleTotalTax;

          // 5b. Generate Sale Number
          const lastSale = await prisma.sale.findFirst({
            orderBy: { createdAt: "desc" },
            select: { saleNumber: true },
          });

          const saleNumber = lastSale
            ? `SALE-${(parseInt(lastSale.saleNumber.split("-")[1]) + 1).toString().padStart(4, "0")}`
            : "SALE-0001";

          // 5c. Customer Logic
          const client = quotation.client;
          let customerId: string | undefined;

          if (client?.email) {
            const existingCustomer = await prisma.customer.findFirst({
              where: { email: client.email },
            });
            customerId = existingCustomer?.id;
          }

          if (!customerId) {
            const newCustomer = await prisma.customer.create({
              data: {
                firstName: client?.name?.split(" ")[0] || "Invoice",
                lastName:
                  client?.name?.split(" ").slice(1).join(" ") || "Customer",
                email: client?.email || `invoice-${invoiceNumber}@temp.com`,
                phone: client?.phone || "",
                address: client?.address || "",
                createdBy: creator.id,
              },
            });
            customerId = newCustomer.id;
          }

          // 5d. Create Sale Record
          // We use the explicitly calculated totals from the product items
          sale = await prisma.sale.create({
            data: {
              saleNumber,
              customerId,
              customerName: client.name,
              customerEmail: client.email,
              customerPhone: client.phone,
              customerAddress: client.address,
              status: "COMPLETED",

              subtotal: saleGrossSubtotal, // Sum of (Qty * Price)
              discount: saleTotalDiscount, // Sum of all item discounts
              tax: saleTotalTax, // Sum of tax on net amounts
              total: saleFinalTotal, // Final payable

              paymentStatus: "COMPLETED",
              paymentMethod: "INVOICE",
              amountReceived: saleFinalTotal,
              saleDate: new Date(),
              createdBy: creator.id,
              orderId: invoice.id,
            },
          });

          // 5e. Create Sale Items & Update Stock
          for (const itemPayload of saleItemsPayload) {
            await prisma.saleItem.create({
              data: {
                saleId: sale.id,
                shopProductId: itemPayload.shopProductId,
                quantity: itemPayload.quantity,
                price: itemPayload.price,
                total: itemPayload.total,
              },
            });

            const product = await prisma.shopProduct.findUnique({
              where: { id: itemPayload.shopProductId },
            });

            if (product) {
              const newStock = Math.max(
                0,
                product.stock - itemPayload.quantity
              );
              await prisma.shopProduct.update({
                where: { id: itemPayload.shopProductId },
                data: { stock: newStock },
              });

              await prisma.stockMovement.create({
                data: {
                  shopProductId: itemPayload.shopProductId,
                  type: StockMovementType.OUT,
                  quantity: itemPayload.quantity,
                  previousStock: product.stock,
                  newStock: newStock,
                  reason: `Sale from invoice ${invoiceNumber}`,
                  reference: sale.saleNumber,
                  creater: creator.name,
                },
              });
            }
          }
        }

        // 6. Update Quotation Status
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
      },
      {
        maxWait: 5000,
        timeout: 20000,
      }
    );

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

    return NextResponse.json({ invoice: result.invoice });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Failed to convert quotation" },
      { status: 500 }
    );
  }
}
