import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const product = await db.shopProduct.findUnique({
      where: { id: params.id },
      include: {
        stockMovements: {
          orderBy: { createdAt: "desc" },
        },
        productDocuments: {
          orderBy: { createdAt: "desc" },
        },
        orderItems: true,
        saleItems: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: {
        name: true,
        id: true,
      },
    });

    if (!user) {
      return new NextResponse("user not found", { status: 401 });
    }

    const body = await request.json();

    // Get current product to track stock changes
    const currentProduct = await db.shopProduct.findUnique({
      where: { id: params.id },
    });

    if (!currentProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await db.shopProduct.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        sku: body.sku,
        category: body.category,
        price: parseFloat(body.price),
        costPrice: body.costPrice ? parseFloat(body.costPrice) : null,
        stock: parseInt(body.stock),
        minStock: parseInt(body.minStock),
        maxStock: body.maxStock ? parseInt(body.maxStock) : null,
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions,
        color: body.color,
        size: body.size,
        brand: body.brand,
        status: body.status,
        featured: body.featured,
        images: body.images || [],
      },
      include: {
        productDocuments: true,
      },
    });

    // Create stock movement if stock changed
    if (parseInt(body.stock) !== currentProduct.stock) {
      const quantity = parseInt(body.stock) - currentProduct.stock;
      await db.stockMovement.create({
        data: {
          shopProductId: params.id,
          type: quantity > 0 ? "IN" : "OUT",
          quantity: Math.abs(quantity),
          reason: "Manual adjustment",
          previousStock: currentProduct.stock,
          newStock: parseInt(body.stock),
          creater: user.name || null,
        },
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const productWithRelations = await db.shopProduct.findUnique({
      where: { id: params.id },
      include: {
        orderItems: true,
        saleItems: true,
        stockMovements: true,
        productDocuments: true,
      },
    });

    if (!productWithRelations) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (
      productWithRelations.orderItems.length > 0 ||
      productWithRelations.saleItems.length > 0
    ) {
      return NextResponse.json(
        { error: "Cannot delete product with existing orders or sales" },
        { status: 400 }
      );
    }

    // Delete related records first
    await db.stockMovement.deleteMany({
      where: { shopProductId: params.id },
    });

    await db.productDocument.deleteMany({
      where: { shopProductId: params.id },
    });

    await db.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
