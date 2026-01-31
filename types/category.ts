import { CategoryStatus, CategoryType } from "@prisma/client";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  status: CategoryStatus;
  description: string | null;
  // Hierarchical relationships
  parentId: string | null;
  parent?: Category | null;
  children?: Category[];
  
  transactions: {
    id: string;
    amount: number | { toNumber(): number };
  }[];
  transactionCount: number;
  totalAmount: number;
}
