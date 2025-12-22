import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const saleId = searchParams.get("saleId");
    const quoteId = searchParams.get("quoteId");
    const productId = searchParams.get("productId");

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (saleId) {
      where.saleId = saleId;
    }

    if (quoteId) {
      where.quoteId = quoteId;
    }

    if (productId) {
      where.shopProductId = productId;
    }

    const stockAwaits = await db.stockAwait.findMany({
      where,
      include: {
        sale: {
          select: {
            saleNumber: true,
            customerName: true,
          },
        },
        quote: {
          select: {
            quoteNumber: true,
            customerName: true,
          },
        },
        shopProduct: {
          select: {
            name: true,
            sku: true,
            stock: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(stockAwaits);
  } catch (error) {
    console.error("Error fetching stock awaits:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock awaits" },
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
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const body = await request.json();
    const { saleId, quoteId, shopProductId, quantity, notes } = body;

    if (!shopProductId || !quantity) {
      return NextResponse.json(
        { error: "Product ID and quantity are required" },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await db.shopProduct.findUnique({
      where: { id: shopProductId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if stock await already exists for this sale/product or quote/product
    const existingAwait = await db.stockAwait.findFirst({
      where: {
        OR: [
          { saleId, shopProductId },
          { quoteId, shopProductId },
        ],
        status: "PENDING",
      },
    });

    if (existingAwait) {
      return NextResponse.json(
        { error: "Stock await already exists for this product" },
        { status: 400 }
      );
    }

    const stockAwait = await db.stockAwait.create({
      data: {
        saleId: saleId || null,
        quoteId: quoteId || null,
        shopProductId,
        quantity,
        notes: notes || null,
        status: "PENDING",
      },
      include: {
        shopProduct: true,
      },
    });

    return NextResponse.json(stockAwait);
  } catch (error) {
    console.error("Error creating stock await:", error);
    return NextResponse.json(
      { error: "Failed to create stock await" },
      { status: 500 }
    );
  }
}
