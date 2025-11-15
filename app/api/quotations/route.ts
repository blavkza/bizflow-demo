import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { QuotationStatus, DiscountType, DepositType } from "@prisma/client";
import { z } from "zod";
import { QuotationSchema } from "@/lib/formValidationSchemas";
import { QuotationWithRelations } from "@/types/quotation";

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
    const data = QuotationSchema.parse(json);

    // Additional validation
    const validUntil = new Date(data.validUntil);
    const issueDate = new Date(data.issueDate);
    if (validUntil < issueDate) {
      return new NextResponse("Valid until date must be after issue date", {
        status: 400,
      });
    }

    // 1. Calculate subtotal first
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // 2. Calculate discount amount
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

    // 3. Calculate discounted subtotal (amount after discount, before tax)
    const discountedSubtotal = subtotal - discountAmount;

    // 4. Calculate tax on the DISCOUNTED amount (proportionally per item)
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

    // 6. Calculate effective tax rate based on discounted subtotal
    const taxRate =
      discountedSubtotal > 0 ? (totalTax / discountedSubtotal) * 100 : 0;

    // Generate quotation number atomically
    const lastQuotation = await db.quotation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { quotationNumber: true },
    });

    const quotationNumber = lastQuotation
      ? `QT-${(parseInt(lastQuotation.quotationNumber.split("-")[1]) + 1)
          .toString()
          .padStart(4, "0")}`
      : "QT-0001";

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

    const amountDue = totalAmount - calculatedDepositAmount;

    // Create the quotation in a transaction
    const result = await db.$transaction(async (prisma) => {
      const quotation = await prisma.quotation.create({
        data: {
          quotationNumber,
          clientId: data.clientId,
          projectId: data.projectId,
          amount: subtotal,
          status: "DRAFT",
          issueDate: issueDate,
          validUntil: validUntil,
          title: data.title,
          description: data.description,
          taxAmount: totalTax,
          taxRate: taxRate,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          totalAmount,
          depositRequired: data.depositRequired,
          depositType: data.depositType,
          depositAmount:
            calculatedDepositAmount > 0 ? calculatedDepositAmount : null,
          depositRate:
            data.depositType === "PERCENTAGE" ? data.depositAmount : 0,
          terms: data.terms,
          notes: data.notes,
          paymentTerms: data.paymentTerms,
          deliveryTerms: data.deliveryTerms,
          createdBy: creator.id,
        },
      });

      // Create quotation items with shop product links
      await prisma.quotationItem.createMany({
        data: itemsWithAmounts.map((item, index) => ({
          quotationId: quotation.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          shopProductId: item.shopProductId || null,
          sortOrder: index,
        })),
      });

      // Create notification
      await db.notification.create({
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
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[QUOTATION_POST]", error);

    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({
          message: "Validation failed",
          errors: error.errors,
        }),
        { status: 422 }
      );
    }

    return new NextResponse(
      JSON.stringify({
        message: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
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
      { status: 500 }
    );
  }
}
