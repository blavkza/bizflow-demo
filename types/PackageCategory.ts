import {
  Package,
  PackageCategory as PrismaPackageCategory,
} from "@prisma/client";

export interface PackageCategoryWithStats extends PrismaPackageCategory {
  packages: Package[];
  _count?: {
    packages: number;
    children?: number;
  };
  parent?: PackageCategoryWithStats | null;
  children?: PackageCategoryWithStats[];
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
