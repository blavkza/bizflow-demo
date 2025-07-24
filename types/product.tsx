export interface Product {
  id: string;
  name: string;
  category: string;
  size: string;
  price: number;
  panels?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  category: string;
  size: string;
  price: number;
  panels?: number;
  description?: string;
}

export const PRODUCT_CATEGORIES = [
  "Window - Mirror",
  "Widow - Glass",
  "Garage Doors - Normal",
  "Garage Doors - Frameless",
  "Single Garage Doors - Normal",
  "Single Garage Doors - Frameless",
  "Kitchen Doors",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
