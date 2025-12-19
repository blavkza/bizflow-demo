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

    const { id } = params;

    // Get the sale first to ensure it exists
    const sale = await db.sale.findUnique({
      where: { id },
      select: { id: true, saleNumber: true },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Fetch all stock await items for this sale
    const stockAwaitItems = await db.stockAwait.findMany({
      where: {
        saleId: id,
        status: "PENDING",
      },
      include: {
        shopProduct: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Format the response
    const formattedItems = stockAwaitItems.map((item) => ({
      id: item.id,
      saleId: item.saleId,
      shopProductId: item.shopProductId,
      quantity: item.quantity,
      status: item.status,
      createdAt: item.createdAt,
      resolvedAt: item.resolvedAt,
      resolvedBy: item.resolvedBy,
      notes: item.notes,
      shopProduct: {
        id: item.shopProduct.id,
        name: item.shopProduct.name,
        sku: item.shopProduct.sku,
        stock: item.shopProduct.stock,
        price: item.shopProduct.price,
      },
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error("Error fetching stock await items:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock await items" },
      { status: 500 }
    );
  }
}

// Optional: Create PUT endpoint to update stock await
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { stockAwaitId, quantity, notes } = body;

    if (!stockAwaitId) {
      return NextResponse.json(
        { error: "Stock await ID is required" },
        { status: 400 }
      );
    }

    // Check if stock await belongs to this sale
    const existingStockAwait = await db.stockAwait.findUnique({
      where: {
        id: stockAwaitId,
        saleId: id,
        status: "PENDING",
      },
    });

    if (!existingStockAwait) {
      return NextResponse.json(
        { error: "Stock await item not found or already resolved" },
        { status: 404 }
      );
    }

    // Update stock await
    const updatedStockAwait = await db.stockAwait.update({
      where: { id: stockAwaitId },
      data: {
        quantity:
          quantity !== undefined ? quantity : existingStockAwait.quantity,
        notes: notes !== undefined ? notes : existingStockAwait.notes,
      },
      include: {
        shopProduct: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Stock await updated successfully",
      data: updatedStockAwait,
    });
  } catch (error) {
    console.error("Error updating stock await:", error);
    return NextResponse.json(
      { error: "Failed to update stock await" },
      { status: 500 }
    );
  }
}

// Optional: Create DELETE endpoint to cancel stock await
export async function DELETE(
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
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const stockAwaitId = searchParams.get("stockAwaitId");

    if (!stockAwaitId) {
      return NextResponse.json(
        { error: "Stock await ID is required" },
        { status: 400 }
      );
    }

    // Check if stock await belongs to this sale
    const existingStockAwait = await db.stockAwait.findUnique({
      where: {
        id: stockAwaitId,
        saleId: id,
      },
    });

    if (!existingStockAwait) {
      return NextResponse.json(
        { error: "Stock await item not found" },
        { status: 404 }
      );
    }

    // Cancel stock await (mark as cancelled instead of deleting)
    const cancelledStockAwait = await db.stockAwait.update({
      where: { id: stockAwaitId },
      data: {
        status: "CANCELLED",
        resolvedAt: new Date(),
        resolvedBy: user.name || user.email || "System",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Stock await cancelled successfully",
      data: cancelledStockAwait,
    });
  } catch (error) {
    console.error("Error cancelling stock await:", error);
    return NextResponse.json(
      { error: "Failed to cancel stock await" },
      { status: 500 }
    );
  }
}
