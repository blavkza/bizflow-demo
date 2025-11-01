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
    const saleId = params.id;

    const sale = await db.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
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
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}
