import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

const TAX_RATE = 0.15; // 15% VAT for South Africa

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    // Build where clause for filtering
    const where: any = {};

    // Search filter (name, SKU, brand, description)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (category && category !== "All Categories") {
      where.category = category;
    }

    // Status filter
    if (status && status !== "All Status") {
      switch (status) {
        case "Active":
          where.status = "ACTIVE";
          break;
        case "Inactive":
          where.status = "INACTIVE";
          break;
        case "Out of Stock":
          where.stock = 0;
          break;
        case "Low Stock":
          where.AND = [
            { stock: { gt: 0 } },
            { stock: { lte: db.shopProduct.fields.minStock } },
          ];
          break;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Get total count with filters
    const total = await db.shopProduct.count({ where });

    // Get paginated products with filters
    const products = await db.shopProduct.findMany({
      where,
      skip,
      take: limit,
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

    // Return with pagination metadata
    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
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
    console.log(
      "Creating product with documents:",
      body.documents?.length || 0
    );

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

    // Create product with documents
    const product = await db.shopProduct.create({
      data: {
        name: body.name,
        description: body.description,
        sku: body.sku,
        category: body.category,
        venderId: body.vendorId,
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
        warranty: body.warranty,
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

        // Create documents in the same transaction
        productDocuments:
          body.documents &&
          Array.isArray(body.documents) &&
          body.documents.length > 0
            ? {
                create: body.documents.map((doc: any, index: number) => ({
                  name: doc.name || `Document_${index + 1}`,
                  url: doc.url,
                  type: "OTHER",
                  size: doc.size || 0,
                  mimeType: doc.mimeType || "application/octet-stream",
                })),
              }
            : undefined,
      },
      include: {
        productDocuments: true,
      },
    });

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

    console.log(
      "Product created with",
      product.productDocuments.length,
      "documents"
    );
    return NextResponse.json(product, { status: 201 });
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
    console.log(
      "Updating product with documents:",
      body.documents?.length || 0
    );

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

    // First, handle documents separately
    if (body.documents && Array.isArray(body.documents)) {
      console.log("Processing", body.documents.length, "documents");

      // Delete existing documents
      await db.productDocument.deleteMany({
        where: { shopProductId: body.id },
      });
      console.log("Deleted existing documents");

      // Create new documents if any
      if (body.documents.length > 0) {
        const documentPromises = body.documents.map(
          async (doc: any, index: number) => {
            try {
              const result = await db.productDocument.create({
                data: {
                  name: doc.name || `Document_${index + 1}`,
                  url: doc.url,
                  type: "OTHER",
                  size: doc.size || 0,
                  mimeType: doc.mimeType || "application/octet-stream",
                  shopProductId: body.id,
                },
              });
              console.log("Created document:", result.name);
              return result;
            } catch (error) {
              console.error("Error creating document:", error);
              throw error;
            }
          }
        );

        await Promise.all(documentPromises);
        console.log("All documents created successfully");
      }
    }

    // Update product
    const updatedProduct = await db.shopProduct.update({
      where: { id: body.id },
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
        priceInputMode: body.priceInputMode || existingProduct.priceInputMode,

        // Inventory
        stock: parseInt(body.stock),
        minStock: parseInt(body.minStock),
        maxStock: body.maxStock ? parseInt(body.maxStock) : null,

        // Product Details
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions,
        Warranty: body.Warranty,
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
      include: {
        productDocuments: true,
      },
    });

    console.log(
      "Product updated with",
      updatedProduct.productDocuments.length,
      "documents"
    );
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product: " + (error as Error).message },
      { status: 500 }
    );
  }
}
