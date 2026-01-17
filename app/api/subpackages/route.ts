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

    if (body.products && Array.isArray(body.products)) {
      for (const product of body.products) {
        await db.subpackageProduct.create({
          data: {
            subpackageId: subpackage.id,
            productId: product.id,
            quantity: product.quantity || 1,
            unitPrice: product.unitPrice || null,
            itemDiscountType: product.itemDiscountType || null,
            itemDiscountAmount: product.itemDiscountAmount
              ? parseFloat(product.itemDiscountAmount)
              : null,
            taxRate: product.taxRate ? parseFloat(product.taxRate) : null,
            taxAmount: product.taxAmount ? parseFloat(product.taxAmount) : null,
          },
        });
      }
    }

    if (body.services && Array.isArray(body.services)) {
      for (const service of body.services) {
        await db.subpackageService.create({
          data: {
            subpackageId: subpackage.id,
            serviceId: service.id,
            quantity: service.quantity || 1,
            unitPrice: service.unitPrice || null,
            // NEW FIELDS
            itemDiscountType: service.itemDiscountType || null,
            itemDiscountAmount: service.itemDiscountAmount
              ? parseFloat(service.itemDiscountAmount)
              : null,
            taxRate: service.taxRate ? parseFloat(service.taxRate) : null,
            taxAmount: service.taxAmount ? parseFloat(service.taxAmount) : null,
          },
        });
      }
    }

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
          // NEW FIELDS IN RESPONSE
          itemDiscountType: p.itemDiscountType,
          itemDiscountAmount: p.itemDiscountAmount
            ? Number(p.itemDiscountAmount)
            : null,
          taxRate: p.taxRate ? Number(p.taxRate) : null,
          taxAmount: p.taxAmount ? Number(p.taxAmount) : null,
        })) || [],
      services:
        createdSubpackage?.services?.map((s) => ({
          id: s.service.id,
          name: s.service.name,
          amount: Number(s.service.amount),
          quantity: s.quantity,
          unitPrice: s.unitPrice ? Number(s.unitPrice) : null,
          // NEW FIELDS IN RESPONSE
          itemDiscountType: s.itemDiscountType,
          itemDiscountAmount: s.itemDiscountAmount
            ? Number(s.itemDiscountAmount)
            : null,
          taxRate: s.taxRate ? Number(s.taxRate) : null,
          taxAmount: s.taxAmount ? Number(s.taxAmount) : null,
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

// Also update the PUT route for editing subpackages
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const subpackageId = params.id;

    // Check if subpackage exists
    const existingSubpackage = await db.subpackage.findUnique({
      where: { id: subpackageId },
    });

    if (!existingSubpackage) {
      return NextResponse.json(
        { error: "Subpackage not found" },
        { status: 404 }
      );
    }

    // Calculate final price if discount is provided
    let finalPrice =
      body.originalPrice || body.price || existingSubpackage.price;
    if (body.discountType === "percentage" && body.discount) {
      finalPrice = Number(body.originalPrice) * (1 - body.discount / 100);
    } else if (body.discountType === "amount" && body.discount) {
      finalPrice = Math.max(
        0,
        Number(body.originalPrice) - Number(body.discount)
      );
    }

    // Update subpackage
    const updatedSubpackage = await db.subpackage.update({
      where: { id: subpackageId },
      data: {
        name: body.name || existingSubpackage.name,
        description: body.description ?? existingSubpackage.description,
        shortDescription:
          body.shortDescription ?? existingSubpackage.shortDescription,
        price: finalPrice,
        originalPrice:
          body.originalPrice || existingSubpackage.originalPrice || finalPrice,
        discount: body.discount ?? existingSubpackage.discount,
        discountType: body.discountType ?? existingSubpackage.discountType,
        duration: body.duration ?? existingSubpackage.duration,
        status: body.status || existingSubpackage.status,
        isDefault: body.isDefault ?? existingSubpackage.isDefault,
        sortOrder: body.sortOrder ?? existingSubpackage.sortOrder,
        features: body.features || existingSubpackage.features,
      },
    });

    // Delete existing product and service connections
    await db.subpackageProduct.deleteMany({
      where: { subpackageId: subpackageId },
    });

    await db.subpackageService.deleteMany({
      where: { subpackageId: subpackageId },
    });

    // Reconnect products if provided
    if (body.products && Array.isArray(body.products)) {
      for (const product of body.products) {
        await db.subpackageProduct.create({
          data: {
            subpackageId: subpackageId,
            productId: product.id,
            quantity: product.quantity || 1,
            unitPrice: product.unitPrice || null,
            // NEW FIELDS
            itemDiscountType: product.itemDiscountType || null,
            itemDiscountAmount: product.itemDiscountAmount
              ? parseFloat(product.itemDiscountAmount)
              : null,
            taxRate: product.taxRate ? parseFloat(product.taxRate) : null,
            taxAmount: product.taxAmount ? parseFloat(product.taxAmount) : null,
          },
        });
      }
    }

    // Reconnect services if provided
    if (body.services && Array.isArray(body.services)) {
      for (const service of body.services) {
        await db.subpackageService.create({
          data: {
            subpackageId: subpackageId,
            serviceId: service.id,
            quantity: service.quantity || 1,
            unitPrice: service.unitPrice || null,
            // NEW FIELDS
            itemDiscountType: service.itemDiscountType || null,
            itemDiscountAmount: service.itemDiscountAmount
              ? parseFloat(service.itemDiscountAmount)
              : null,
            taxRate: service.taxRate ? parseFloat(service.taxRate) : null,
            taxAmount: service.taxAmount ? parseFloat(service.taxAmount) : null,
          },
        });
      }
    }

    // If this is default, unset default on other subpackages in same package
    if (body.isDefault) {
      await db.subpackage.updateMany({
        where: {
          packageId: existingSubpackage.packageId,
          id: { not: subpackageId },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Fetch updated subpackage with relations
    const finalSubpackage = await db.subpackage.findUnique({
      where: { id: subpackageId },
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
      id: finalSubpackage?.id,
      name: finalSubpackage?.name,
      price: Number(finalSubpackage?.price),
      originalPrice: finalSubpackage?.originalPrice
        ? Number(finalSubpackage.originalPrice)
        : null,
      discount: finalSubpackage?.discount,
      discountType: finalSubpackage?.discountType,
      status: finalSubpackage?.status,
      features: finalSubpackage?.features,
      products:
        finalSubpackage?.products?.map((p) => ({
          id: p.product.id,
          name: p.product.name,
          price: Number(p.product.price),
          quantity: p.quantity,
          unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
          // NEW FIELDS IN RESPONSE
          itemDiscountType: p.itemDiscountType,
          itemDiscountAmount: p.itemDiscountAmount
            ? Number(p.itemDiscountAmount)
            : null,
          taxRate: p.taxRate ? Number(p.taxRate) : null,
          taxAmount: p.taxAmount ? Number(p.taxAmount) : null,
        })) || [],
      services:
        finalSubpackage?.services?.map((s) => ({
          id: s.service.id,
          name: s.service.name,
          amount: Number(s.service.amount),
          quantity: s.quantity,
          unitPrice: s.unitPrice ? Number(s.unitPrice) : null,
          // NEW FIELDS IN RESPONSE
          itemDiscountType: s.itemDiscountType,
          itemDiscountAmount: s.itemDiscountAmount
            ? Number(s.itemDiscountAmount)
            : null,
          taxRate: s.taxRate ? Number(s.taxRate) : null,
          taxAmount: s.taxAmount ? Number(s.taxAmount) : null,
        })) || [],
    };

    return NextResponse.json(
      {
        success: true,
        message: "Subpackage updated successfully",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating subpackage:", error);
    return NextResponse.json(
      {
        error: "Failed to update subpackage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also update the GET route to include the new fields
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const subpackageId = params.id;

    const subpackage = await db.subpackage.findUnique({
      where: { id: subpackageId },
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

    if (!subpackage) {
      return NextResponse.json(
        { error: "Subpackage not found" },
        { status: 404 }
      );
    }

    // Transform response with new fields
    const response = {
      id: subpackage.id,
      name: subpackage.name,
      description: subpackage.description,
      shortDescription: subpackage.shortDescription,
      price: Number(subpackage.price),
      originalPrice: subpackage.originalPrice
        ? Number(subpackage.originalPrice)
        : null,
      discount: subpackage.discount,
      discountType: subpackage.discountType,
      duration: subpackage.duration,
      status: subpackage.status,
      isDefault: subpackage.isDefault,
      sortOrder: subpackage.sortOrder,
      features: subpackage.features,
      products: subpackage.products.map((p) => ({
        id: p.product.id,
        name: p.product.name,
        price: Number(p.product.price),
        quantity: p.quantity,
        unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
        // NEW FIELDS
        itemDiscountType: p.itemDiscountType,
        itemDiscountAmount: p.itemDiscountAmount
          ? Number(p.itemDiscountAmount)
          : null,
        taxRate: p.taxRate ? Number(p.taxRate) : null,
        taxAmount: p.taxAmount ? Number(p.taxAmount) : null,
      })),
      services: subpackage.services.map((s) => ({
        id: s.service.id,
        name: s.service.name,
        amount: Number(s.service.amount),
        quantity: s.quantity,
        unitPrice: s.unitPrice ? Number(s.unitPrice) : null,
        // NEW FIELDS
        itemDiscountType: s.itemDiscountType,
        itemDiscountAmount: s.itemDiscountAmount
          ? Number(s.itemDiscountAmount)
          : null,
        taxRate: s.taxRate ? Number(s.taxRate) : null,
        taxAmount: s.taxAmount ? Number(s.taxAmount) : null,
      })),
      package: subpackage.package,
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching subpackage:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch subpackage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
