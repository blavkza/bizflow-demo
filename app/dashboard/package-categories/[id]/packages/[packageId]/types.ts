import { PackageCategory } from "@prisma/client";

export interface PackageData {
  id: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  packageCategory: PackageCategory;
  category?: {
    id: string;
    name: string;
  } | null;
  notes: string | null;
  status: string;
  featured: boolean;
  isPublic: boolean;
  images: any;
  thumbnail: string | null;
  salesCount: number;
  totalRevenue: number;
  benefits: string[];
  createdAt: string;
  updatedAt: string;
  subpackages: Subpackage[];
}

export interface Subpackage {
  id: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  discountType: string | null;
  duration: string | null;
  isDefault: boolean;
  sortOrder: number;
  features: string[];
  status: string;
  salesCount: number;
  revenue: number;
  notes: string | null;
  packageId: string;
  createdAt: string;
  updatedAt: string;
  products?: PackageProduct[];
  services?: PackageService[];
}

export interface PackageProduct {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  category: string;
  stock: number;
  images: any | null;
  image: any | null;
  quantity?: number;
  unitPrice?: number;
}

export interface PackageService {
  id: string;
  name: string;
  description: string;
  amount: number;
  duration: string | null;
  category: string;
  features: string[];
  price?: number;
}

export interface SubpackageWithRelations extends Subpackage {
  products: PackageProduct[];
  services: PackageService[];
}

export interface CreateSubpackageData {
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  price: number;
  originalPrice?: number | null;
  discount?: number | null;
  discountType?: "percentage" | "amount" | "none" | string | null;
  duration?: string | null;
  isDefault?: boolean;
  sortOrder?: number;
  status?: string;
  features?: string[];
  products?: Array<{
    id: string;
    quantity?: number;
  }>;
  services?: Array<{
    id: string;
  }>;
  packageId?: string;
}
