import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Starting GET /dashboard/package-categories/[id]/packages");

    // Check authentication
    const { userId } = await auth();
    console.log("User ID:", userId);

    if (!userId) {
      console.log("Unauthorized: No user ID");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user exists in database
    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      console.log("Unauthorized: User not found in database");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const categoryId = params.id;
    console.log("Category ID:", categoryId);

    // Fetch packages for the specific category
    const packages = await db.package.findMany({
      where: {
        categoryId: categoryId,
      },
      include: {
        subpackages: {
          include: {
            products: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    sku: true,
                    category: true,
                    stock: true,
                    images: true,
                  },
                },
              },
            },
            services: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    amount: true,
                    duration: true,
                    category: true,
                    features: true,
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        category: true,
        _count: {
          select: {
            subpackages: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${packages.length} packages for category ${categoryId}`);

    // Transform the data for frontend
    const transformedPackages = packages.map((pkg) => {
      // Calculate total sales for the package
      const totalSales = pkg._count?.orders || 0;

      // Calculate average price of subpackages
      let averagePrice = 0;
      if (pkg.subpackages.length > 0) {
        const totalSubpackagePrice = pkg.subpackages.reduce(
          (sum, sp) => sum + Number(sp.price),
          0
        );
        averagePrice = totalSubpackagePrice / pkg.subpackages.length;
      }

      return {
        ...pkg,
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        shortDescription: pkg.shortDescription,
        category: pkg.category,
        classification: pkg.classification,
        notes: pkg.notes,
        packageType: pkg.packageType,
        status: pkg.status,
        featured: pkg.featured,
        isPublic: pkg.isPublic,
        images: pkg.images,
        thumbnail: pkg.thumbnail,
        tags: pkg.tags || [],
        benefits: pkg.benefits || [],
        createdAt: pkg.createdAt.toISOString(),
        updatedAt: pkg.updatedAt.toISOString(),

        // Stats
        totalSales,
        averagePrice,
        subpackageCount: pkg.subpackages.length,

        // Subpackages with transformed data
        subpackages: pkg.subpackages.map((sp) => ({
          id: sp.id,
          name: sp.name,
          description: sp.description,
          price: Number(sp.price),
          originalPrice: sp.originalPrice ? Number(sp.originalPrice) : null,
          discount: sp.discount,
          discountType: sp.discountType,
          duration: sp.duration,
          isDefault: sp.isDefault,
          sortOrder: sp.sortOrder,
          features: sp.features || [],
          status: sp.status,
          salesCount: sp.salesCount,
          revenue: Number(sp.revenue),
          packageId: sp.packageId,
          createdAt: sp.createdAt.toISOString(),
          updatedAt: sp.updatedAt.toISOString(),
          products:
            sp.products?.map((p) => ({
              id: p.product.id,
              name: p.product.name,
              price: Number(p.product.price),
              sku: p.product.sku,
              category: p.product.category,
              stock: p.product.stock,
              images: p.product.images,
              quantity: p.quantity || 1,
              unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
            })) || [],
          services:
            sp.services?.map((s) => ({
              id: s.service.id,
              name: s.service.name,
              amount: Number(s.service.amount),
              duration: s.service.duration,
              category: s.service.category,
              features: s.service.features || [],
              quantity: s.quantity || 1,
              unitPrice: s.unitPrice ? Number(s.unitPrice) : null,
            })) || [],
        })),
      };
    });

    console.log("Sending transformed packages response");
    return NextResponse.json(transformedPackages);
  } catch (error) {
    console.error("Error fetching packages for category:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch packages for category",
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

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const data = await request.json();

    const newPackage = await db.package.create({
      data: {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription,
        notes: data.notes || "",
        classification: data.classification,
        categoryId: data.category,
        packageType: data.packageType || "BUNDLE",
        status: data.status || "DRAFT",
        featured: data.featured || false,
        isPublic: data.isPublic ?? true,
        images: data.images || null,
        thumbnail: data.thumbnail || "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        benefits: Array.isArray(data.benefits) ? data.benefits : [],
      },
      include: {
        subpackages: true,
      },
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}
