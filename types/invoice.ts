import {
  Client,
  GeneralSetting,
  InvoiceItem,
  InvoicePayment,
} from "@prisma/client";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: Client;
  description: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
}

export interface InvoicesFilterTableProps {
  invoices: Invoice[];
}

export type FullInvoice = {
  id: string;
  invoiceNumber: string;
  clientId: string;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  client: Client;
  items: InvoiceItem[];
  payments: InvoicePayment[];
  creator: {
    name: string;
    GeneralSetting: GeneralSetting | null;
  };
};

export interface InvoiceProps {
  creator: {
    GeneralSetting: Array<{
      companyName?: string;
      Address?: string;
      city?: string;
      logo?: string;
      province?: string;
      postCode?: string;
      phone?: string;
      phone2?: string;
      phone3?: string;
      website?: string;
      bankAccount?: string;
      bankAccount2?: string;
      bankName?: string;
      bankName2?: string;
      email?: string;
      taxId?: string;
      taxRate?: string;
      paymentInstructions?: string;
    }>;
    name: string;
  };
  client: {
    id: string;
    name: string;
    company: string;
    address?: string;
    phone?: string;
    email?: string;
    taxNumber?: string;
  };
  id: string;
  status: string;
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  paymentTerms?: string;
  note?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  taxAmount?: number;
  discountAmount?: number;
  pdfUrl?: string;
}
export type InvoiceStatus = "PAID" | "SENT" | "OVERDUE" | "DRAFT" | "CANCELLED";
