import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const packageCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  sortOrder: z.number().int().min(0).default(0),
  thumbnail: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const includePackages = searchParams.get("includePackages") === "true";
    const includeStats = searchParams.get("includeStats") === "true";

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const categories = await db.packageCategory.findMany({
      where,
      include: {
        packages: includePackages
          ? {
              include: {
                _count: {
                  select: {
                    orders: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            }
          : false,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    const categoriesWithStats = categories.map((category) => {
      let packageCount = 0;
      let totalSales = 0;
      let totalRevenue = 0;

      if (category.packages) {
        packageCount = category.packages.length;

        category.packages.forEach((pkg: any) => {
          const salesCount = pkg._count?.orders || 0;
          totalSales += salesCount;
          const packageRevenue = pkg.totalRevenue
            ? Number(pkg.totalRevenue)
            : salesCount * (Number(pkg.price) || 0);

          totalRevenue += packageRevenue;
        });
      }

      return {
        ...category,
        packages: includePackages
          ? category.packages?.map((pkg: any) => ({
              ...pkg,
              totalSales: pkg._count?.orders || 0,
              salesCount: pkg._count?.orders || 0,
            }))
          : undefined,
        stats: includeStats
          ? {
              packageCount,
              totalSales,
              totalRevenue,
              averageRevenuePerPackage:
                packageCount > 0 ? totalRevenue / packageCount : 0,
              averageSalesPerPackage:
                packageCount > 0 ? totalSales / packageCount : 0,
            }
          : undefined,
      };
    });

    return NextResponse.json(categoriesWithStats);
  } catch (error) {
    console.error("Error fetching package categories:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch package categories",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and validate request body
    const data = await request.json();

    const validationResult = packageCategorySchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if parent exists (if parentId is provided)
    if (validatedData.parentId) {
      const parentCategory = await db.packageCategory.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 404 }
        );
      }
    }

    // Check for duplicate category name (optional, based on your requirements)
    const existingCategory = await db.packageCategory.findFirst({
      where: {
        name: validatedData.name,
        ...(validatedData.parentId
          ? { parentId: validatedData.parentId }
          : { parentId: null }),
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this name already exists in this level" },
        { status: 409 }
      );
    }

    // Create the new package category
    const newCategory = await db.packageCategory.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        parentId: validatedData.parentId,
        status: validatedData.status,
        sortOrder: validatedData.sortOrder,
        thumbnail: validatedData.thumbnail,
      },
      include: {
        packages: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating package category:", error);
    return NextResponse.json(
      {
        error: "Failed to create package category",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
