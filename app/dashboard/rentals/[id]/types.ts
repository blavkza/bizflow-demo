export interface ToolRentalDetail {
  id: string;
  toolId: string;
  tool: {
    name: string;
    description: string | null;
    primaryImage: string | null;
    images: any;
    condition: string;
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
  damageReported: boolean;
  damageDescription: string | null;
  returnCondition: string | null;
  createdAt: string;
  quotation?: {
    id: string;
    status: string;
    client: {
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string | null;
      address: string | null;
    };
  };
  invoice?: {
    id: string;
    status: string;
    invoiceNumber: string;
  };
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    reference: string;
    notes: string | null;
  }>;
}

export interface TimelineEvent {
  id: number;
  date: string;
  event: string;
  description: string;
  status: "completed" | "pending";
  icon?: any;
}

export interface StatusOption {
  value: string;
  label: string;
  description: string;
}
