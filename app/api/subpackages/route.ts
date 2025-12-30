import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.packageId) {
      return NextResponse.json(
        { error: "Name and packageId are required" },
        { status: 400 }
      );
    }

    // Calculate final price if discount is provided
    let finalPrice = body.originalPrice || body.price || 0;
    if (body.discountType === "percentage" && body.discount) {
      finalPrice = Number(body.originalPrice) * (1 - body.discount / 100);
    } else if (body.discountType === "amount" && body.discount) {
      finalPrice = Math.max(
        0,
        Number(body.originalPrice) - Number(body.discount)
      );
    }

    // Create subpackage
    const subpackage = await db.subpackage.create({
      data: {
        packageId: body.packageId,
        name: body.name,
        description: body.description,
        shortDescription: body.shortDescription,
        price: finalPrice,
        originalPrice: body.originalPrice || finalPrice,
        discount: body.discount || null,
        discountType: body.discountType || null,
        duration: body.duration,
        status: body.status || "DRAFT",
        isDefault: body.isDefault || false,
        sortOrder: body.sortOrder || 0,
        features: body.features || [],
        salesCount: 0,
        revenue: 0,
      },
    });

    // Connect products if provided (using junction table)
    if (body.products && Array.isArray(body.products)) {
      for (const product of body.products) {
        await db.subpackageProduct.create({
          data: {
            subpackageId: subpackage.id,
            productId: product.id,
            quantity: product.quantity || 1,
            unitPrice: product.unitPrice || null,
          },
        });
      }
    }

    // Connect services if provided (using junction table)
    if (body.services && Array.isArray(body.services)) {
      for (const service of body.services) {
        await db.subpackageService.create({
          data: {
            subpackageId: subpackage.id,
            serviceId: service.id,
            quantity: service.quantity || 1,
            unitPrice: service.unitPrice || null,
          },
        });
      }
    }

    // If this is default, unset default on other subpackages in same package
    if (body.isDefault) {
      await db.subpackage.updateMany({
        where: {
          packageId: body.packageId,
          id: { not: subpackage.id },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Fetch created subpackage with relations
    const createdSubpackage = await db.subpackage.findUnique({
      where: { id: subpackage.id },
      include: {
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
        package: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform response
    const response = {
      id: createdSubpackage?.id,
      name: createdSubpackage?.name,
      price: Number(createdSubpackage?.price),
      originalPrice: createdSubpackage?.originalPrice
        ? Number(createdSubpackage.originalPrice)
        : null,
      discount: createdSubpackage?.discount,
      discountType: createdSubpackage?.discountType,
      status: createdSubpackage?.status,
      features: createdSubpackage?.features,
      products:
        createdSubpackage?.products?.map((p) => ({
          id: p.product.id,
          name: p.product.name,
          price: Number(p.product.price),
          quantity: p.quantity,
          unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
        })) || [],
      services:
        createdSubpackage?.services?.map((s) => ({
          id: s.service.id,
          name: s.service.name,
          amount: Number(s.service.amount),
          quantity: s.quantity,
          unitPrice: s.unitPrice ? Number(s.unitPrice) : null,
        })) || [],
    };

    return NextResponse.json(
      {
        success: true,
        message: "Subpackage created successfully",
        data: response,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating subpackage:", error);
    return NextResponse.json(
      {
        error: "Failed to create subpackage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
