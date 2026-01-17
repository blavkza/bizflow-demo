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
  itemDiscountType?: "AMOUNT" | "PERCENTAGE" | string | null;
  itemDiscountAmount?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
}

export interface PackageService {
  id: string;
  name: string;
  description: string;
  amount: number;
  duration: string | null;
  category: string;
  features: string[];
  quantity?: number;
  unitPrice?: number;
  itemDiscountType?: "AMOUNT" | "PERCENTAGE" | string | null;
  itemDiscountAmount?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
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
    unitPrice?: number;
    itemDiscountType?: "AMOUNT" | "PERCENTAGE" | string | null;
    itemDiscountAmount?: number | null;
    taxRate?: number | null;
    taxAmount?: number | null;
  }>;
  services?: Array<{
    id: string;
    quantity?: number;
    unitPrice?: number;
    itemDiscountType?: "AMOUNT" | "PERCENTAGE" | string | null;
    itemDiscountAmount?: number | null;
    taxRate?: number | null;
    taxAmount?: number | null;
  }>;
  packageId?: string;
}

export interface UpdateSubpackageItemData {
  id: string;
  quantity: number;
  unitPrice: number;
  itemDiscountType?: "AMOUNT" | "PERCENTAGE" | string | null;
  itemDiscountAmount?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
}

export interface SubpackageFormValues {
  name: string;
  description?: string;
  shortDescription?: string;
  originalPrice: number;
  discountType: "percentage" | "amount" | "none";
  discountValue?: number;
  discountPercentage?: number;
  finalPrice: number;
  duration?: string;
  isDefault: boolean;
  sortOrder: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  features: string[];
  items: Array<{
    id: string;
    name: string;
    type: "product" | "service";
    price: number;
    unitPrice: number;
    quantity: number;
    amount: number;
    itemDiscountType?: "AMOUNT" | "PERCENTAGE";
    itemDiscountAmount?: number;
    taxRate: number;
    taxAmount?: number;
    description?: string;
    sku?: string;
    image?: string;
    duration?: string;
    category?: string;
  }>;
}

export interface SearchableItem {
  id: string;
  name: string;
  type: "product" | "service";
  price: number;
  category?: string;
  duration?: string;
  features?: string[];
  sku?: string;
  description?: string | null;
  image?: string | null;
}

export interface SelectedItem {
  id: string;
  name: string;
  type: "product" | "service";
  price: number;
  unitPrice: number;
  quantity: number;
  amount: number;
  duration?: string;
  category?: string;
  sku?: string;
  image?: string;
  description?: string;

  itemDiscountType?: "AMOUNT" | "PERCENTAGE";
  itemDiscountAmount?: number;
  taxRate: number;
  taxAmount?: number;
}
