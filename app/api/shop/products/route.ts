import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

const TAX_RATE = 0.15; // 15% VAT for South Africa

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const products = await db.shopProduct.findMany({
      include: {
        stockMovements: {
          orderBy: { createdAt: "desc" },
        },
        productDocuments: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
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

    const user = await db.user.findUnique({
      where: { userId },
      select: {
        name: true,
        id: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const body = await request.json();

    // Calculate prices based on input mode
    let price, priceBeforeTax, costPrice, costPriceBeforeTax;

    if (body.priceInputMode === "AFTER_TAX") {
      // User entered after-tax prices
      price = parseFloat(body.price);
      priceBeforeTax = price / (1 + TAX_RATE);

      costPrice = body.costPrice ? parseFloat(body.costPrice) : null;
      costPriceBeforeTax = costPrice ? costPrice / (1 + TAX_RATE) : null;
    } else {
      // User entered before-tax prices
      priceBeforeTax = parseFloat(body.priceBeforeTax);
      price = priceBeforeTax * (1 + TAX_RATE);

      costPriceBeforeTax = body.costPriceBeforeTax
        ? parseFloat(body.costPriceBeforeTax)
        : null;
      costPrice = costPriceBeforeTax
        ? costPriceBeforeTax * (1 + TAX_RATE)
        : null;
    }

    // Create product without documents first
    const product = await db.shopProduct.create({
      data: {
        name: body.name,
        description: body.description,
        sku: body.sku,
        category: body.category,

        // Price fields
        price: price,
        priceBeforeTax: priceBeforeTax,
        costPrice: costPrice,
        costPriceBeforeTax: costPriceBeforeTax,
        priceInputMode: body.priceInputMode || "AFTER_TAX",

        // Inventory
        stock: parseInt(body.stock),
        minStock: parseInt(body.minStock),
        maxStock: body.maxStock ? parseInt(body.maxStock) : null,

        // Product Details
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions,
        color: body.color,
        size: body.size,
        brand: body.brand,

        // Status
        status: body.status,
        featured: body.featured,

        // Images
        images: body.images || [],

        // Creator
        creater: user?.name || null,
      },
    });

    // Create product documents if provided
    if (
      body.documents &&
      Array.isArray(body.documents) &&
      body.documents.length > 0
    ) {
      const documentPromises = body.documents.map(
        async (docUrl: string, index: number) => {
          return db.productDocument.create({
            data: {
              name: `Document_${index + 1}`,
              url: docUrl,
              type: "OTHER",
              size: 0,
              mimeType: "application/octet-stream",
              shopProductId: product.id,
            },
          });
        }
      );

      await Promise.all(documentPromises);
    }

    // Create initial stock movement
    if (body.stock > 0) {
      await db.stockMovement.create({
        data: {
          shopProductId: product.id,
          type: "IN",
          quantity: parseInt(body.stock),
          reason: "Initial stock",
          previousStock: 0,
          newStock: parseInt(body.stock),
          creater: user?.name || null,
        },
      });
    }

    // Fetch the complete product with documents
    const completeProduct = await db.shopProduct.findUnique({
      where: { id: product.id },
      include: {
        productDocuments: true,
        stockMovements: true,
      },
    });

    return NextResponse.json(completeProduct, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product: " + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
      return new NextResponse("User not found", { status: 401 });
    }

    const body = await request.json();

    // Get existing product
    const existingProduct = await db.shopProduct.findUnique({
      where: { id: body.id },
    });

    if (!existingProduct) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Calculate prices based on input mode
    let price, priceBeforeTax, costPrice, costPriceBeforeTax;

    if (body.priceInputMode === "AFTER_TAX") {
      // User entered after-tax prices
      price = parseFloat(body.price);
      priceBeforeTax = price / (1 + TAX_RATE);

      costPrice = body.costPrice ? parseFloat(body.costPrice) : null;
      costPriceBeforeTax = costPrice ? costPrice / (1 + TAX_RATE) : null;
    } else {
      // User entered before-tax prices
      priceBeforeTax = parseFloat(body.priceBeforeTax);
      price = priceBeforeTax * (1 + TAX_RATE);

      costPriceBeforeTax = body.costPriceBeforeTax
        ? parseFloat(body.costPriceBeforeTax)
        : null;
      costPrice = costPriceBeforeTax
        ? costPriceBeforeTax * (1 + TAX_RATE)
        : null;
    }

    // Update product
    const updatedProduct = await db.shopProduct.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        sku: body.sku,
        category: body.category,

        // Price fields
        price: price,
        priceBeforeTax: priceBeforeTax,
        costPrice: costPrice,
        costPriceBeforeTax: costPriceBeforeTax,
        priceInputMode: body.priceInputMode || existingProduct.priceInputMode,

        // Inventory
        stock: parseInt(body.stock),
        minStock: parseInt(body.minStock),
        maxStock: body.maxStock ? parseInt(body.maxStock) : null,

        // Product Details
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions,
        color: body.color,
        size: body.size,
        brand: body.brand,

        // Status
        status: body.status,
        featured: body.featured,

        // Images
        images: body.images || [],

        // Update timestamp
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product: " + (error as Error).message },
      { status: 500 }
    );
  }
}
