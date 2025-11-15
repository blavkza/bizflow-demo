import {
  Client,
  InvoiceStatus,
  PaymentMethod,
  Project,
  Quotation,
  Transaction,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface Document {
  id: string;
  name: string;
  originalName: string;
  type: string;
  url: string;
  size: number | null;
  mimeType: string | null;
  createdAt: Date;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  clientId: string;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  payments: {
    id: string;
    amount: number;
    method: PaymentMethod;
    paidAt: Date | null;
  }[];
}

export interface ClientWithRelations extends Client {
  invoices?: InvoiceSummary[];
  documents?: Document[];
  projects?: Project[];
  quotations?: Quotation[];
  transactions?: Transaction[];
}
