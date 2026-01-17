import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const subpackage = await db.subpackage.findUnique({
      where: { id },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        },
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
    });

    if (!subpackage) {
      return NextResponse.json(
        { error: "Subpackage not found" },
        { status: 404 }
      );
    }

    // Helper function to safely get image
    const getProductImage = (images: any) => {
      try {
        if (!images) return null;

        // If images is already a string URL
        if (typeof images === "string") {
          // Check if it's a URL
          if (images.startsWith("http") || images.startsWith("/")) {
            return images;
          }

          // Try to parse as JSON
          try {
            const parsed = JSON.parse(images);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed[0];
            }
            return parsed;
          } catch {
            // If it's not valid JSON, return as is
            return images;
          }
        }

        // If images is already an array
        if (Array.isArray(images) && images.length > 0) {
          return images[0];
        }

        return null;
      } catch (error) {
        console.error("Error parsing product images:", error);
        return null;
      }
    };

    // Transform the response WITH NEW FIELDS
    const response = {
      id: subpackage.id,
      packageId: subpackage.packageId,
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
      salesCount: subpackage.salesCount,
      revenue: Number(subpackage.revenue),
      createdAt: subpackage.createdAt,
      updatedAt: subpackage.updatedAt,
      package: subpackage.package,
      products: subpackage.products.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        sku: item.product.sku,
        price: Number(item.product.price),
        category: item.product.category,
        stock: item.product.stock,
        image: getProductImage(item.product.images),
        quantity: item.quantity,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        // NEW FIELDS
        itemDiscountType: item.itemDiscountType,
        itemDiscountAmount: item.itemDiscountAmount
          ? Number(item.itemDiscountAmount)
          : null,
        taxRate: item.taxRate ? Number(item.taxRate) : null,
        taxAmount: item.taxAmount ? Number(item.taxAmount) : null,
        status: item.product.status,
      })),
      services: subpackage.services.map((item) => ({
        id: item.service.id,
        name: item.service.name,
        description: item.service.description,
        price: Number(item.service.amount),
        duration: item.service.duration,
        category: item.service.category,
        features: item.service.features,
        quantity: item.quantity,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        // NEW FIELDS
        itemDiscountType: item.itemDiscountType,
        itemDiscountAmount: item.itemDiscountAmount
          ? Number(item.itemDiscountAmount)
          : null,
        taxRate: item.taxRate ? Number(item.taxRate) : null,
        taxAmount: item.taxAmount ? Number(item.taxAmount) : null,
        status: item.service.status,
      })),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
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

