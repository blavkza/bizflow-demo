import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { InvoiceStatus, StockMovementType, DiscountType } from "@prisma/client";

// --- HELPER: Safe Float Conversion ---
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

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const updater = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });
    if (!updater) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { items, ...invoiceData } = body;

    // 1. Get Original Invoice (to check for deposit changes)
    const originalInvoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!originalInvoice)
      return new NextResponse("Invoice not found", { status: 404 });

    // --- CALCULATION LOGIC (Matching POST logic) ---

    // 2. PASS 1: Item Calculations (Gross & Item Discounts)
    let subtotalGross = 0;
    let totalItemDiscountMoney = 0;

    const itemsWithCalculations = items.map((item: any) => {
      const quantity = safeFloat(item.quantity);
      const unitPrice = safeFloat(item.unitPrice);
      const taxRate = safeFloat(item.taxRate);
      const inputDiscountVal = safeFloat(item.itemDiscountAmount);

      const baseAmount = quantity * unitPrice; // Gross

      let itemDiscountMoney = 0;
      if (item.itemDiscountType === "PERCENTAGE") {
        itemDiscountMoney = baseAmount * (inputDiscountVal / 100);
      } else if (item.itemDiscountType === "AMOUNT") {
        itemDiscountMoney = inputDiscountVal;
      }
      itemDiscountMoney = Math.min(itemDiscountMoney, baseAmount);

      const netAmount = baseAmount - itemDiscountMoney;

      subtotalGross += baseAmount;
      totalItemDiscountMoney += itemDiscountMoney;

      return {
        ...item,
        quantity,
        unitPrice,
        amount: baseAmount, // Store Gross
        itemDiscountMoney,
        netAmount,
        taxRate,
        inputDiscountVal,
        shopProductId: item.shopProductId || null,
        serviceId: item.serviceId || null,
        itemDiscountType: item.itemDiscountType || null,
        itemDiscountAmount: inputDiscountVal,
        details: item.details || null,
      };
    });

    // 3. PASS 2: Global Discount
    const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscountMoney;
    const inputGlobalDiscountVal = safeFloat(invoiceData.discountAmount);

    let globalDiscountMoney = 0;
    if (invoiceData.discountType === "PERCENTAGE") {
      globalDiscountMoney =
        subtotalAfterItemDiscounts * (inputGlobalDiscountVal / 100);
    } else if (invoiceData.discountType === "AMOUNT") {
      globalDiscountMoney = inputGlobalDiscountVal;
    }
    globalDiscountMoney = Math.min(
      globalDiscountMoney,
      subtotalAfterItemDiscounts
    );

    // 4. PASS 3: Tax Distribution
    let totalTax = 0;
    const finalItems = itemsWithCalculations.map((item: any) => {
      const ratio =
        subtotalAfterItemDiscounts > 0
          ? item.netAmount / subtotalAfterItemDiscounts
          : 0;
      const allocatedGlobalDiscount = globalDiscountMoney * ratio;
      const finalTaxableAmount = item.netAmount - allocatedGlobalDiscount;
      const taxAmount = (finalTaxableAmount * item.taxRate) / 100;
      totalTax += taxAmount;

      return { ...item, taxAmount };
    });

    // 5. Final Totals
    const finalSubtotal = subtotalAfterItemDiscounts - globalDiscountMoney;
    const totalAmount = finalSubtotal + totalTax;
    const effectiveTaxRate =
      finalSubtotal > 0 ? (totalTax / finalSubtotal) * 100 : 0;

    // 6. Deposit Logic
    let calculatedDepositAmount = 0;
    if (invoiceData.depositRequired) {
      if (
        invoiceData.depositType === "PERCENTAGE" &&
        invoiceData.depositAmount
      ) {
        calculatedDepositAmount =
          totalAmount * (safeFloat(invoiceData.depositAmount) / 100);
      } else if (
        invoiceData.depositType === "AMOUNT" &&
        invoiceData.depositAmount
      ) {
        calculatedDepositAmount = safeFloat(invoiceData.depositAmount);
      }
      calculatedDepositAmount = Math.min(calculatedDepositAmount, totalAmount);
    }

    // Check for Deposit Changes
    const originalDepositRequired = originalInvoice.depositRequired || false;
    const originalDepositVal = safeFloat(originalInvoice.depositAmount);
    // We check if the requirement changed OR if the calculated amount significantly changed (> 1 cent difference)
    const depositChanged =
      originalDepositRequired !== invoiceData.depositRequired ||
      Math.abs(originalDepositVal - calculatedDepositAmount) > 0.01;

    // --- RECURRING LOGIC ---
    let recurringInvoiceData = {};
    if (invoiceData.isRecurring && invoiceData.frequency) {
      const existingRecurring = await db.recurringInvoice.findFirst({
        where: { id: originalInvoice.recurringId || undefined },
      });

      if (existingRecurring) {
        await db.recurringInvoice.update({
          where: { id: existingRecurring.id },
          data: {
            frequency: invoiceData.frequency,
            interval: invoiceData.interval || 1,
            startDate: new Date(invoiceData.issueDate),
            endDate: invoiceData.endDate ? new Date(invoiceData.endDate) : null,
            description: invoiceData.description,
            items: finalItems, // Store full item structure in JSON
            currency: invoiceData.currency || "ZAR",
            discountAmount: inputGlobalDiscountVal,
            discountType: invoiceData.discountType,
            paymentTerms: invoiceData.paymentTerms,
            notes: invoiceData.notes,
            depositRequired: invoiceData.depositRequired || false,
            depositType: invoiceData.depositType,
            depositAmount: calculatedDepositAmount,
          },
        });
        recurringInvoiceData = { recurringId: existingRecurring.id };
      } else {
        const nextDate = calculateNextDate(
          new Date(invoiceData.issueDate),
          invoiceData.frequency,
          invoiceData.interval || 1
        );
        const recurringInvoice = await db.recurringInvoice.create({
          data: {
            clientId: invoiceData.clientId,
            frequency: invoiceData.frequency,
            interval: invoiceData.interval || 1,
            startDate: new Date(invoiceData.issueDate),
            endDate: invoiceData.endDate ? new Date(invoiceData.endDate) : null,
            nextDate,
            status: "ACTIVE",
            description: invoiceData.description,
            items: finalItems,
            currency: invoiceData.currency || "ZAR",
            discountAmount: inputGlobalDiscountVal,
            discountType: invoiceData.discountType,
            paymentTerms: invoiceData.paymentTerms,
            notes: invoiceData.notes,
            depositRequired: invoiceData.depositRequired || false,
            depositType: invoiceData.depositType,
            depositAmount: calculatedDepositAmount,
            creator: updater.id,
          },
        });
        recurringInvoiceData = { recurringId: recurringInvoice.id };
      }
    } else if (originalInvoice.recurringId) {
      recurringInvoiceData = { recurringId: null };
    }

    // --- TRANSACTION ---
    const result = await db.$transaction(
      async (prisma) => {
        // A. Update Invoice Header
        const updatedInvoice = await prisma.invoice.update({
          where: { id: params.id },
          data: {
            issueDate: new Date(invoiceData.issueDate),
            dueDate: new Date(invoiceData.dueDate),
            status: invoiceData.status, // Be careful overwriting status if deposit logic below changes it
            description: invoiceData.description,
            currency: invoiceData.currency || "ZAR",

            // Financials
            amount: subtotalGross,
            taxAmount: totalTax,
            taxRate: effectiveTaxRate,
            discountAmount: inputGlobalDiscountVal,
            discountType: invoiceData.discountType,
            totalAmount,

            // Deposit
            depositRequired: invoiceData.depositRequired || false,
            depositType: invoiceData.depositType,
            depositAmount:
              calculatedDepositAmount > 0 ? calculatedDepositAmount : null,
            depositRate:
              invoiceData.depositType === "PERCENTAGE"
                ? safeFloat(invoiceData.depositAmount)
                : 0,

            paymentTerms: invoiceData.paymentTerms,
            notes: invoiceData.notes,
            isRecurring: invoiceData.isRecurring || false,

            client: { connect: { id: invoiceData.clientId } },
            ...recurringInvoiceData,
          },
        });

        // B. Replace Items
        await prisma.invoiceItem.deleteMany({
          where: { invoiceId: params.id },
        });

        const createdItems = await prisma.invoiceItem.createMany({
          data: finalItems.map((item: any) => ({
            invoiceId: params.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount, // Gross
            currency: invoiceData.currency || "ZAR",
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            shopProductId: item.shopProductId,
            serviceId: item.serviceId,
            itemDiscountType: item.itemDiscountType,
            itemDiscountAmount: item.itemDiscountAmount,
            details: item.details || null,
          })),
        });

        // C. Handle Deposit Changes
        if (depositChanged) {
          await handleDepositPaymentUpdate(
            prisma, // Pass prisma instance for transaction
            updatedInvoice,
            calculatedDepositAmount,
            totalAmount,
            invoiceData,
            updater,
            originalDepositVal
          );
        }

        // D. Handle Shop Products (Update Sale Record)
        const itemsWithProducts = finalItems.filter(
          (item: any) => item.shopProductId
        );

        // Calculate Sale Totals from Product Items Only
        let saleGross = 0;
        let saleDiscount = 0;
        let saleTax = 0;

        itemsWithProducts.forEach((item: any) => {
          saleGross += item.amount;
          saleDiscount += item.itemDiscountMoney;
          saleTax += item.taxAmount;
        });
        const saleTotal = saleGross - saleDiscount + saleTax;

        if (itemsWithProducts.length > 0) {
          const existingSale = await prisma.sale.findFirst({
            where: { orderId: params.id },
            include: { items: true },
          });

          if (existingSale) {
            // Update Sale Header
            await prisma.sale.update({
              where: { id: existingSale.id },
              data: {
                subtotal: saleGross,
                discount: saleDiscount,
                tax: saleTax,
                total: saleTotal,
                amountReceived: saleTotal, // Assuming paid via invoice
              },
            });

            // Update Stock Logic (Complex: Diffing old vs new quantities)
            // Ideally, reverse previous stock movements for this sale, then apply new ones.
            // For brevity in this PUT, we assume direct quantity updates if product IDs match,
            // or complete replacement if items changed drastically.

            // Simple approach: Restore old stock, then deduct new stock
            for (const oldItem of existingSale.items) {
              if (oldItem.shopProductId) {
                await prisma.shopProduct.update({
                  where: { id: oldItem.shopProductId },
                  data: { stock: { increment: Number(oldItem.quantity) } },
                });
                // Log return?
              }
            }

            // Clear old sale items
            await prisma.saleItem.deleteMany({
              where: { saleId: existingSale.id },
            });

            // Create new sale items & deduct stock
            for (const newItem of itemsWithProducts) {
              const qty = Math.floor(newItem.quantity);
              if (!newItem.shopProductId) continue;

              await prisma.saleItem.create({
                data: {
                  saleId: existingSale.id,
                  shopProductId: newItem.shopProductId,
                  quantity: qty,
                  price: newItem.unitPrice,
                  total: newItem.netAmount, // Store Net
                },
              });

              await prisma.shopProduct.update({
                where: { id: newItem.shopProductId },
                data: { stock: { decrement: qty } },
              });

              // Log movement
              await prisma.stockMovement.create({
                data: {
                  shopProductId: newItem.shopProductId,
                  type: StockMovementType.ADJUSTMENT, // Mark as adjustment
                  quantity: qty,
                  previousStock: 0, // Ideally fetch this, but for now 0 or skip
                  newStock: 0,
                  reason: `Invoice  Update`,
                  reference: existingSale.saleNumber,
                  creater: updater.name,
                },
              });
            }
          }
        }

        return updatedInvoice;
      },
      { timeout: 30000, maxWait: 30000 }
    );

    // Notification
    await db.notification.create({
      data: {
        title: "Invoice Updated",
        message: `Invoice ${result.invoiceNumber} has been updated by ${updater.name}.`,
        type: "INVOICE",
        isRead: false,
        actionUrl: `/dashboard/invoices/${result.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Invoice update error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// --- HELPER FUNCTIONS ---

function calculateNextDate(start: Date, freq: string, interval: number): Date {
  const date = new Date(start);
  switch (freq) {
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

async function handleDepositPaymentUpdate(
  prisma: any,
  invoice: any,
  calculatedDepositAmount: number,
  totalAmount: number,
  invoiceData: any,
  updater: any,
  originalDepositAmount: number
) {
  // Get the deposit payment linked to this invoice
  const existingPayment = await prisma.invoicePayment.findFirst({
    where: {
      invoiceId: invoice.id,
      reference: { contains: "DEPOSIT" },
    },
  });

  if (existingPayment) {
    // Update or Cancel existing payment
    if (invoiceData.depositRequired && calculatedDepositAmount > 0) {
      // Update Amount
      await prisma.invoicePayment.update({
        where: { id: existingPayment.id },
        data: {
          amount: calculatedDepositAmount,
          notes: `Deposit updated. Old: ${existingPayment.amount}`,
        },
      });

      // Update Transaction
      await prisma.transaction.updateMany({
        where: { reference: existingPayment.id },
        data: {
          amount: calculatedDepositAmount,
          netAmount: calculatedDepositAmount,
        },
      });
    } else {
      // Cancel it
      await prisma.invoicePayment.update({
        where: { id: existingPayment.id },
        data: { status: "CANCELLED", notes: "Deposit requirement removed" },
      });
      await prisma.transaction.updateMany({
        where: { reference: existingPayment.id },
        data: { status: "CANCELLED" },
      });
    }
  } else if (invoiceData.depositRequired && calculatedDepositAmount > 0) {
    // Create new if it didn't exist before
    const paymentCategory = await getPaymentCategory(prisma, updater.id);

    const payment = await prisma.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        amount: calculatedDepositAmount,
        method: "INVOICE",
        reference: `DEPOSIT-${invoice.invoiceNumber}`,
        notes: "Deposit added during update",
        paidAt: new Date(),
        status: "COMPLETED",
      },
    });

    await prisma.transaction.create({
      data: {
        amount: calculatedDepositAmount,
        currency: "ZAR",
        type: "INCOME",
        status: "COMPLETED",
        description: `Deposit payment for invoice ${invoice.invoiceNumber}`,
        reference: payment.id,
        date: new Date(),
        method: "INVOICE",
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        categoryId: paymentCategory.id,
        createdBy: updater.id,
        taxAmount: 0,
        netAmount: calculatedDepositAmount,
        invoiceNumber: invoice.invoiceNumber,
      },
    });
  }

  // Update Invoice Status based on new totals
  let newStatus = invoice.status;
  if (calculatedDepositAmount >= totalAmount) {
    newStatus = InvoiceStatus.PAID;
  } else if (calculatedDepositAmount > 0) {
    newStatus = InvoiceStatus.PARTIALLY_PAID;
  } else if (invoice.status === InvoiceStatus.PARTIALLY_PAID) {
    // Revert to SENT if deposit removed
    newStatus = InvoiceStatus.SENT;
  }

  if (newStatus !== invoice.status) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: newStatus },
    });
  }
}

async function getPaymentCategory(prisma: any, userId: string) {
  let cat = await prisma.category.findFirst({
    where: { name: "Invoice Payments", type: "INCOME" },
  });
  if (!cat) {
    cat = await prisma.category.create({
      data: {
        name: "Invoice Payments",
        type: "INCOME",
        description: "Payments received from invoices",
        createdBy: userId,
      },
    });
  }
  return cat;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        items: true,
        payments: {
          orderBy: {
            paidAt: "desc",
          },
        },
        creator: {
          select: {
            GeneralSetting: true,
            name: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return new NextResponse("Invoice Not Found", { status: 401 });
    }

    await db.invoiceItem.deleteMany({
      where: { invoiceId: params.id },
    });

    // Then delete the invoice
    const deletedInvoice = await db.invoice.delete({
      where: { id: params.id },
    });

    await db.notification.create({
      data: {
        title: "Invoice Deleted",
        message: `Invoice ${invoice?.invoiceNumber} , has been deleted By ${creator.name}.`,
        type: "INVOICE",
        isRead: false,
        userId: creator.id,
      },
    });

    return NextResponse.json(deletedInvoice);
  } catch (error) {
    console.error("Invoice deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
