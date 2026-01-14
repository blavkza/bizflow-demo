import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all products for stats (without pagination)
    const products = await db.shopProduct.findMany({
      select: {
        status: true,
        stock: true,
        minStock: true,
        category: true,
        featured: true,
      },
    });

    // Calculate statistics
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.status === "ACTIVE").length;
    const outOfStockProducts = products.filter((p) => p.stock === 0).length;
    const lowStockProducts = products.filter(
      (p) => p.stock > 0 && p.stock <= p.minStock
    ).length;
    const featuredProducts = products.filter((p) => p.featured).length;

    const categories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];

    return NextResponse.json({
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      featuredProducts,
      totalCategories: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Failed to fetch product stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch product statistics" },
      { status: 500 }
    );
  }
}
