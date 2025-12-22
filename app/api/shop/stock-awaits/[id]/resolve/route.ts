import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(
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
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const body = await request.json();
    const { mode, updateStockMovement } = body;

    const stockAwait = await db.stockAwait.findUnique({
      where: { id: params.id },
      include: {
        sale: true,
        quote: true,
        shopProduct: true,
      },
    });

    if (!stockAwait) {
      return NextResponse.json(
        { error: "Stock await not found" },
        { status: 404 }
      );
    }

    if (stockAwait.status !== "PENDING") {
      return NextResponse.json(
        { error: "Stock await is not in PENDING status" },
        { status: 400 }
      );
    }

    // Update stock await status
    const updatedStockAwait = await db.stockAwait.update({
      where: { id: params.id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: user.name,
      },
    });

    let message = "Stock await resolved successfully.";

    if (mode === "STOCK" || updateStockMovement) {
      const currentStock = stockAwait.shopProduct.stock;
      const newStock = currentStock + stockAwait.quantity;

      await db.shopProduct.update({
        where: { id: stockAwait.shopProductId },
        data: {
          stock: newStock,
        },
      });

      await db.stockMovement.create({
        data: {
          shopProductId: stockAwait.shopProductId,
          type: "IN",
          quantity: stockAwait.quantity,
          reason: `Resolved stock await from ${
            stockAwait.sale
              ? `Sale: ${stockAwait.sale.saleNumber}`
              : stockAwait.quote
                ? `Quote: ${stockAwait.quote.quoteNumber}`
                : "Manual entry"
          }`,
          reference: `Stock Await: ${stockAwait.id}`,
          previousStock: currentStock,
          newStock: newStock,
          creater: user.name,
        },
      });

      message += ` Added ${stockAwait.quantity} units to product stock.`;
    }

    // If related to a sale, check if all awaits are resolved
    if (stockAwait.saleId) {
      const pendingAwaits = await db.stockAwait.count({
        where: {
          saleId: stockAwait.saleId,
          status: "PENDING",
        },
      });

      if (pendingAwaits === 0) {
        await db.sale.update({
          where: { id: stockAwait.saleId },
          data: { status: "COMPLETED" },
        });

        message += " All stock awaits resolved. Sale marked as COMPLETED.";
      }
    }

    return NextResponse.json({
      success: true,
      message,
      stockAwait: updatedStockAwait,
    });
  } catch (error) {
    console.error("Error resolving stock await:", error);
    return NextResponse.json(
      { error: "Failed to resolve stock await" },
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

    const stockAwait = await db.stockAwait.findUnique({
      where: { id: params.id },
    });

    if (!stockAwait) {
      return NextResponse.json(
        { error: "Stock await not found" },
        { status: 404 }
      );
    }

    await db.stockAwait.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting stock await:", error);
    return NextResponse.json(
      { error: "Failed to delete stock await" },
      { status: 500 }
    );
  }
}