// PUT update subpackage
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Check if subpackage exists
    const existingSubpackage = await db.subpackage.findUnique({
      where: { id },
      include: {
        products: true,
        services: true,
      },
    });

    if (!existingSubpackage) {
      return NextResponse.json(
        { error: "Subpackage not found" },
        { status: 404 }
      );
    }

    // Calculate final price if discount is provided
    let finalPrice =
      body.originalPrice ||
      existingSubpackage.originalPrice ||
      existingSubpackage.price;
    if (body.discountType === "percentage" && body.discount) {
      finalPrice =
        Number(body.originalPrice || existingSubpackage.originalPrice) *
        (1 - body.discount / 100);
    } else if (body.discountType === "amount" && body.discount) {
      finalPrice = Math.max(
        0,
        Number(body.originalPrice || existingSubpackage.originalPrice) -
          Number(body.discount)
      );
    }

    // Update subpackage
    const updatedSubpackage = await db.subpackage.update({
      where: { id },
      data: {
        name: body.name || existingSubpackage.name,
        description: body.description ?? existingSubpackage.description,
        shortDescription:
          body.shortDescription ?? existingSubpackage.shortDescription,
        price: finalPrice,
        originalPrice:
          body.originalPrice !== undefined
            ? body.originalPrice
            : existingSubpackage.originalPrice,
        discount:
          body.discount !== undefined
            ? body.discount
            : existingSubpackage.discount,
        discountType: body.discountType ?? existingSubpackage.discountType,
        duration: body.duration ?? existingSubpackage.duration,
        status: body.status || existingSubpackage.status,
        isDefault:
          body.isDefault !== undefined
            ? body.isDefault
            : existingSubpackage.isDefault,
        sortOrder:
          body.sortOrder !== undefined
            ? body.sortOrder
            : existingSubpackage.sortOrder,
        features: body.features || existingSubpackage.features,
      },
    });

    // Handle product updates using junction table WITH NEW FIELDS
    if (body.products && Array.isArray(body.products)) {
      // Delete all existing product connections
      await db.subpackageProduct.deleteMany({
        where: { subpackageId: id },
      });

      // Create new product connections WITH NEW FIELDS
      for (const product of body.products) {
        await db.subpackageProduct.create({
          data: {
            subpackageId: id,
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

    // Handle service updates using junction table WITH NEW FIELDS
    if (body.services && Array.isArray(body.services)) {
      // Delete all existing service connections
      await db.subpackageService.deleteMany({
        where: { subpackageId: id },
      });

      // Create new service connections WITH NEW FIELDS
      for (const service of body.services) {
        await db.subpackageService.create({
          data: {
            subpackageId: id,
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

    // If this is now default, unset default on other subpackages in same package
    if (body.isDefault === true) {
      await db.subpackage.updateMany({
        where: {
          packageId: existingSubpackage.packageId,
          id: { not: id },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Fetch the updated subpackage with relations for response
    const finalSubpackage = await db.subpackage.findUnique({
      where: { id },
      include: {
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
    });

    if (!finalSubpackage) {
      return NextResponse.json(
        { error: "Failed to fetch updated subpackage" },
        { status: 500 }
      );
    }

    // Helper function to safely get image
    const getProductImage = (images: any) => {
      try {
        if (!images) return null;
        if (typeof images === "string") {
          try {
            const parsed = JSON.parse(images);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed[0];
            }
            return parsed;
          } catch {
            return images;
          }
        }
        if (Array.isArray(images) && images.length > 0) {
          return images[0];
        }
        return null;
      } catch (error) {
        console.error("Error parsing product images:", error);
        return null;
      }
    };

    // Create response with new fields
    const response = {
      id: finalSubpackage.id,
      packageId: finalSubpackage.packageId,
      name: finalSubpackage.name,
      description: finalSubpackage.description,
      shortDescription: finalSubpackage.shortDescription,
      price: Number(finalSubpackage.price),
      originalPrice: finalSubpackage.originalPrice
        ? Number(finalSubpackage.originalPrice)
        : null,
      discount: finalSubpackage.discount,
      discountType: finalSubpackage.discountType,
      duration: finalSubpackage.duration,
      status: finalSubpackage.status,
      isDefault: finalSubpackage.isDefault,
      sortOrder: finalSubpackage.sortOrder,
      features: finalSubpackage.features,
      salesCount: finalSubpackage.salesCount,
      revenue: Number(finalSubpackage.revenue),
      createdAt: finalSubpackage.createdAt,
      updatedAt: finalSubpackage.updatedAt,
      products: finalSubpackage.products.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        sku: item.product.sku,
        price: Number(item.product.price),
        category: item.product.category,
        stock: item.product.stock,
        image: getProductImage(item.product.images),
        quantity: item.quantity,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        // NEW FIELDS
        itemDiscountType: item.itemDiscountType,
        itemDiscountAmount: item.itemDiscountAmount
          ? Number(item.itemDiscountAmount)
          : null,
        taxRate: item.taxRate ? Number(item.taxRate) : null,
        taxAmount: item.taxAmount ? Number(item.taxAmount) : null,
        status: item.product.status,
      })),
      services: finalSubpackage.services.map((item) => ({
        id: item.service.id,
        name: item.service.name,
        description: item.service.description,
        price: Number(item.service.amount),
        duration: item.service.duration,
        category: item.service.category,
        features: item.service.features,
        quantity: item.quantity,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        // NEW FIELDS
        itemDiscountType: item.itemDiscountType,
        itemDiscountAmount: item.itemDiscountAmount
          ? Number(item.itemDiscountAmount)
          : null,
        taxRate: item.taxRate ? Number(item.taxRate) : null,
        taxAmount: item.taxAmount ? Number(item.taxAmount) : null,
        status: item.service.status,
      })),
    };

    return NextResponse.json({
      success: true,
      message: "Subpackage updated successfully",
      data: response,
    });
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

// DELETE subpackage
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if subpackage exists
    const existingSubpackage = await db.subpackage.findUnique({
      where: { id },
    });

    if (!existingSubpackage) {
      return NextResponse.json(
        { error: "Subpackage not found" },
        { status: 404 }
      );
    }

    // Delete all product connections from junction table
    await db.subpackageProduct.deleteMany({
      where: { subpackageId: id },
    });

    // Delete all service connections from junction table
    await db.subpackageService.deleteMany({
      where: { subpackageId: id },
    });

    // Delete the subpackage
    await db.subpackage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Subpackage deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subpackage:", error);
    return NextResponse.json(
      {
        error: "Failed to delete subpackage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
