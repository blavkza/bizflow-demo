import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

const TAX_RATE = 0.15; // 15% VAT for South Africa

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
        vender: true,
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

    const currentProduct = await db.shopProduct.findUnique({
      where: { id: params.id },
    });

    if (!currentProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let price, priceBeforeTax, costPrice, costPriceBeforeTax;

    if (body.priceInputMode === "AFTER_TAX") {
      price = parseFloat(body.price);
      priceBeforeTax = price / (1 + TAX_RATE);

      costPrice = body.costPrice ? parseFloat(body.costPrice) : null;
      costPriceBeforeTax = costPrice ? costPrice / (1 + TAX_RATE) : null;
    } else {
      priceBeforeTax = parseFloat(body.priceBeforeTax);
      price = priceBeforeTax * (1 + TAX_RATE);

      costPriceBeforeTax = body.costPriceBeforeTax
        ? parseFloat(body.costPriceBeforeTax)
        : null;
      costPrice = costPriceBeforeTax
        ? costPriceBeforeTax * (1 + TAX_RATE)
        : null;
    }

    if (body.documents && Array.isArray(body.documents)) {
      console.log(`Processing ${body.documents.length} document(s)`);

      await db.productDocument.deleteMany({
        where: { shopProductId: params.id },
      });
      console.log("Deleted existing documents");

      if (body.documents.length > 0) {
        const documentPromises = body.documents.map(
          async (doc: any, index: number) => {
            console.log(
              `Creating document ${index + 1}:`,
              doc.name || `Document_${index + 1}`
            );

            return db.productDocument.create({
              data: {
                name: doc.name || `Document_${index + 1}`,
                url: doc.url,
                type: "OTHER",
                size: doc.size || 0,
                mimeType: doc.mimeType || "application/octet-stream",
                shopProductId: params.id,
              },
            });
          }
        );

        await Promise.all(documentPromises);
      }
    }

    const product = await db.shopProduct.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        sku: body.sku,
        category: body.category,
        venderId: body.venderId,
        // Price fields
        price: price,
        priceBeforeTax: priceBeforeTax,
        costPrice: costPrice,
        costPriceBeforeTax: costPriceBeforeTax,
        priceInputMode: body.priceInputMode || currentProduct.priceInputMode,

        // Inventory
        stock: parseInt(body.stock),
        minStock: parseInt(body.minStock),
        maxStock: body.maxStock ? parseInt(body.maxStock) : null,

        // Product Details
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions,
        warranty: body.warranty,
        color: body.color,
        size: body.size,
        brand: body.brand,

        // Status
        status: body.status,
        featured: body.featured,

        // Images
        images: body.images || [],
      },
      include: {
        productDocuments: true,
      },
    });

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
      {
        error: "Failed to update product",
        details: error instanceof Error ? error.message : String(error),
      },
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

    await db.stockMovement.deleteMany({
      where: { shopProductId: params.id },
    });

    await db.productDocument.deleteMany({
      where: { shopProductId: params.id },
    });

    await db.shopProduct.delete({
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
