import {
  Package as PrismaPackage,
  PackageCategory as PrismaPackageCategory,
} from "@prisma/client";

// Extended Package type with stats
// Use Omit to remove fields we want to make optional, then add them back as optional
export interface PackageWithStats
  extends Omit<PrismaPackage, "salesCount" | "totalRevenue"> {
  _count?: {
    orders: number;
  };
  totalSales?: number;
  salesCount?: number; // Now optional
  totalRevenue?: number; // Now optional
}

export interface PackageCategoryWithStats extends PrismaPackageCategory {
  packages?: PackageWithStats[];
  _count?: {
    packages: number;
    children?: number;
  };
  parent?: PackageCategoryWithStats | null;
  children?: PackageCategoryWithStats[];
  stats?: {
    packageCount: number;
    totalSales: number;
    totalRevenue: number;
    averageRevenuePerPackage: number;
    averageSalesPerPackage: number;
  };
}

export type CategoryStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface CategoryFilters {
  search: string;
  status: string;
  parentId: string;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  categoriesWithPackages: number;
  nestedCategories: number;
}
