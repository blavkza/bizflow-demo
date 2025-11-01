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

    if (productId) {
      const documents = await db.productDocument.findMany({
        where: { shopProductId: productId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(documents);
    }

    const documents = await db.productDocument.findMany({
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

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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

    const body = await request.json();

    const document = await db.productDocument.create({
      data: {
        name: body.name,
        url: body.url,
        type: body.type,
        size: body.size,
        mimeType: body.mimeType,
        shopProductId: body.productId,
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

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
