import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { InvoiceStatus, DiscountType, StockMovementType } from "@prisma/client";
import { z } from "zod";
import { InvoiceSchema } from "@/lib/formValidationSchemas";

// --- HELPER: Safe Number Conversion ---
// Handles Prisma Decimals, strings, and nulls safely
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
    const data = InvoiceSchema.parse(json);

    // --- GENERATE INVOICE NUMBER ---
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    const invoiceNumber = lastInvoice
      ? `INV-${(parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1)
          .toString()
          .padStart(4, "0")}`
      : "INV-0001";

    // --- CALCULATION LOGIC (Matches QuotationForm) ---

    // 1. PASS 1: Calculate Gross, Item Discounts, and Net Amounts
    let subtotalGross = 0;
    let totalItemDiscountMoney = 0;

    const itemsWithCalculations = data.items.map((item) => {
      const quantity = safeFloat(item.quantity);
      const unitPrice = safeFloat(item.unitPrice);
      const taxRate = safeFloat(item.taxRate);
      const inputDiscountVal = safeFloat(item.itemDiscountAmount);

      // Gross Base Amount
      const baseAmount = quantity * unitPrice;

      // Calculate Item Discount Money
      let itemDiscountMoney = 0;
      if (item.itemDiscountType === "PERCENTAGE") {
        itemDiscountMoney = baseAmount * (inputDiscountVal / 100);
      } else if (item.itemDiscountType === "AMOUNT") {
        itemDiscountMoney = inputDiscountVal;
      }

      // Cap discount
      itemDiscountMoney = Math.min(itemDiscountMoney, baseAmount);

      // Net Amount (Pre-Tax, Pre-Global Discount)
      const netAmount = baseAmount - itemDiscountMoney;

      // Accumulate
      subtotalGross += baseAmount;
      totalItemDiscountMoney += itemDiscountMoney;

      return {
        ...item,
        quantity,
        unitPrice,
        amount: baseAmount,
        details: item.details || null,
        itemDiscountMoney,
        netAmount,
        taxRate,
        inputDiscountVal,
        shopProductId: item.shopProductId || null,
        serviceId: item.serviceId || null,
        itemDiscountType: item.itemDiscountType || null,
        itemDiscountAmount: inputDiscountVal,
      };
    });

    // 2. PASS 2: Calculate Global Discount
    const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscountMoney;
    const inputGlobalDiscountVal = safeFloat(data.discountAmount);

    let globalDiscountMoney = 0;
    if (data.discountType === "PERCENTAGE") {
      globalDiscountMoney =
        subtotalAfterItemDiscounts * (inputGlobalDiscountVal / 100);
    } else if (data.discountType === "AMOUNT") {
      globalDiscountMoney = inputGlobalDiscountVal;
    }

    // Cap global discount
    globalDiscountMoney = Math.min(
      globalDiscountMoney,
      subtotalAfterItemDiscounts,
    );

    // 3. PASS 3: Distribute Global Discount & Calculate Tax
    let totalTax = 0;

    const finalItems = itemsWithCalculations.map((item) => {
      // Determine this item's share of the total net value
      const ratio =
        subtotalAfterItemDiscounts > 0
          ? item.netAmount / subtotalAfterItemDiscounts
          : 0;

      // Allocate portion of global discount
      const allocatedGlobalDiscount = globalDiscountMoney * ratio;

      // Final Taxable Amount
      const finalTaxableAmount = item.netAmount - allocatedGlobalDiscount;

      // Calculate Tax
      const taxAmount = (finalTaxableAmount * item.taxRate) / 100;

      totalTax += taxAmount;

      return {
        ...item,
        taxAmount, // Calculated tax per line
        finalTaxableAmount, // Useful for revenue tracking if needed
      };
    });

    // 4. Final Totals
    const finalSubtotal = subtotalAfterItemDiscounts - globalDiscountMoney;
    const totalAmount = finalSubtotal + totalTax;

    // Effective Tax Rate (for display)
    const effectiveTaxRate =
      finalSubtotal > 0 ? (totalTax / finalSubtotal) * 100 : 0;

    // 5. Deposit Calculation
    let calculatedDepositAmount = 0;
    if (data.depositRequired) {
      if (data.depositType === "PERCENTAGE" && data.depositAmount) {
        calculatedDepositAmount = totalAmount * (data.depositAmount / 100);
      } else if (data.depositType === "AMOUNT" && data.depositAmount) {
        calculatedDepositAmount = data.depositAmount;
      }
      // Cap deposit
      calculatedDepositAmount = Math.min(calculatedDepositAmount, totalAmount);
    }

    // Payment Category Setup
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

    // --- DATABASE TRANSACTION ---
    const result = await db.$transaction(
      async (prisma) => {
        // A. Create Invoice Header
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            clientId: data.clientId,
            project: data.project,

            // Financials
            amount: subtotalGross,
            currency: data.currency,
            status:
              calculatedDepositAmount > 0 ? "PARTIALLY_PAID" : data.status,

            issueDate: new Date(data.issueDate),
            dueDate: new Date(data.dueDate),

            description: data.description,
            paymentTerms: data.paymentTerms,
            notes: data.notes,

            // Calculated Totals
            taxAmount: totalTax,
            taxRate: effectiveTaxRate,
            discountAmount: inputGlobalDiscountVal,
            discountType: data.discountType,
            totalAmount: totalAmount + safeFloat(data.interestAmount),

            // Deposit
            depositRequired: data.depositRequired || false,
            depositType: data.depositType,
            depositAmount:
              calculatedDepositAmount > 0 ? calculatedDepositAmount : null,
            depositRate:
              data.depositType === "PERCENTAGE" ? data.depositAmount : 0,

            // Installment
            installmentPeriod: data.installmentPeriod || null,
            interestRate: data.interestRate || 0,
            interestAmount: data.interestAmount || 0,
            payRemainingImmediately: data.payRemainingImmediately ?? true,

            createdBy: creator.id,
          },
        });

        // B. Create Invoice Items
        await prisma.invoiceItem.createMany({
          data: finalItems.map((item) => ({
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount, // Gross
            currency: data.currency,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,

            // IDs
            shopProductId: item.shopProductId,
            serviceId: item.serviceId,

            // Item Discounts
            itemDiscountType: item.itemDiscountType,
            itemDiscountAmount: item.itemDiscountAmount,
            details: item.details || null,
          })),
        });

        // C. Update Service Revenue
        const itemsWithServices = finalItems.filter((item) => item.serviceId);

        if (itemsWithServices.length > 0) {
          const serviceUpdates = new Map<string, number>();

          for (const item of itemsWithServices) {
            if (!item.serviceId) continue;

            // Revenue = Net Amount (Gross - Item Discount)
            // This represents the actual revenue earned from the service
            const revenue = item.netAmount;

            const currentTotal = serviceUpdates.get(item.serviceId) || 0;
            serviceUpdates.set(item.serviceId, currentTotal + revenue);
          }

          for (const [serviceId, totalRevenue] of serviceUpdates.entries()) {
            await prisma.service.update({
              where: { id: serviceId },
              data: {
                revenue: { increment: totalRevenue },
                clients: { increment: 1 },
                activeProjects: { increment: 1 },
              },
            });
          }
        }

        // D. Handle Deposit Payment
        if (data.depositRequired && calculatedDepositAmount > 0) {
          const payment = await prisma.invoicePayment.create({
            data: {
              invoiceId: invoice.id,
              amount: calculatedDepositAmount,
              method: "INVOICE",
              reference: `DEPOSIT-${invoiceNumber}`,
              notes: `Initial deposit payment for invoice ${invoiceNumber}`,
              paidAt: new Date(data.issueDate),
              status: "COMPLETED",
            },
          });

          await prisma.transaction.create({
            data: {
              amount: calculatedDepositAmount,
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
              netAmount: calculatedDepositAmount,
              invoiceNumber: invoice.invoiceNumber,
            },
          });

          // Update status if fully paid by deposit (unlikely but possible)
          if (calculatedDepositAmount >= totalAmount) {
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: { status: InvoiceStatus.PAID },
            });
          }
        }

        // E. Handle Shop Products (Stock & Sale Creation)
        const itemsWithProducts = finalItems.filter(
          (item) => item.shopProductId,
        );

        if (itemsWithProducts.length > 0) {
          // 1. Calculate Sale Totals
          // We re-sum specific values for the Sale record based on the product items only
          let saleGross = 0;
          let saleDiscount = 0;
          let saleTax = 0;

          const saleItemsPayload = itemsWithProducts.map((item) => {
            saleGross += item.amount; // Gross
            saleDiscount += item.itemDiscountMoney; // Item Discount
            saleTax += item.taxAmount; // Tax

            // Sale Item Total is the NET amount (Gross - Discount)
            return {
              shopProductId: item.shopProductId!,
              quantity: item.quantity,
              price: item.unitPrice,
              total: item.netAmount,
            };
          });

          // Note: This does not currently apportion Global Discount to the Sale record.
          // It only counts item-level discounts for the Shop Sales tracking.
          const saleTotal = saleGross - saleDiscount + saleTax;

          // 2. Generate Sale Number
          const lastSale = await prisma.sale.findFirst({
            orderBy: { createdAt: "desc" },
            select: { saleNumber: true },
          });
          const saleNumber = lastSale
            ? `SALE-${(parseInt(lastSale.saleNumber.split("-")[1]) + 1).toString().padStart(4, "0")}`
            : "SALE-0001";

          // 3. Get Client/Customer
          const client = await prisma.client.findUnique({
            where: { id: data.clientId },
          });

          let customerId: string | undefined;
          if (client?.email) {
            const existingCustomer = await prisma.customer.findFirst({
              where: { email: client.email },
            });
            if (existingCustomer) customerId = existingCustomer.id;
          }

          if (!customerId && client) {
            const newCustomer = await prisma.customer.create({
              data: {
                firstName: client.name.split(" ")[0] || "Invoice",
                lastName:
                  client.name.split(" ").slice(1).join(" ") || "Customer",
                email: client.email || `invoice-${invoiceNumber}@temp.com`,
                phone: client.phone || "",
                address: client.address || "",
                createdBy: creator.id,
              },
            });
            customerId = newCustomer.id;
          }

          // 4. Create Sale
          const sale = await prisma.sale.create({
            data: {
              saleNumber,
              customerId: customerId,
              customerName: client?.name || "Invoice Customer",
              customerEmail: client?.email,
              customerPhone: client?.phone,
              customerAddress: client?.address,
              status: "COMPLETED",

              subtotal: saleGross,
              discount: saleDiscount,
              tax: saleTax,
              total: saleTotal,

              paymentStatus: "COMPLETED",
              paymentMethod: "INVOICE",
              amountReceived: saleTotal,
              saleDate: new Date(data.issueDate),
              createdBy: creator.id,
              orderId: invoice.id,
            },
          });

          // 5. Create Sale Items & Update Stock
          for (const payload of saleItemsPayload) {
            await prisma.saleItem.create({
              data: {
                saleId: sale.id,
                shopProductId: payload.shopProductId,
                quantity: payload.quantity,
                price: payload.price,
                total: payload.total,
              },
            });

            const product = await prisma.shopProduct.findUnique({
              where: { id: payload.shopProductId },
            });

            if (product) {
              const newStock = Math.max(0, product.stock - payload.quantity);

              await prisma.shopProduct.update({
                where: { id: payload.shopProductId },
                data: { stock: newStock },
              });

              await prisma.stockMovement.create({
                data: {
                  shopProductId: payload.shopProductId,
                  type: StockMovementType.OUT,
                  quantity: payload.quantity,
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

        return invoice;
      },
      {
        timeout: 30000,
        maxWait: 30000,
      },
    );

    // --- NOTIFICATION ---
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
        createdAt: "asc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("[INVOICES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
