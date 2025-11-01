import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RefundMethod } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

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

    const { items, reason, method } = await request.json();
    const saleId = params.id;

    // Get the sale with items
    const sale = await db.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            ShopProduct: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }

    if (sale.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "Only completed sales can be refunded" },
        { status: 400 }
      );
    }

    // Validate refund items
    let totalRefundAmount = 0;
    let totalTaxAmount = 0;

    const refundItems = await Promise.all(
      items.map(async (item: any) => {
        const saleItem = sale.items.find((si) => si.id === item.saleItemId);
        if (!saleItem) {
          throw new Error(`Sale item ${item.saleItemId} not found`);
        }

        if (item.quantity > saleItem.quantity) {
          throw new Error(
            `Refund quantity exceeds original sale quantity for item ${saleItem.ShopProduct.name}`
          );
        }

        const itemTotal = Number(saleItem.price) * item.quantity;
        const itemTax = (itemTotal * 0.15) / 1.15; // Assuming 15% VAT

        totalRefundAmount += itemTotal;
        totalTaxAmount += itemTax;

        return {
          saleItemId: item.saleItemId,
          quantity: item.quantity,
          price: saleItem.price,
          total: itemTotal,
          taxAmount: itemTax,
        };
      })
    );

    // Generate refund number
    const refundCount = await db.refund.count({
      where: { saleId },
    });
    const refundNumber = `REF-${sale.saleNumber}-${refundCount + 1}`;

    // Create refund
    const refund = await db.refund.create({
      data: {
        refundNumber,
        saleId,
        reason,
        method: method as RefundMethod,
        amount: totalRefundAmount,
        taxAmount: totalTaxAmount,
        requestedBy: user?.name || "",
        items: {
          create: refundItems,
        },
      },
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

    return NextResponse.json({
      success: true,
      data: refund,
    });
  } catch (error) {
    console.error("Error creating refund:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create refund" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const saleId = params.id;

    const refunds = await db.refund.findMany({
      where: { saleId },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: refunds,
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}
