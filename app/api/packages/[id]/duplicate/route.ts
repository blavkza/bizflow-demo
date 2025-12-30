import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const originalPackage = await db.package.findUnique({
      where: { id },
      include: {
        subpackages: true,
      },
    });

    if (!originalPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Generate a unique name for the duplicate
    const duplicateName = `${originalPackage.name} (Copy)`;

    const existingPackages = await db.package.findMany({
      where: {
        name: {
          startsWith: `${originalPackage.name} (Copy`,
        },
      },
    });

    let finalName = duplicateName;
    if (existingPackages.length > 0) {
      const copyNumber = existingPackages.length + 1;
      finalName = `${originalPackage.name} (Copy ${copyNumber})`;
    }

    const duplicatePackage = await db.package.create({
      data: {
        name: finalName,
        description: originalPackage.description,
        shortDescription: originalPackage.shortDescription,
        classification: originalPackage.classification,
        categoryId: originalPackage.categoryId,
        packageType: originalPackage.packageType,
        status:
          originalPackage.status === "ACTIVE"
            ? "DRAFT"
            : originalPackage.status,
        featured: false,
        isPublic: originalPackage.isPublic,
        images: originalPackage.images as any,
        thumbnail: originalPackage.thumbnail,
        tags: originalPackage.tags,
        benefits: originalPackage.benefits,
        salesCount: 0,
        totalRevenue: 0,
        subpackages:
          originalPackage.subpackages.length > 0
            ? {
                create: originalPackage.subpackages.map((subpkg) => ({
                  name: subpkg.name,
                  description: subpkg.description,
                  shortDescription: subpkg.shortDescription,
                  price: subpkg.price,
                  originalPrice: subpkg.originalPrice,
                  discount: subpkg.discount,
                  duration: subpkg.duration,
                  isDefault: subpkg.isDefault,
                  sortOrder: subpkg.sortOrder,
                  features: subpkg.features,
                })),
              }
            : undefined,
      },
      include: {
        subpackages: true,
        category: true,
      },
    });

    revalidatePath("/dashboard/packages");

    return NextResponse.json(
      {
        message: "Package duplicated successfully",
        package: duplicatePackage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error duplicating package:", error);
    return NextResponse.json(
      { error: "Failed to duplicate package" },
      { status: 500 }
    );
  }
}
