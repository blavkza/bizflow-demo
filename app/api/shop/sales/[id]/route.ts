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

    const saleId = params.id;

    const sale = await db.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }

    // Get all product IDs from sale items
    const productIds = sale.items.map((item) => item.shopProductId);

    // Fetch products for these items
    const products = await db.shopProduct.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        status: true,
      },
    });

    const productMap = new Map();
    products.forEach((product) => {
      productMap.set(product.id, product);
    });

    const stockAwaits = await db.stockAwait.findMany({
      where: {
        saleId: saleId,
      },
      include: {
        shopProduct: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create a map for stock awaits
    const stockAwaitMap = new Map();
    stockAwaits.forEach((awaitItem) => {
      stockAwaitMap.set(awaitItem.shopProductId, awaitItem);
    });

    // Process items with product and stock information
    const processedItems = sale.items.map((item) => {
      const product = productMap.get(item.shopProductId);
      const stockAwait = stockAwaitMap.get(item.shopProductId);

      const currentStock = product?.stock || 0;
      const hadNegativeStock = item.hadNegativeStock || false;
      const awaitedQuantity = stockAwait?.quantity || item.awaitedQuantity || 0;

      // Determine stock status based on stock await status
      let stockStatus = "AVAILABLE";

      if (stockAwait) {
        if (stockAwait.status === "PENDING") {
          stockStatus = "AWAITING_STOCK";
        } else if (stockAwait.status === "RESOLVED") {
          stockStatus = "AVAILABLE";
        } else if (stockAwait.status === "CANCELLED") {
          stockStatus = "CANCELLED";
        }
      } else if (hadNegativeStock || awaitedQuantity > 0) {
        stockStatus = "AWAITING_STOCK";
      } else if (currentStock < 0) {
        stockStatus = "NEGATIVE_STOCK";
      } else if (currentStock === 0) {
        stockStatus = "OUT_OF_STOCK";
      }

      return {
        ...item,
        ShopProduct: product
          ? {
              name: product.name,
              sku: product.sku,
              stock: product.stock,
              status: product.status,
            }
          : null,
        stockInfo: {
          hadNegativeStock,
          awaitedQuantity,
          stockStatus,
          currentStock,
          needsStock: stockAwait?.status === "PENDING",
          stockAwaitId: stockAwait?.id,
          stockAwaitStatus: stockAwait?.status,
        },
      };
    });

    const pendingStockAwaits = stockAwaits.filter(
      (item) => item.status === "PENDING"
    );
    const awaitingStockCount = pendingStockAwaits.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const awaitingStockProducts = pendingStockAwaits.length;
    const resolvedStockAwaits = stockAwaits.filter(
      (item) => item.status === "RESOLVED"
    ).length;

    let saleStatus = sale.status;
    if (pendingStockAwaits.length > 0) {
      saleStatus = "AWAITING_STOCK";
    } else if (resolvedStockAwaits > 0) {
      saleStatus = "COMPLETED";
    }

    const response = {
      ...sale,
      items: processedItems,
      StockAwait: stockAwaits,
      awaitingStockCount,
      awaitingStockProducts,
      resolvedStockAwaits,
      status: saleStatus,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}
