import { CategoryStatus, CategoryType } from "@prisma/client";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  status: CategoryStatus;
  description: string | null;
  color: string | null;
  icon: string | null;
  transactions: {
    id: string;
    amount: number | { toNumber(): number };
  }[];
  transactionCount: number;
  totalAmount: number;
}
