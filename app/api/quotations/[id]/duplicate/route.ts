import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { QuotationStatus } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const quotationId = params.id;

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch the original quotation with all items
    const originalQuotation = await db.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: true,
        client: true,
        package: true,
        subpackage: true,
      },
    });

    if (!originalQuotation) {
      return new NextResponse("Quotation not found", { status: 404 });
    }

    // Generate new quotation number
    const lastQuotation = await db.quotation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { quotationNumber: true },
    });

    const quotationNumber = lastQuotation
      ? `QT-${(parseInt(lastQuotation.quotationNumber.split("-")[1]) + 1)
          .toString()
          .padStart(4, "0")}`
      : "QT-0001";

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (prisma) => {
      // Create the duplicated quotation
      const duplicatedQuotation = await prisma.quotation.create({
        data: {
          quotationNumber,
          clientId: originalQuotation.clientId,
          projectId: originalQuotation.projectId,
          amount: originalQuotation.amount,
          currency: originalQuotation.currency || "ZAR",
          status: "DRAFT" as QuotationStatus,
          issueDate: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          title: `${originalQuotation.title} (Copy)`,
          description:
            originalQuotation.description ||
            `Duplicated from ${originalQuotation.quotationNumber}`,

          taxAmount: originalQuotation.taxAmount,
          taxRate: originalQuotation.taxRate,

          discountAmount: originalQuotation.discountAmount,
          discountType: originalQuotation.discountType,
          totalAmount: originalQuotation.totalAmount,

          depositRequired: originalQuotation.depositRequired,
          depositType: originalQuotation.depositType,
          depositAmount: originalQuotation.depositAmount,
          depositRate: originalQuotation.depositRate,

          terms: originalQuotation.terms,
          notes: originalQuotation.notes,
          paymentTerms: originalQuotation.paymentTerms,
          deliveryTerms: originalQuotation.deliveryTerms,

          packageId: originalQuotation.packageId,
          subpackageId: originalQuotation.subpackageId,
          createdBy: creator.id,
        },
      });

      // Duplicate all items
      if (originalQuotation.items.length > 0) {
        await prisma.quotationItem.createMany({
          data: originalQuotation.items.map((item, index) => ({
            quotationId: duplicatedQuotation.id,
            description: item.description,
            details: item.details,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            shopProductId: item.shopProductId,
            serviceId: item.serviceId,
            itemDiscountType: item.itemDiscountType,
            itemDiscountAmount: item.itemDiscountAmount,
            sortOrder: index,
          })),
        });
      }

      // Create notification
      await prisma.notification.create({
        data: {
          title: "Quotation Duplicated",
          message: `Quotation ${duplicatedQuotation.quotationNumber} has been created by duplicating ${originalQuotation.quotationNumber} by ${creator.name}.`,
          type: "QUOTATION",
          isRead: false,
          actionUrl: `/dashboard/quotations/${duplicatedQuotation.id}`,
          userId: creator.id,
        },
      });

      return duplicatedQuotation;
    });

    return NextResponse.json({
      success: true,
      quotationId: result.id,
      redirectUrl: `/dashboard/quotations/${result.id}/edit`,
    });
  } catch (error) {
    console.error("[QUOTATION_DUPLICATE]", error);
    return new NextResponse(
      JSON.stringify({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
