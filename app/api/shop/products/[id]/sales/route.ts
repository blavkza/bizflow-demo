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

    const productId = await params.id;

    // Verify the product exists
    const product = await db.shopProduct.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Find all sales that contain this product
    const sales = await db.sale.findMany({
      where: {
        items: {
          some: {
            shopProductId: productId,
          },
        },
      },
      include: {
        items: {
          where: {
            shopProductId: productId,
          },
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            shopProductId: true,
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        saleDate: "desc",
      },
    });

    // Transform the data to match the frontend format
    const formattedSales = sales.map((sale) => {
      const customerName = sale.customer
        ? `${sale.customer.firstName} ${sale.customer.lastName}`
        : null;

      return {
        id: sale.id,
        saleNumber: sale.saleNumber,
        saleDate: sale.saleDate,
        customerName,
        customerEmail: sale.customer?.email || null,
        status: sale.status,
        paymentMethod: sale.paymentMethod,
        total: sale.subtotal,
        items: sale.items.map((item) => ({
          id: item.shopProductId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedSales,
    });
  } catch (error) {
    console.error("Error fetching product sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch product sales" },
      { status: 500 }
    );
  }
}
