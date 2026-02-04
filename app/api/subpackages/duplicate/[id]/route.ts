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

    // Fetch the original subpackage with ALL its relationships in the correct order
    const originalSubpackage = await db.subpackage.findUnique({
      where: { id },
      include: {
        // Products will be returned in the order they were created (by createdAt)
        products: {
          orderBy: { createdAt: "asc" }, // This maintains original creation sequence
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                sku: true,
                description: true,
              },
            },
          },
        },
        // Services will be returned in the order they were created (by createdAt)
        services: {
          orderBy: { createdAt: "asc" }, // This maintains original creation sequence
          include: {
            service: {
              select: {
                id: true,
                name: true,
                amount: true,
                description: true,
              },
            },
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
        finalPrice = basePrice * (1 - discount / 100);
      } else if (body.discountType === "amount" && discount > 0) {
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

    console.log(
      `Duplicating ${originalSubpackage.products.length} products and ${originalSubpackage.services.length} services`
    );

    // Create product connections - copy ALL original products IN SEQUENCE
    if (originalSubpackage.products.length > 0) {
      const productPromises = [];

      for (const productRelation of originalSubpackage.products) {
        productPromises.push(
          db.subpackageProduct.create({
            data: {
              subpackageId: duplicate.id,
              productId: productRelation.productId,
              quantity: productRelation.quantity || 1,
              unitPrice: productRelation.unitPrice,
              // NEW FIELDS
              itemDiscountType: productRelation.itemDiscountType,
              itemDiscountAmount: productRelation.itemDiscountAmount,
              taxRate: productRelation.taxRate,
              taxAmount: productRelation.taxAmount,
              // Note: No sortOrder field available in SubpackageProduct model
              // Sequence is maintained by creation order
            },
          })
        );
      }

      await Promise.all(productPromises);
      console.log(`Successfully duplicated ${productPromises.length} products`);
    }

    // Create service connections - copy ALL original services IN SEQUENCE
    if (originalSubpackage.services.length > 0) {
      const servicePromises = [];

      for (const serviceRelation of originalSubpackage.services) {
        servicePromises.push(
          db.subpackageService.create({
            data: {
              subpackageId: duplicate.id,
              serviceId: serviceRelation.serviceId,
              quantity: serviceRelation.quantity || 1,
              unitPrice: serviceRelation.unitPrice,
              // NEW FIELDS
              itemDiscountType: serviceRelation.itemDiscountType,
              itemDiscountAmount: serviceRelation.itemDiscountAmount,
              taxRate: serviceRelation.taxRate,
              taxAmount: serviceRelation.taxAmount,
              // Note: No sortOrder field available in SubpackageService model
              // Sequence is maintained by creation order
            },
          })
        );
      }

      await Promise.all(servicePromises);
      console.log(`Successfully duplicated ${servicePromises.length} services`);
    }

    // Fetch the created duplicate with ALL relations in the correct order
    const createdDuplicate = await db.subpackage.findUnique({
      where: { id: duplicate.id },
      include: {
        products: {
          orderBy: { createdAt: "asc" }, // Maintain the creation sequence
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                sku: true,
                description: true,
              },
            },
          },
        },
        services: {
          orderBy: { createdAt: "asc" }, // Maintain the creation sequence
          include: {
            service: {
              select: {
                id: true,
                name: true,
                amount: true,
                description: true,
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
      shortDescription: createdDuplicate.shortDescription,
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
      createdAt: createdDuplicate.createdAt,
      updatedAt: createdDuplicate.updatedAt,
      // Products will be in the same sequence as original due to createdAt ordering
      products: createdDuplicate.products.map((p) => ({
        id: p.product.id,
        name: p.product.name,
        price: Number(p.product.price),
        sku: p.product.sku,
        description: p.product.description,
        quantity: p.quantity,
        unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
        // NEW FIELDS IN RESPONSE
        itemDiscountType: p.itemDiscountType,
        itemDiscountAmount: p.itemDiscountAmount
          ? Number(p.itemDiscountAmount)
          : null,
        taxRate: p.taxRate ? Number(p.taxRate) : null,
        taxAmount: p.taxAmount ? Number(p.taxAmount) : null,
      })),
      // Services will be in the same sequence as original due to createdAt ordering
      services: createdDuplicate.services.map((s) => ({
        id: s.service.id,
        name: s.service.name,
        amount: Number(s.service.amount),
        description: s.service.description,
        quantity: s.quantity,
        unitPrice: s.unitPrice ? Number(s.unitPrice) : null,
        // NEW FIELDS IN RESPONSE
        itemDiscountType: s.itemDiscountType,
        itemDiscountAmount: s.itemDiscountAmount
          ? Number(s.itemDiscountAmount)
          : null,
        taxRate: s.taxRate ? Number(s.taxRate) : null,
        taxAmount: s.taxAmount ? Number(s.taxAmount) : null,
      })),
    };

    return NextResponse.json(
      {
        success: true,
        message: `Subpackage duplicated successfully with ${transformedResponse.products.length} products and ${transformedResponse.services.length} services`,
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
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
