// app/api/shop/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

// Increase timeout for single category operations
export const maxDuration = 60; // 60 seconds
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the category
    const category = await db.productCategory.findUnique({
      where: { id: params.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Find products that match this category name with pagination
    const page = request.nextUrl.searchParams.get("page") || "1";
    const limit = request.nextUrl.searchParams.get("limit") || "50";
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count first
    const totalProducts = await db.shopProduct.count({
      where: {
        category: category.name,
      },
    });

    // Get paginated products
    const products = await db.shopProduct.findMany({
      where: {
        category: category.name,
      },
      select: {
        id: true,
        name: true,
        price: true,
        status: true,
        category: true,
        images: true,
        description: true,
        stock: true,
        sku: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limitNum,
    });

    const categoryWithProducts = {
      ...category,
      products,
      _count: {
        products: totalProducts,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalProducts,
        pages: Math.ceil(totalProducts / limitNum),
      },
    };

    return NextResponse.json(categoryWithProducts);
  } catch (error) {
    console.error("Failed to fetch category:", error);

    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        { error: "Request timeout. Try with pagination parameters." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();

    const currentCategory = await db.productCategory.findUnique({
      where: { id: params.id },
    });

    if (!currentCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const isNameChanging = body.name && body.name !== currentCategory.name;

    if (isNameChanging) {
      // First, get the count of products to update
      const productCount = await db.shopProduct.count({
        where: {
          category: currentCategory.name,
        },
      });

      console.log(`Found ${productCount} products to update`);

      if (productCount > 0) {
        // For large datasets, update in chunks
        const CHUNK_SIZE = 1000; // Adjust based on your needs
        const totalChunks = Math.ceil(productCount / CHUNK_SIZE);

        // Update in batches for better performance and timeout handling
        for (let i = 0; i < totalChunks; i++) {
          const skip = i * CHUNK_SIZE;

          console.log(
            `Processing chunk ${i + 1}/${totalChunks} (skip: ${skip})`
          );

          try {
            // Update this chunk with a timeout
            const updateResult = await withTimeout(
              db.shopProduct.updateMany({
                where: {
                  category: currentCategory.name,
                  id: {
                    // Get specific IDs for this chunk to avoid race conditions
                    in: await db.shopProduct
                      .findMany({
                        where: {
                          category: currentCategory.name,
                        },
                        select: { id: true },
                        skip: skip,
                        take: CHUNK_SIZE,
                        orderBy: { id: "asc" },
                      })
                      .then((products) => products.map((p) => p.id)),
                  },
                },
                data: {
                  category: body.name,
                },
              }),
              30000,
              `Chunk ${i + 1} update timed out after 30 seconds`
            );

            console.log(
              `Chunk ${i + 1} updated:`,
              updateResult.count,
              "products"
            );
          } catch (chunkError) {
            console.error(`Error updating chunk ${i + 1}:`, chunkError);
            // Continue with other chunks? Or fail the whole operation?
            // For now, we'll continue but log the error
          }
        }

        // Verify the update after all chunks are processed
        const updatedCount = await db.shopProduct.count({
          where: {
            category: body.name,
          },
        });

        console.log(
          `After update - ${updatedCount} products with new category name`
        );

        if (updatedCount < productCount) {
          console.warn(
            `Warning: Expected ${productCount} products, but found ${updatedCount} after update`
          );
        }
      }
    }

    // Update the category itself with timeout
    const updatedCategory = await withTimeout(
      db.productCategory.update({
        where: { id: params.id },
        data: {
          name: body.name,
          description: body.description,
          images: body.images,
        },
      }),
      10000, // 10 second timeout for category update
      "Category update timed out after 10 seconds"
    );

    // Get updated products count with timeout
    const productsCount = await withTimeout(
      db.shopProduct.count({
        where: {
          category: updatedCategory.name,
        },
      }),
      10000, // 10 second timeout for count
      "Products count query timed out after 10 seconds"
    );

    const categoryWithCount = {
      ...updatedCategory,
      _count: {
        products: productsCount,
      },
    };

    return NextResponse.json(categoryWithCount);
  } catch (error) {
    console.error("Failed to update category:", error);

    // Return appropriate error message based on timeout
    if (error instanceof Error && error.message.includes("timed out")) {
      return NextResponse.json(
        {
          error:
            "Operation timed out. The update may still be processing in the background. Please refresh and check the status.",
        },
        { status: 504 } // Gateway Timeout
      );
    }

    return NextResponse.json(
      {
        error: `Failed to update category: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
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

    const category = await db.productCategory.findUnique({
      where: { id: params.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if any products use this category
    const productsCount = await db.shopProduct.count({
      where: {
        category: category.name,
      },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with products",
          productCount: productsCount,
          suggestion:
            "First reassign or delete the products, or change the category name in products",
        },
        { status: 400 }
      );
    }

    await db.productCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Category deleted successfully",
      deletedCategory: category.name,
    });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
