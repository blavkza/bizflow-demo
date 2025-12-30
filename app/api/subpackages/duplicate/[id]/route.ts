import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST duplicate subpackage
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id } = params;
    const body = await request.json();

    // Fetch the original subpackage with its relationships
    const originalSubpackage = await db.subpackage.findUnique({
      where: { id },
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
      },
    });

    if (!originalSubpackage) {
      return NextResponse.json(
        { error: "Original subpackage not found" },
        { status: 404 }
      );
    }

    // Get price values
    const originalPrice =
      body.originalPrice !== undefined
        ? Number(body.originalPrice)
        : originalSubpackage.originalPrice
          ? Number(originalSubpackage.originalPrice)
          : Number(originalSubpackage.price);

    const basePrice = originalPrice || Number(originalSubpackage.price);

    // Calculate final price based on discount
    let finalPrice = basePrice;

    // Check if discount is provided in the request body
    if (body.discount !== undefined && body.discountType) {
      const discount = Number(body.discount);

      if (body.discountType === "percentage" && discount > 0) {
        // Calculate percentage discount
        finalPrice = basePrice * (1 - discount / 100);
      } else if (body.discountType === "amount" && discount > 0) {
        // Calculate fixed amount discount
        finalPrice = Math.max(0, basePrice - discount);
      }
    }
    // If no discount in body, check original subpackage discount
    else if (originalSubpackage.discount && originalSubpackage.discountType) {
      const discount = Number(originalSubpackage.discount);

      if (originalSubpackage.discountType === "percentage" && discount > 0) {
        finalPrice = basePrice * (1 - discount / 100);
      } else if (originalSubpackage.discountType === "amount" && discount > 0) {
        finalPrice = Math.max(0, basePrice - discount);
      }
    }

    // Create the duplicate subpackage
    const duplicate = await db.subpackage.create({
      data: {
        packageId: body.packageId || originalSubpackage.packageId,
        name: body.name || `${originalSubpackage.name} (Copy)`,
        description: body.description || originalSubpackage.description,
        shortDescription:
          body.shortDescription || originalSubpackage.shortDescription,
        price: finalPrice,
        originalPrice: originalPrice !== finalPrice ? originalPrice : null,
        discount:
          body.discount !== undefined
            ? body.discountType === "none"
              ? null
              : Number(body.discount)
            : originalSubpackage.discount,
        discountType:
          body.discountType !== undefined
            ? body.discountType === "none"
              ? null
              : body.discountType
            : originalSubpackage.discountType,
        duration: body.duration || originalSubpackage.duration,
        status: body.status || "DRAFT",
        isDefault: false,
        sortOrder:
          body.sortOrder !== undefined
            ? body.sortOrder
            : (originalSubpackage.sortOrder || 0) + 1,
        features: body.features || originalSubpackage.features || [],
        salesCount: 0,
        revenue: 0,
      },
    });

    // Create product connections in the junction table
    if (body.products && Array.isArray(body.products)) {
      // Use provided product list
      for (const productData of body.products) {
        await db.subpackageProduct.create({
          data: {
            subpackageId: duplicate.id,
            productId: productData.id,
            quantity: productData.quantity || 1,
            unitPrice: productData.unitPrice || null,
          },
        });
      }
    } else if (originalSubpackage.products.length > 0) {
      // Copy original product connections
      for (const productRelation of originalSubpackage.products) {
        await db.subpackageProduct.create({
          data: {
            subpackageId: duplicate.id,
            productId: productRelation.productId,
            quantity: productRelation.quantity,
            unitPrice: productRelation.unitPrice,
          },
        });
      }
    }

    // Create service connections in the junction table
    if (body.services && Array.isArray(body.services)) {
      // Use provided service list
      for (const serviceData of body.services) {
        await db.subpackageService.create({
          data: {
            subpackageId: duplicate.id,
            serviceId: serviceData.id,
            quantity: serviceData.quantity || 1,
            unitPrice: serviceData.unitPrice || null,
          },
        });
      }
    } else if (originalSubpackage.services.length > 0) {
      // Copy original service connections
      for (const serviceRelation of originalSubpackage.services) {
        await db.subpackageService.create({
          data: {
            subpackageId: duplicate.id,
            serviceId: serviceRelation.serviceId,
            quantity: serviceRelation.quantity,
            unitPrice: serviceRelation.unitPrice,
          },
        });
      }
    }

    // Fetch the created duplicate with relations
    const createdDuplicate = await db.subpackage.findUnique({
      where: { id: duplicate.id },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                sku: true,
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
              },
            },
          },
        },
      },
    });

    // Check if createdDuplicate exists
    if (!createdDuplicate) {
      return NextResponse.json(
        { error: "Failed to fetch created subpackage" },
        { status: 500 }
      );
    }

    // Transform response for frontend
    const transformedResponse = {
      id: createdDuplicate.id,
      name: createdDuplicate.name,
      description: createdDuplicate.description,
      price: Number(createdDuplicate.price),
      originalPrice: createdDuplicate.originalPrice
        ? Number(createdDuplicate.originalPrice)
        : null,
      discount: createdDuplicate.discount,
      discountType: createdDuplicate.discountType,
      duration: createdDuplicate.duration,
      status: createdDuplicate.status,
      isDefault: createdDuplicate.isDefault,
      sortOrder: createdDuplicate.sortOrder,
      features: createdDuplicate.features,
      salesCount: createdDuplicate.salesCount,
      revenue: Number(createdDuplicate.revenue),
      products: createdDuplicate.products.map((p) => ({
        id: p.product.id,
        name: p.product.name,
        price: Number(p.product.price),
        sku: p.product.sku,
        quantity: p.quantity,
        unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
      })),
      services: createdDuplicate.services.map((s) => ({
        id: s.service.id,
        name: s.service.name,
        amount: Number(s.service.amount),
        quantity: s.quantity,
        unitPrice: s.unitPrice ? Number(s.unitPrice) : null,
      })),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Subpackage duplicated successfully",
        data: transformedResponse,
      },
      { status: 201 }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Subpackage duplicated successfully",
        data: transformedResponse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error duplicating subpackage:", error);
    return NextResponse.json(
      {
        error: "Failed to duplicate subpackage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
