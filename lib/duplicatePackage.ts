import { Package, PackageStatus, Subpackage } from "@prisma/client";

interface DuplicatePackageOptions {
  nameSuffix?: string;
  resetStats?: boolean;
  defaultStatus?: PackageStatus;
  keepFeatured?: boolean;
}

export async function duplicatePackage(
  originalPackage: Package & { subpackages?: Subpackage[] },
  options: DuplicatePackageOptions = {}
) {
  const {
    nameSuffix = " (Copy)",
    resetStats = true,
    defaultStatus = "DRAFT",
    keepFeatured = false,
  } = options;

  // Generate unique name
  const baseName = `${originalPackage.name}${nameSuffix}`;

  // You might want to check for existing duplicates here
  // and append a number if needed

  return {
    name: baseName,
    description: originalPackage.description,
    shortDescription: originalPackage.shortDescription,
    classification: originalPackage.classification,
    categoryId: originalPackage.categoryId,
    packageType: originalPackage.packageType,
    status:
      originalPackage.status === "ACTIVE"
        ? defaultStatus
        : originalPackage.status,
    featured: keepFeatured ? originalPackage.featured : false,
    isPublic: originalPackage.isPublic,
    images: originalPackage.images,
    thumbnail: originalPackage.thumbnail,
    tags: originalPackage.tags,
    benefits: originalPackage.benefits,
    salesCount: resetStats ? 0 : originalPackage.salesCount,
    totalRevenue: resetStats ? 0 : originalPackage.totalRevenue,
    subpackages: originalPackage.subpackages?.map((subpkg) => ({
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
  };
}
