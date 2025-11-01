export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  category: string;
  price: number;
  costPrice: number | null;
  stock: number;
  minStock: number;
  maxStock: number | null;
  weight: number | null;
  dimensions: string | null;
  color: string | null;
  size: string | null;
  brand: string | null;
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  featured: boolean;
  images: string[] | null;
  documents: ProductDocument[] | null;
  createdAt: Date;
  updatedAt: Date;
  creater: string;
  stockMovements?: StockMovement[];
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

export interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
  weight: number;
  dimensions: string;
  color: string;
  size: string;
  brand: string;
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  featured: boolean;
  images: string[];
  documents: string[];
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
