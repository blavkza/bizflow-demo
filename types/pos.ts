export interface Product {
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
  images?: string[];
  createdAt: string;
  updatedAt: string;
  creater?: string;
  ProductCategory?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
  stock: number;
}

export interface SaleData {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax: number;
  deliveryAmount: number;
  total: number;
  paymentMethod: string;
  amountReceived?: number;
  change?: number;
  isDelivery: boolean;
  deliveryAddress?: string;
  deliveryInstructions?: string;
}

export interface POSSettings {
  id: string;
  vatEnabled: boolean;
  vatRate: number;
  deliveryEnabled: boolean;
  deliveryFee: number;
  freeDeliveryAbove: number;
  discountEnabled: boolean;
  maxDiscountRate: number;
  receiptHeader?: string;
  receiptFooter?: string;
  printAutomatically: boolean;
  emailReceipt: boolean;
}

export interface CompanyInfo {
  id: string;
  companyName: string;
  taxId: string;
  address: string;
  city: string;
  website: string;
  paymentTerms: string;
  note: string;
  bankAccount: string;
  bankAccount2: string;
  bankName: string;
  bankName2: string;
  logo: string;
  province: string;
  postCode: string;
  phone: string;
  phone2: string;
  phone3: string;
  email: string;
}
