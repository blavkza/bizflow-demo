export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  category: string;

  price: number;
  costPrice: number | null;

  priceBeforeTax: number | null;
  costPriceBeforeTax: number | null;
  priceInputMode: "BEFORE_TAX" | "AFTER_TAX";

  // Inventory
  stock: number;
  minStock: number;
  maxStock: number | null;

  // Product Details
  weight: number | null;
  dimensions: string | null;
  color: string | null;
  size: string | null;
  brand: string | null;

  // Status
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  featured: boolean;

  // Media
  images: string[] | null;
  documents: ProductDocument[] | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  creater: string;

  // Relations
  stockMovements?: StockMovement[];
}

export interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  category: string;

  price: number;
  priceBeforeTax: number;
  costPrice: number | null;
  costPriceBeforeTax: number | null;
  priceInputMode: "BEFORE_TAX" | "AFTER_TAX";

  // Inventory
  stock: number;
  minStock: number;
  maxStock: number;

  // Product Details
  weight: number;
  dimensions: string;
  color: string;
  size: string;
  brand: string;

  // Status
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  featured: boolean;

  // Media
  images: string[];
  documents: string[];
}

export interface ProductDocument {
  id: string;
  name: string;
  url: string;
  type: "IMAGE" | "PDF" | "DOCUMENT" | "OTHER";
  size: number;
  mimeType: string;
  createdAt: Date;
}

export interface UploadedFile {
  url: string;
  name: string;
  type: "IMAGE" | "PDF" | "DOCUMENT" | "OTHER";
  size: number;
  mimeType: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  reason: string | null;
  reference: string | null;
  previousStock: number;
  newStock: number;
  createdAt: Date;
  creater: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    products: number;
  };
}

export interface UploadResponse {
  url: string;
  public_id: string;
  type: "IMAGE" | "PDF" | "DOCUMENT" | "OTHER";
}

export interface ProductDocumentData {
  name: string;
  url: string;
  type: "IMAGE" | "PDF" | "DOCUMENT" | "OTHER";
  size: number;
  mimeType: string;
}
