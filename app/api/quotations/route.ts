import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { QuotationStatus, DiscountType, DepositType } from "@prisma/client";
import { z } from "zod";
import { QuotationSchema } from "@/lib/formValidationSchemas";
import { QuotationWithRelations } from "@/types/quotation";

// Helper to safe parse numbers
const safeNumber = (val: any) => (val ? Number(val) : 0);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!creator) return new NextResponse("Unauthorized", { status: 401 });

    const json = await req.json();
    const data = QuotationSchema.parse(json);

    // Validation
    const validUntil = new Date(data.validUntil);
    const issueDate = new Date(data.issueDate);
    if (validUntil < issueDate) {
      return new NextResponse("Valid until date must be after issue date", {
        status: 400,
      });
    }

    // --- PASS 1: Calculate Gross Totals & Item Discounts ---
    let subtotalGross = 0;
    let totalItemDiscountMoney = 0;

    const firstPassItems = data.items.map((item) => {
      const quantity = safeNumber(item.quantity);
      const unitPrice = safeNumber(item.unitPrice);
      const taxRate = safeNumber(item.taxRate);
      const inputDiscountVal = safeNumber(item.itemDiscountAmount);

      // 1. Gross Base Amount
      const baseAmount = quantity * unitPrice;

      // 2. Calculate Item Discount Money
      let itemDiscountMoney = 0;
      if (item.itemDiscountType === "PERCENTAGE") {
        itemDiscountMoney = baseAmount * (inputDiscountVal / 100);
      } else if (item.itemDiscountType === "AMOUNT") {
        itemDiscountMoney = inputDiscountVal;
      }
      itemDiscountMoney = Math.min(itemDiscountMoney, baseAmount);

      // 3. Net Amount (Before Global Discount)
      const netAmount = baseAmount - itemDiscountMoney;

      // Accumulate totals
      subtotalGross += baseAmount;
      totalItemDiscountMoney += itemDiscountMoney;

      return {
        ...item,
        quantity,
        unitPrice,
        baseAmount,
        itemDiscountMoney,
        netAmount,
        taxRate,
        inputDiscountVal,
      };
    });

    // --- PASS 2: Calculate Global Discount Money ---
    const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscountMoney;
    const inputGlobalDiscountVal = safeNumber(data.discountAmount);

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

    // --- PASS 3: Distribute Global Discount & Calculate Tax ---
    let totalTax = 0;

    const finalItems = firstPassItems.map((item) => {
      // Determine this item's share of the total net value
      const ratio =
        subtotalAfterItemDiscounts > 0
          ? item.netAmount / subtotalAfterItemDiscounts
          : 0;

      // Allocate portion of global discount to this item
      const allocatedGlobalDiscount = globalDiscountMoney * ratio;

      // Calculate Final Taxable Amount for this line
      // (Gross - ItemDiscount - AllocatedGlobalDiscount)
      const finalTaxableAmount = item.netAmount - allocatedGlobalDiscount;

      // Calculate Tax on the reduced amount
      const taxAmount = (finalTaxableAmount * item.taxRate) / 100;

      totalTax += taxAmount;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.baseAmount,
        taxRate: item.taxRate,
        taxAmount: taxAmount,
        shopProductId: item.shopProductId || null,
        serviceId: item.serviceId || null,
        details: item.details || null,
        itemDiscountType: item.itemDiscountType || null,
        itemDiscountAmount: item.inputDiscountVal,
        sortOrder: 0,
      };
    });

    // --- Final Totals ---
    // Final Subtotal (After all discounts, before tax)
    const finalSubtotal = subtotalAfterItemDiscounts - globalDiscountMoney;
    const totalAmount = finalSubtotal + totalTax;
    const effectiveTaxRate =
      finalSubtotal > 0 ? (totalTax / finalSubtotal) * 100 : 0;

    // --- Deposit ---
    let calculatedDepositMoney = 0;
    const inputDepositVal = safeNumber(data.depositAmount);
    if (data.depositRequired) {
      if (data.depositType === "PERCENTAGE") {
        calculatedDepositMoney = totalAmount * (inputDepositVal / 100);
      } else if (data.depositType === "AMOUNT") {
        calculatedDepositMoney = inputDepositVal;
      }
      calculatedDepositMoney = Math.min(calculatedDepositMoney, totalAmount);
    }

    // --- Database Transaction ---
    const lastQuotation = await db.quotation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { quotationNumber: true },
    });

    const quotationNumber = lastQuotation
      ? `QT-${(parseInt(lastQuotation.quotationNumber.split("-")[1]) + 1)
          .toString()
          .padStart(4, "0")}`
      : "QT-0001";

    const result = await db.$transaction(
      async (prisma) => {
        const quotation = await prisma.quotation.create({
          data: {
            quotationNumber,
            clientId: data.clientId,
            projectId: data.projectId || null,
            amount: subtotalGross,
            status: "DRAFT",
            issueDate: issueDate,
            validUntil: validUntil,
            title: data.title,
            description: data.description || null,

            taxAmount: totalTax,
            taxRate: effectiveTaxRate,

            discountAmount: inputGlobalDiscountVal,
            discountType: data.discountType || null,

            totalAmount: totalAmount + safeNumber(data.interestAmount),

            depositRequired: data.depositRequired,
            depositType: data.depositType || null,
            depositAmount:
              calculatedDepositMoney > 0 ? calculatedDepositMoney : null,
            depositRate:
              data.depositType === "PERCENTAGE" ? inputDepositVal : 0,

            installmentPeriod: data.installmentPeriod || null,
            interestRate: data.interestRate || 0,
            interestAmount: data.interestAmount || 0,

            terms: data.terms || null,
            notes: data.notes || null,
            paymentTerms: data.paymentTerms || null,
            deliveryTerms: data.deliveryTerms || null,
            createdBy: creator.id,
          },
        });

        if (finalItems.length > 0) {
          await prisma.quotationItem.createMany({
            data: finalItems.map((item, index) => ({
              ...item,
              quotationId: quotation.id,
              sortOrder: index,
              notes: null,
            })),
          });
        }

        await prisma.notification.create({
          data: {
            title: "New Quotation Created",
            message: `Quotation ${quotationNumber} has been created by ${creator.name}.`,
            type: "QUOTATION",
            isRead: false,
            actionUrl: `/dashboard/quotations/${quotation.id}`,
            userId: creator.id,
          },
        });

        return quotation;
      },
      {
        maxWait: 5000,
        timeout: 20000,
      },
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[QUOTATION_POST]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ message: "Validation failed", errors: error.errors }),
        { status: 422 },
      );
    }
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const quotations = await db.quotation.findMany({
      include: {
        client: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: "asc" } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotations as QuotationWithRelations[]);
  } catch (error) {
    console.error("[QUOTATIONS_GET]", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
