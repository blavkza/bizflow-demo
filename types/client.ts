import {
  Client as PrismaClient,
  ClientStatus,
  ClientType,
} from "@prisma/client";

export interface Payment {
  id: string;
  amount: number;
  paidAt: Date | null;
}

export interface Invoice {
  id: string;
  totalAmount: number;
  status: string;
  issueDate: Date;
  payments: Payment[];
}

export interface Client extends Omit<PrismaClient, "createdAt" | "updatedAt"> {
  status: ClientStatus;
  type: ClientType;
  createdAt: Date;
  updatedAt: Date;
  invoices?: Invoice[];
}
