import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export interface StockAwait {
  id: string;
  saleId?: string;
  quoteId?: string;
  shopProductId: string;
  quantity: number;
  status: string;
  notes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  sale?: {
    id: string;
    saleNumber: string;
    customerName?: string;
    status: string;
  };
  quote?: {
    id: string;
    quoteNumber: string;
    customerName?: string;
  };
  shopProduct: {
    name: string;
    sku: string;
    stock: number;
  };
}

export const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertCircle,
  },
  RESOLVED: {
    label: "Resolved",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
} as const;
