import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const stockMovements = await db.stockMovement.findMany({
      where: productId ? { shopProductId: productId } : {},
      include: {
        shopProduct: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(stockMovements);
  } catch (error) {
    console.error("Failed to fetch stock movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock movements" },
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

    // Add validation for required fields
    const { productId, type, quantity, reason, reference } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!type || !["IN", "OUT", "ADJUSTMENT", "RETURN"].includes(type)) {
      return NextResponse.json(
        { error: "Valid type (IN, OUT, ADJUSTMENT, or RETURN) is required" },
        { status: 400 }
      );
    }

    if (quantity === undefined || quantity === null || quantity < 0) {
      return NextResponse.json(
        { error: "Valid quantity is required" },
        { status: 400 }
      );
    }

    console.log("Creating stock movement for product:", productId);

    // Get current stock
    const product = await db.shopProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const previousStock = product.stock;
    let newStock = previousStock;

    if (type === "IN") {
      newStock = previousStock + quantity;
    } else if (type === "OUT") {
      newStock = previousStock - quantity;

      // Check if stock would go negative
      if (newStock < 0) {
        return NextResponse.json(
          { error: "Insufficient stock for this operation" },
          { status: 400 }
        );
      }
    } else if (type === "ADJUSTMENT") {
      newStock = quantity;

      // Ensure adjustment doesn't go negative
      if (newStock < 0) {
        return NextResponse.json(
          { error: "Stock cannot be adjusted to a negative value" },
          { status: 400 }
        );
      }
    } else if (type === "RETURN") {
      newStock = previousStock + quantity;
    }

    await db.shopProduct.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    const stockMovement = await db.stockMovement.create({
      data: {
        shopProductId: productId,
        type: type,
        quantity: quantity,
        reason: reason,
        reference: reference,
        previousStock,
        newStock,
        creater: user.name || null,
      },
      include: {
        shopProduct: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });

    return NextResponse.json(stockMovement, { status: 201 });
  } catch (error) {
    console.error("Failed to create stock movement:", error);
    return NextResponse.json(
      { error: "Failed to create stock movement" },
      { status: 500 }
    );
  }
}
