import {
  Package,
  PackageStatus,
  PackageType,
  Subpackage,
  Category,
  ShopProduct,
  Service,
} from "@prisma/client";

// Helper type for products from subpackage
export type SubpackageProduct = {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  category: string;
  stock: number;
  images: any | null;
  // Add other product fields as needed
};

// Helper type for services from subpackage
export type SubpackageService = {
  id: string;
  name: string;
  description: string;
  amount: number;
  duration: string | null;
  category: string;
  features: string[];
  // Add other service fields as needed
};

// Subpackage with products and services
export type SubpackageWithRelations = Subpackage & {
  products: SubpackageProduct[];
  services: SubpackageService[];
};

// Main Package Data Type
export type PackageData = Package & {
  subpackages: SubpackageWithRelations[];
  category?: Category | null;
  _count?: {
    subpackages: number;
    orders: number;
    // These don't exist, remove them
    // services: number;
    // shopProducts: number;
  };
};

// Alternative: More specific PackageData type
export interface PackageDetailedData {
  id: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  categoryId: string | null;
  category?: Category | null;
  classification: string | null;
  notes: string | null;
  packageType: PackageType;
  status: PackageStatus;
  featured: boolean;
  isPublic: boolean;
  images: any;
  thumbnail: string | null;
  salesCount: number;
  totalRevenue: number;
  tags: string[];
  benefits: string[];
  createdAt: Date;
  updatedAt: Date;
  subpackages: SubpackageWithRelations[];
  _count?: {
    subpackages: number;
    orders: number;
  };
}

// Package with stats for dashboard
export type PackageWithStats = Package & {
  subpackages: SubpackageWithRelations[];
  category?: Category | null;
  subpackageCount: number;
  totalSales: number;
  averagePrice: number;
  _count?: {
    subpackages: number;
    orders: number;
  };
};

// Package with all relations
export interface PackageWithRelations extends Package {
  subpackages: SubpackageWithRelations[];
  category: Category | null;
  _count?: {
    subpackages: number;
    orders: number;
  };
}

// Create subpackage data interface
export interface CreateSubpackageData {
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  discountType?: "percentage" | "amount" | "none";
  duration?: string;
  isDefault?: boolean;
  sortOrder?: number;
  features?: string[];
  products?: Array<{
    id: string;
    quantity?: number;
  }>;
  services?: Array<{
    id: string;
  }>;
}

// Update the existing types to remove incorrect relations
export interface StatusCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface DashboardStats {
  totalPackages: number;
  activePackages: number;
  totalSales: number;
  totalRevenue: number;
  averageRevenuePerPackage: number;
  featuredPackages: number;
  draftPackages: number;
  packagesByCategory: Array<{
    category: string;
    count: number;
  }>;
}

export interface CreatePackageData {
  name: string;
  description?: string;
  shortDescription?: string;
  classification?: string;
  category?: {
    id?: string;
    name?: string;
  } | null;
  categoryId?: string;
  packageType?: PackageType;
  status?: PackageStatus;
  featured?: boolean;
  isPublic?: boolean;
  images?: any;
  thumbnail?: string;
  tags?: string[];
  benefits?: string[];
  subpackages?: CreateSubpackageData[];
}

export interface PackageFilters {
  search?: string;
  status?: PackageStatus | "all";
  classification?: string;
  category?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export interface PackageStats {
  totalPackages: number;
  activePackages: number;
  draftPackages: number;
  totalRevenue: number;
  totalSales: number;
  featuredPackages: number;
  averageRevenuePerPackage: number;
  packagesByCategory: Array<{
    category: string;
    count: number;
  }>;
  packagesByClassification: Array<{
    classification: string;
    count: number;
  }>;
  recentPackages: Array<{
    id: string;
    name: string;
    createdAt: Date;
    status: PackageStatus;
    salesCount: number;
  }>;
  topSellingPackages: Array<{
    id: string;
    name: string;
    salesCount: number;
    totalRevenue: number;
  }>;
}

export interface CategoryWithPackages extends Category {
  packages: Package[];
  _count?: {
    packages: number;
  };
}

export interface PackageListResponse {
  packages: PackageWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PackageFormData {
  name: string;
  description: string;
  shortDescription?: string;
  categoryId: string | null;
  classification?: string;
  packageType: PackageType;
  status: PackageStatus;
  featured: boolean;
  isPublic: boolean;
  tags: string[];
  benefits: string[];
  thumbnail?: string;
  images?: any[];
  notes?: string;
}

export interface DialogPackageData {
  id: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  classification?: string | null;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  packageType: string;
  status: string;
  featured: boolean;
  isPublic: boolean;
  thumbnail?: string | null;
  tags: string[];
  benefits: string[];
  notes?: string | null;
  images?: any;
}

// Helper function to get all products and services from a package
export function getAllPackageItems(packageData: PackageData) {
  const allProducts: SubpackageProduct[] = [];
  const allServices: SubpackageService[] = [];

  packageData.subpackages.forEach((subpackage) => {
    allProducts.push(...subpackage.products);
    allServices.push(...subpackage.services);
  });

  return {
    products: allProducts,
    services: allServices,
    totalProducts: allProducts.length,
    totalServices: allServices.length,
  };
}

// Helper function to calculate package total value
export function calculatePackageValue(packageData: PackageData): number {
  return packageData.subpackages.reduce((total, subpackage) => {
    return total + Number(subpackage.price);
  }, 0);
}

// Helper function to get unique categories from package items
export function getPackageItemCategories(packageData: PackageData) {
  const productCategories = new Set<string>();
  const serviceCategories = new Set<string>();

  packageData.subpackages.forEach((subpackage) => {
    subpackage.products.forEach((product) => {
      if (product.category) productCategories.add(product.category);
    });
    subpackage.services.forEach((service) => {
      if (service.category) serviceCategories.add(service.category);
    });
  });

  return {
    productCategories: Array.from(productCategories),
    serviceCategories: Array.from(serviceCategories),
  };
}
