import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { PackageStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const packages = await db.package.findMany({
      include: {
        subpackages: {
          include: {
            // Use junction tables for many-to-many
            products: {
              include: {
                product: true,
              },
            },
            services: {
              include: {
                service: true,
              },
            },
          },
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

    const transformedPackages = packages.map((pkg) => ({
      ...pkg,
      subpackages: pkg.subpackages.map((subpackage) => ({
        ...subpackage,
        products:
          subpackage.products?.map((p) => ({
            ...p.product,
            quantity: p.quantity,
            unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
          })) || [],
        services:
          subpackage.services?.map((s) => ({
            ...s.service,
            quantity: s.quantity,
            unitPrice: s.unitPrice ? Number(s.unitPrice) : null,
          })) || [],
        price: Number(subpackage.price),
        originalPrice: subpackage.originalPrice
          ? Number(subpackage.originalPrice)
          : null,
        revenue: Number(subpackage.revenue),
      })),
    }));

    return NextResponse.json(transformedPackages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
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
