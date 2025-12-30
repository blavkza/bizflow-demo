import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { PackageStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const pkg = await db.package.findUnique({
      where: { id },
      include: {
        subpackages: {
          orderBy: { sortOrder: "asc" },
          include: {
            // Use junction tables
            products: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    sku: true,
                    price: true,
                    category: true,
                    stock: true,
                    images: true,
                    status: true,
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
                    description: true,
                    amount: true,
                    duration: true,
                    category: true,
                    features: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        category: true,
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Transform the data to match your frontend expectations
    const transformedPackage = {
      ...pkg,
      subpackages: pkg.subpackages.map((subpackage) => ({
        ...subpackage,
        products: subpackage.products.map((p) => ({
          id: p.product.id,
          name: p.product.name,
          description: p.product.description,
          sku: p.product.sku,
          price: Number(p.product.price),
          category: p.product.category,
          stock: p.product.stock,
          images: p.product.images,
          status: p.product.status,
          quantity: p.quantity,
          unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
        })),
        services: subpackage.services.map((s) => ({
          id: s.service.id,
          name: s.service.name,
          description: s.service.description,
          amount: Number(s.service.amount),
          duration: s.service.duration,
          category: s.service.category,
          features: s.service.features,
          status: s.service.status,
          quantity: s.quantity,
          unitPrice: s.unitPrice ? Number(s.unitPrice) : null,
        })),
        price: Number(subpackage.price),
        originalPrice: subpackage.originalPrice
          ? Number(subpackage.originalPrice)
          : null,
        revenue: Number(subpackage.revenue),
      })),
      allProducts: Array.from(
        new Set(
          pkg.subpackages.flatMap((sp) => sp.products.map((p) => p.product.id))
        )
      ).length,
      allServices: Array.from(
        new Set(
          pkg.subpackages.flatMap((sp) => sp.services.map((s) => s.service.id))
        )
      ).length,
    };

    return NextResponse.json(transformedPackage);
  } catch (error) {
    console.error("Error fetching package:", error);
    return NextResponse.json(
      { error: "Failed to fetch package" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();

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

    // First check if package exists
    const existingPackage = await db.package.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const updatedPackage = await db.package.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription,
        classification: data.classification,
        categoryId: data.category,
        packageType: data.packageType,
        status: data.status as PackageStatus,
        featured: data.featured,
        isPublic: data.isPublic,
        images: data.images,
        thumbnail: data.thumbnail,
        tags: data.tags,
        benefits: data.benefits,
      },
      include: {
        subpackages: true,
      },
    });

    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // First check if package exists
    const existingPackage = await db.package.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Delete package (cascade will delete subpackages)
    await db.package.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Package deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
