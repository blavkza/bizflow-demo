import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const refundId = params.id;

    const refund = await db.refund.findUnique({
      where: { id: refundId },
      include: {
        sale: {
          select: {
            id: true,
            saleNumber: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            total: true,
            paymentMethod: true,
            saleDate: true,
          },
        },
        items: {
          include: {
            saleItem: {
              include: {
                ShopProduct: {
                  select: {
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!refund) {
      return NextResponse.json(
        { success: false, error: "Refund not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: refund,
    });
  } catch (error) {
    console.error("Error fetching refund:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch refund" },
      { status: 500 }
    );
  }
}
