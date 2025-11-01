import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

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
          take: 5,
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
      return new NextResponse("user not found", { status: 401 });
    }

    const body = await request.json();

    // Create product without documents first
    const product = await db.shopProduct.create({
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
        creater: user?.name || null,
      },
    });

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
