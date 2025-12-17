import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all categories
    const categories = await db.productCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get product counts for each category in a single query
    const categoryNames = categories.map((c) => c.name);
    const productCounts = await db.shopProduct.groupBy({
      by: ["category"],
      where: {
        category: {
          in: categoryNames,
        },
      },
      _count: {
        _all: true,
      },
    });

    // Create a map of category name to product count
    const countMap = productCounts.reduce(
      (acc, item) => {
        acc[item.category] = item._count._all;
        return acc;
      },
      {} as Record<string, number>
    );

    // Combine categories with their counts
    const categoriesWithCounts = categories.map((category) => ({
      ...category,
      products: [], // Empty array to maintain interface compatibility
      _count: {
        products: countMap[category.name] || 0,
      },
    }));

    return NextResponse.json(categoriesWithCounts);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();

    const existingCategory = await db.productCategory.findUnique({
      where: { name: body.name },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 }
      );
    }

    const category = await db.productCategory.create({
      data: {
        name: body.name,
        description: body.description,
        images: body.images,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            status: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
