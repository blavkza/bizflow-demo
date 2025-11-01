import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  Wrench,
  Home,
} from "lucide-react";
import { OrderStatus, PaymentStatus } from "@/types/order";

export const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<any>;
  }
> = {
  [OrderStatus.PENDING]: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  [OrderStatus.CONFIRMED]: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
  },
  [OrderStatus.PREPARING]: {
    label: "Preparing",
    color: "bg-purple-100 text-purple-800",
    icon: Wrench,
  },
  [OrderStatus.READY_FOR_DELIVERY]: {
    label: "Ready for Delivery",
    color: "bg-indigo-100 text-indigo-800",
    icon: Package,
  },
  [OrderStatus.OUT_FOR_DELIVERY]: {
    label: "Out for Delivery",
    color: "bg-orange-100 text-orange-800",
    icon: Truck,
  },
  [OrderStatus.DELIVERED]: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  [OrderStatus.CANCELLED]: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

export const paymentStatusConfig: Record<
  PaymentStatus,
  {
    label: string;
    color: string;
  }
> = {
  [PaymentStatus.PENDING]: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  [PaymentStatus.PAID]: {
    label: "Paid",
    color: "bg-green-100 text-green-800",
  },
  [PaymentStatus.FAILED]: {
    label: "Failed",
    color: "bg-red-100 text-red-800",
  },
  [PaymentStatus.REFUNDED]: {
    label: "Refunded",
    color: "bg-orange-100 text-orange-800",
  },
};

export const carriers = [
  "The Courier Guy",
  "DHL",
  "FedEx",
  "UPS",
  "Aramex",
  "PostNet",
  "Paxi",
  "Other",
] as const;

export type Carrier = (typeof carriers)[number];

// Helper function to get next possible statuses
export const getNextStatusOptions = (
  currentStatus: OrderStatus
): OrderStatus[] => {
  const statusFlow: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [
      OrderStatus.READY_FOR_DELIVERY,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.READY_FOR_DELIVERY]: [
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  return statusFlow[currentStatus] || [];
};

// Helper to check if status transition is valid
export const isValidStatusTransition = (
  from: OrderStatus,
  to: OrderStatus
): boolean => {
  return getNextStatusOptions(from).includes(to);
};

export const UNSELECTED = "UNSELECTED";
