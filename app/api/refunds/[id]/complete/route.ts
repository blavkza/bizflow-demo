import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { processedBy } = await request.json();
    const refundId = params.id;

    const refund = await db.refund.findUnique({
      where: { id: refundId },
      include: {
        items: {
          include: {
            saleItem: {
              include: {
                ShopProduct: true,
              },
            },
          },
        },
        sale: true,
      },
    });

    if (!refund) {
      return NextResponse.json(
        { success: false, error: "Refund not found" },
        { status: 404 }
      );
    }

    if (refund.status !== "APPROVED") {
      return NextResponse.json(
        { success: false, error: "Refund must be approved before completion" },
        { status: 400 }
      );
    }

    // Convert Decimal to numbers
    const refundAmount = Number(refund.amount);
    const refundTaxAmount = Number(refund.taxAmount);
    const saleTotal = Number(refund.sale.total);

    // Handle payment method mapping
    let transactionPaymentMethod: PaymentMethod | null = null;

    if (refund.method === "ORIGINAL_METHOD") {
      transactionPaymentMethod = refund.sale.paymentMethod as PaymentMethod;
    } else if (refund.method === "STORE_CREDIT") {
      // Map STORE_CREDIT to an existing PaymentMethod or handle differently
      transactionPaymentMethod = PaymentMethod.CASH; // or whatever makes sense for your business
    } else {
      transactionPaymentMethod = refund.method as PaymentMethod;
    }

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // Update refund status
      const updatedRefund = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: "COMPLETED",
          processedBy: user.name,
          processedAt: new Date(),
        },
      });

      // Update sale refund amounts
      await tx.sale.update({
        where: { id: refund.saleId },
        data: {
          refundedAmount: {
            increment: refundAmount,
          },
          refundedTax: {
            increment: refundTaxAmount,
          },
          status:
            refundAmount === saleTotal ? "REFUNDED" : "PARTIALLY_REFUNDED",
        },
      });

      // Update inventory (restock items)
      for (const refundItem of refund.items) {
        const saleItem = await tx.saleItem.findUnique({
          where: { id: refundItem.saleItemId },
          select: { shopProductId: true },
        });

        if (saleItem) {
          await tx.shopProduct.update({
            where: { id: saleItem.shopProductId },
            data: {
              stock: {
                increment: refundItem.quantity,
              },
            },
          });
        }
      }

      // Create transaction record for accounting
      const transaction = await tx.transaction.create({
        data: {
          amount: -refundAmount,
          currency: "ZAR",
          type: "EXPENSE",
          status: "COMPLETED",
          description: `Refund for sale ${refund.sale.saleNumber}`,
          reference: refund.refundNumber,
          date: new Date(),
          method: transactionPaymentMethod,
          taxAmount: -refundTaxAmount,
          netAmount: -(refundAmount - refundTaxAmount),
          createdBy: user.id,
        },
      });

      return { refund: updatedRefund, transaction };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error completing refund:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete refund" },
      { status: 500 }
    );
  }
}
