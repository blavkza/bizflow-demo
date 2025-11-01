import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const refunds = await db.refund.findMany({
      include: {
        sale: {
          select: {
            id: true,
            saleNumber: true,
            customerName: true,
            total: true,
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
