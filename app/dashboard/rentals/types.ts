export interface Tool {
  id: string;
  name: string;
  rentalRateDaily: any;
  condition: string;
  primaryImage?: string;
  images?: any;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
}

export interface ToolRental {
  id: string;
  toolId: string;
  tool: {
    name: string;
    rentalRateDaily: any;
    primaryImage?: string;
    images?: any;
  };
  businessName: string;
  renterContact: string | null;
  renterEmail: string | null;
  renterPhone: string | null;
  rentalStartDate: string;
  rentalEndDate: string;
  rentalRate: number;
  rentalDays: number | null;
  totalCost: number | null;
  status: string;
  paymentStatus: string;
  amountPaid: number;
  remainingAmount: number | null;
  notes: string | null;
  createdAt: string;
  quotation?: {
    id: string;
    status: string;
    client: Client;
    createAt: Date;
  };
  invoice?: {
    id: string;
    status: string;
    createAt: Date;
  };
}

export type ComboboxOption = {
  label: string;
  value: string;
};

// Helper function to safely convert Decimal to number
export const formatDecimal = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  if (typeof value === "object" && "toNumber" in value) {
    return value.toNumber();
  }
  return parseFloat(value.toString());
};

export const statusOptions = [
  "All Status",
  "PENDING",
  "ACTIVE",
  "OVERDUE",
  "COMPLETED",
  "CANCELLED",
];

export const paymentStatusOptions = ["All", "PENDING", "PAID", "OVERDUE"];

export function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-blue-100 text-blue-800";
    case "PENDING":
      return "bg-purple-100 text-purple-800";
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    case "OVERDUE":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getPaymentStatusColor(paymentStatus: string) {
  switch (paymentStatus) {
    case "PAID":
      return "bg-green-100 text-green-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "OVERDUE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
