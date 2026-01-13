export interface ShopProduct {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  weight?: number;
  dimensions?: string;
  color?: string;
  size?: string;
  brand?: string;
  status: string;
  featured: boolean;
  images?: any;
  createdAt: string;
  updatedAt: string;
  productCategory?: {
    id: string;
    name: string;
  };
  productCategoryId?: string;
  venderId?: string;
}

export interface Vendor {
  id: string;
  name: string;
  fullName?: string;
  email?: string;
  phone?: string;
  phone2?: string;
  website?: string;
  address?: string;
  taxNumber?: string;
  registrationNumber?: string;
  categories: any[];
  type: string;
  paymentTerms?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  expenses: any[];
  shopProducts: ShopProduct[];
  _count: {
    expenses: number;
    documents: number;
  };
}
