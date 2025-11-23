import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { QuotationSchema } from "@/lib/formValidationSchemas";

const safeNumber = (val: any) => (val ? Number(val) : 0);

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

    const json = await req.json();
    const body = QuotationSchema.parse(json);

    // Validation
    const validUntil = new Date(body.validUntil);
    const issueDate = new Date(body.issueDate);
    if (validUntil < issueDate) {
      return new NextResponse("Valid until date must be after issue date", {
        status: 400,
      });
    }

    //  Calculate Gross Totals & Item Discounts ---
    let subtotalGross = 0;
    let totalItemDiscountMoney = 0;

    const firstPassItems = body.items.map((item) => {
      const quantity = safeNumber(item.quantity);
      const unitPrice = safeNumber(item.unitPrice);
      const taxRate = safeNumber(item.taxRate);
      const inputDiscountVal = safeNumber(item.itemDiscountAmount);

      const baseAmount = quantity * unitPrice;

      let itemDiscountMoney = 0;
      if (item.itemDiscountType === "PERCENTAGE") {
        itemDiscountMoney = baseAmount * (inputDiscountVal / 100);
      } else {
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
        baseAmount,
        itemDiscountMoney,
        netAmount,
        taxRate,
        inputDiscountVal,
      };
    });

    //  Calculate Global Discount Money ---
    const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscountMoney;
    const inputGlobalDiscountVal = safeNumber(body.discountAmount);

    let globalDiscountMoney = 0;
    if (body.discountType === "PERCENTAGE") {
      globalDiscountMoney =
        subtotalAfterItemDiscounts * (inputGlobalDiscountVal / 100);
    } else {
      globalDiscountMoney = inputGlobalDiscountVal;
    }
    globalDiscountMoney = Math.min(
      globalDiscountMoney,
      subtotalAfterItemDiscounts
    );

    //  Distribute Global Discount & Calculate Tax ---
    let totalTax = 0;

    const finalItems = firstPassItems.map((item) => {
      const ratio =
        subtotalAfterItemDiscounts > 0
          ? item.netAmount / subtotalAfterItemDiscounts
          : 0;

      const allocatedGlobalDiscount = globalDiscountMoney * ratio;
      const finalTaxableAmount = item.netAmount - allocatedGlobalDiscount;

      // Tax on amount AFTER all discounts
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
        itemDiscountType: item.itemDiscountType || null,
        itemDiscountAmount: item.inputDiscountVal,
        sortOrder: 0,
      };
    });

    // --- Final Totals ---
    const finalSubtotal = subtotalAfterItemDiscounts - globalDiscountMoney;
    const totalAmount = finalSubtotal + totalTax;
    const effectiveTaxRate =
      finalSubtotal > 0 ? (totalTax / finalSubtotal) * 100 : 0;

    // --- Deposit ---
    let calculatedDepositMoney = 0;
    const inputDepositVal = safeNumber(body.depositAmount);
    if (body.depositRequired) {
      if (body.depositType === "PERCENTAGE") {
        calculatedDepositMoney = totalAmount * (inputDepositVal / 100);
      } else {
        calculatedDepositMoney = inputDepositVal;
      }
      calculatedDepositMoney = Math.min(calculatedDepositMoney, totalAmount);
    }

    // --- Database Transaction ---
    const result = await db.$transaction(
      async (prisma) => {
        await prisma.quotationItem.deleteMany({
          where: { quotationId: params.id },
        });

        const quotation = await prisma.quotation.update({
          where: { id: params.id },
          data: {
            clientId: body.clientId,
            title: body.title,
            issueDate: issueDate,
            validUntil: validUntil,
            description: body.description,

            amount: subtotalGross,
            taxAmount: totalTax,
            taxRate: effectiveTaxRate,

            discountType: body.discountType || null,
            discountAmount: inputGlobalDiscountVal,

            totalAmount: totalAmount,

            depositRequired: body.depositRequired,
            depositType: body.depositType,
            depositAmount:
              calculatedDepositMoney > 0 ? calculatedDepositMoney : null,
            depositRate:
              body.depositType === "PERCENTAGE" ? inputDepositVal : 0,

            paymentTerms: body.paymentTerms,
            notes: body.notes,

            items: {
              create: finalItems.map((item, index) => ({
                ...item,
                sortOrder: index,
              })),
            },
          },
          include: { client: true, items: true },
        });

        await prisma.notification.create({
          data: {
            title: "Quotation Updated",
            message: `Quotation ${quotation.quotationNumber} has been updated by ${updater.name}.`,
            type: "QUOTATION",
            isRead: false,
            actionUrl: `/dashboard/quotations/${quotation.id}`,
            userId: updater.id,
          },
        });

        return quotation;
      },
      {
        maxWait: 5000,
        timeout: 20000,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update quotation:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid data", { status: 422 });
    }
    return new NextResponse(
      JSON.stringify({ message: "Failed to update quotation" }),
      { status: 500 }
    );
  }
}

// --- GET ---
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const quotation = await db.quotation.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        creator: {
          include: {
            GeneralSetting: {
              select: {
                logo: true,
                companyName: true,
                Address: true,
                city: true,
                taxId: true,
                province: true,
                postCode: true,
                email: true,
                phone: true,
                phone2: true,
                phone3: true,
                website: true,
                bankAccount: true,
                bankAccount2: true,
                bankName: true,
                bankName2: true,
              },
            },
          },
        },
        items: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!quotation)
      return new NextResponse("Quotation not found", { status: 404 });
    return NextResponse.json(quotation);
  } catch (error) {
    console.error("[QUOTATION_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// --- DELETE ---
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });
    if (!creator) return new NextResponse("Unauthorized", { status: 401 });

    const existingQuotation = await db.quotation.findUnique({ where: { id } });
    if (!existingQuotation)
      return new NextResponse("Quotation not found", { status: 404 });

    await db.quotation.delete({ where: { id } });

    await db.notification.create({
      data: {
        title: "Quotation Deleted",
        message: `Quotation ${existingQuotation?.quotationNumber}, has been deleted By ${creator.name}.`,
        type: "QUOTATION",
        isRead: false,
        userId: creator.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[QUOTATION_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
