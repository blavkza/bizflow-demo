import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const updatePackageCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .optional(),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sortOrder: z.number().int().min(0).optional(),
  thumbnail: z.string().optional().nullable(),
});

export async function GET(
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
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    const category = await db.packageCategory.findUnique({
      where: { id },
      include: {
        packages: {
          select: {
            id: true,
            name: true,
            status: true,
            packageType: true,
            featured: true,
            createdAt: true,
            _count: {
              select: {
                subpackages: true,
                orders: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Package category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching package category:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch package category",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
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

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const data = await request.json();

    // Validate the update data
    const validationResult = updatePackageCategorySchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if category exists
    const existingCategory = await db.packageCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Package category not found" },
        { status: 404 }
      );
    }

    // Prevent circular reference (category cannot be its own parent)
    if (validatedData.parentId === id) {
      return NextResponse.json(
        { error: "Category cannot be its own parent" },
        { status: 400 }
      );
    }

    // If parentId is being changed, check if new parent exists
    if (validatedData.parentId !== undefined) {
      if (validatedData.parentId) {
        const parentCategory = await db.packageCategory.findUnique({
          where: { id: validatedData.parentId },
        });

        if (!parentCategory) {
          return NextResponse.json(
            { error: "Parent category not found" },
            { status: 404 }
          );
        }
      }
    }

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await db.packageCategory.findFirst({
        where: {
          name: validatedData.name,
          parentId:
            validatedData.parentId !== undefined
              ? validatedData.parentId
              : existingCategory.parentId,
          id: { not: id },
        },
      });

      if (duplicateCategory) {
        return NextResponse.json(
          { error: "A category with this name already exists in this level" },
          { status: 409 }
        );
      }
    }

    // Update the category
    const updatedCategory = await db.packageCategory.update({
      where: { id },
      data: validatedData,
      include: {
        packages: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating package category:", error);
    return NextResponse.json(
      {
        error: "Failed to update package category",
        details: error instanceof Error ? error.message : "Unknown error",
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

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // Check if category exists
    const category = await db.packageCategory.findUnique({
      where: { id },
      include: {
        packages: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Package category not found" },
        { status: 404 }
      );
    }

    // Check if category has packages
    if (category.packages.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with associated packages",
          packageCount: category.packages.length,
        },
        { status: 400 }
      );
    }

    // Delete the category
    await db.packageCategory.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Package category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting package category:", error);
    return NextResponse.json(
      {
        error: "Failed to delete package category",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
