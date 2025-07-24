import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import db from "@/lib/db";
import { ProductFormValues } from "@/lib/formValidationSchemas";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const products = await db.product.findMany();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const body: ProductFormValues = await request.json();

    const existingProduct = await db.product.findFirst({
      where: {
        category: body.category,
        size: body.size,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          error: "Product with this category and size already exists",
          existingProduct,
        },
        { status: 409 }
      );
    }

    const product = await db.product.create({
      data: {
        category: body.category,
        size: body.size,
        price: body.price,
        panels: body.panels || undefined,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
