import { PaymentMethod, TransactionType, TransferStatus } from "@prisma/client";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category?: { name: string } | null;
  type: TransactionType;
  amount: number;
  status: TransferStatus;
  method: PaymentMethod;
};

export type CompanySettings = {
  name: string;
  address: string;
  contactNumber: string;
  // Add other settings fields as needed
};

export type TimeRange = "day" | "week" | "month" | "year";
