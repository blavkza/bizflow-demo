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
        subpackages: {
          include: {
            products: true, // Include product relations with all fields
            services: true, // Include service relations with all fields
          },
        },
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
        status:
          originalPackage.status === "ACTIVE"
            ? "DRAFT"
            : originalPackage.status,
        featured: false,
        isPublic: originalPackage.isPublic,
        images: originalPackage.images as any,
        thumbnail: originalPackage.thumbnail,
        benefits: originalPackage.benefits,
        packageCategoryId: originalPackage.packageCategoryId,
        salesCount: 0,
        totalRevenue: 0,
      },
    });

    // Duplicate subpackages with their product and service relations INCLUDING NEW FIELDS
    if (originalPackage.subpackages.length > 0) {
      for (const subpackage of originalPackage.subpackages) {
        const duplicateSubpackage = await db.subpackage.create({
          data: {
            packageId: duplicatePackage.id,
            name: subpackage.name,
            description: subpackage.description,
            shortDescription: subpackage.shortDescription,
            price: subpackage.price,
            originalPrice: subpackage.originalPrice,
            discount: subpackage.discount,
            discountType: subpackage.discountType, // NEW FIELD
            duration: subpackage.duration,
            status:
              subpackage.status === "ACTIVE" ? "DRAFT" : subpackage.status,
            isDefault: subpackage.isDefault,
            sortOrder: subpackage.sortOrder,
            features: subpackage.features,
            salesCount: 0,
            revenue: 0,
          },
        });

        // Duplicate product relations WITH NEW FIELDS
        if (subpackage.products.length > 0) {
          for (const productRelation of subpackage.products) {
            await db.subpackageProduct.create({
              data: {
                subpackageId: duplicateSubpackage.id,
                productId: productRelation.productId,
                quantity: productRelation.quantity,
                unitPrice: productRelation.unitPrice,
                // NEW FIELDS
                itemDiscountType: productRelation.itemDiscountType,
                itemDiscountAmount: productRelation.itemDiscountAmount,
                taxRate: productRelation.taxRate,
                taxAmount: productRelation.taxAmount,
              },
            });
          }
        }

        // Duplicate service relations WITH NEW FIELDS
        if (subpackage.services.length > 0) {
          for (const serviceRelation of subpackage.services) {
            await db.subpackageService.create({
              data: {
                subpackageId: duplicateSubpackage.id,
                serviceId: serviceRelation.serviceId,
                quantity: serviceRelation.quantity,
                unitPrice: serviceRelation.unitPrice,
                // NEW FIELDS
                itemDiscountType: serviceRelation.itemDiscountType,
                itemDiscountAmount: serviceRelation.itemDiscountAmount,
                taxRate: serviceRelation.taxRate,
                taxAmount: serviceRelation.taxAmount,
              },
            });
          }
        }
      }
    }

    // Fetch the complete duplicated package with all relations
    const completeDuplicatedPackage = await db.package.findUnique({
      where: { id: duplicatePackage.id },
      include: {
        subpackages: {
          include: {
            products: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    sku: true,
                  },
                },
              },
            },
            services: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    amount: true,
                  },
                },
              },
            },
          },
        },
        packageCategory: true,
      },
    });

    if (!completeDuplicatedPackage) {
      return NextResponse.json(
        { error: "Failed to fetch duplicated package" },
        { status: 500 }
      );
    }

    // Transform the response
    const transformedResponse = {
      ...completeDuplicatedPackage,
      subpackages: completeDuplicatedPackage.subpackages.map((subpackage) => ({
        ...subpackage,
        price: Number(subpackage.price),
        originalPrice: subpackage.originalPrice
          ? Number(subpackage.originalPrice)
          : null,
        revenue: Number(subpackage.revenue),
        products: subpackage.products.map((p) => ({
          id: p.product.id,
          name: p.product.name,
          price: Number(p.product.price),
          sku: p.product.sku,
          quantity: p.quantity,
          unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
          // NEW FIELDS
          itemDiscountType: p.itemDiscountType,
          itemDiscountAmount: p.itemDiscountAmount
            ? Number(p.itemDiscountAmount)
            : null,
          taxRate: p.taxRate ? Number(p.taxRate) : null,
          taxAmount: p.taxAmount ? Number(p.taxAmount) : null,
        })),
        services: subpackage.services.map((s) => ({
          id: s.service.id,
          name: s.service.name,
          amount: Number(s.service.amount),
          quantity: s.quantity,
          unitPrice: s.unitPrice ? Number(s.unitPrice) : null,
          // NEW FIELDS
          itemDiscountType: s.itemDiscountType,
          itemDiscountAmount: s.itemDiscountAmount
            ? Number(s.itemDiscountAmount)
            : null,
          taxRate: s.taxRate ? Number(s.taxRate) : null,
          taxAmount: s.taxAmount ? Number(s.taxAmount) : null,
        })),
      })),
    };

    revalidatePath("/dashboard/packages");

    return NextResponse.json(
      {
        message: "Package duplicated successfully",
        package: transformedResponse,
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
