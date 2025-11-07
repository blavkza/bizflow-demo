import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { QuotationStatus, DiscountType } from "@prisma/client";
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

    // Generate quotation number atomically
    const lastQuotation = await db.quotation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { quotationNumber: true },
    });
    const quotationNumber = lastQuotation
      ? `QT-${parseInt(lastQuotation.quotationNumber.split("-")[1]) + 1}`
      : "QT-0001";

    // Calculate amounts
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

    const taxRate = subtotal > 0 ? (totalTax / subtotal) * 100 : 0;

    // Calculate discount properly
    let discountAmount = 0;
    if (data.discountType === DiscountType.PERCENTAGE && data.discountAmount) {
      discountAmount = (subtotal + totalTax) * (data.discountAmount / 100);
    } else if (
      data.discountType === DiscountType.AMOUNT &&
      data.discountAmount
    ) {
      discountAmount = data.discountAmount;
    }

    const totalAmount = subtotal + totalTax - discountAmount;

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
          terms: data.terms,
          notes: data.notes,
          paymentTerms: data.paymentTerms,
          deliveryTerms: data.deliveryTerms,
          createdBy: creator.id,
        },
      });

      await prisma.quotationItem.createMany({
        data: itemsWithAmounts.map((item, index) => ({
          quotationId: quotation.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          sortOrder: index,
        })),
      });

      await db.notification.create({
        data: {
          title: "New Quotation Created",
          message: `Quotation ${quotationNumber} , has been created By ${creator.name}.`,
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
