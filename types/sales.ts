export interface SaleItem {
  id: string;
  shopProductId: string;
  quantity: number;
  price: number;
  total: number;
  product?: {
    name: string;
    sku: string;
  };
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  status: string;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
  items: SaleItem[];
  refundedAmount?: number;
}
