import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  Wrench,
} from "lucide-react";

export interface OrderItem {
  id: string;
  shopProductId: string;
  quantity: number;
  price: number;
  total: number;
  product: {
    name: string;
    sku: string;
  };
}

export interface AssignedEmployee {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface ProcessedBy {
  id: string;
  name: string | null;
  email: string | null;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostal: string;
  shippingCountry: string;
  assignedTo: string | null;
  assignedEmployee: AssignedEmployee | null;
  processedBy: ProcessedBy | null;
  carrier: string | null;
  deliveryDate: string | null;
  notes: string;
  shippedDate: string | null;
  deliveredDate: string | null;
}

export enum OrderStatus {
  PENDING_STOCK = "PENDING_STOCK",
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY_FOR_DELIVERY = "READY_FOR_DELIVERY",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export type EmailType = "receipt" | "update";

export interface Employee {
  id: string;
  name: string | null;
  email: string | null;
}
