import {
  Client,
  GeneralSetting,
  InvoiceItem,
  InvoicePayment,
} from "@prisma/client";
import { RecurringInvoice as PrismaRecurringInvoice } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: Client;
  description: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  discountType: string;
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
  isRecurring?: boolean;
  recurringId?: string;
  depositRequired?: boolean;
  depositType?: "AMOUNT" | "PERCENTAGE";
  depositAmount?: number | Decimal | null;
  depositRate?: number | Decimal | null;
  installmentPeriod?: string | null;
  interestRate?: number | Decimal | null;
  interestAmount?: number | Decimal | null;
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
    city?: string;
    town?: string;
    village?: string;
    province?: string;
  };
  id: string;
  totalAmount: number;
  status: string;
  description: string;
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  paymentTerms?: string;
  notes?: string;
  terms?: string;
  items: Array<{
    id: string;
    description: string;
    quantity: string | number | Decimal;
    unitPrice: string | number | Decimal;
    amount: string | number | Decimal;
    taxRate?: string | number | Decimal | null;
    taxAmount?: string | number | Decimal | null;
    shopProductId?: string | null;
    serviceId?: string | null;
    itemDiscountType?: "AMOUNT" | "PERCENTAGE" | null;
    itemDiscountAmount?: string | number | Decimal | null;
  }>;
  payments?: Array<{
    id: string;
    amount: string | number | Decimal;
    method: string;
    reference?: string;
    notes?: string;
    status: string;
    paidAt?: string | Date;
  }>;
  amount: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number | Decimal;
  discountAmount?: number | Decimal;
  discountType?: string;
  pdfUrl?: string;
  depositRequired?: boolean;
  depositType?: "AMOUNT" | "PERCENTAGE";
  depositAmount?: number | Decimal | null;
  depositRate?: number | Decimal | null;
  installmentPeriod?: string | null;
  interestRate?: number | Decimal | null;
  interestAmount?: number | Decimal | null;
}

export type InvoiceStatus =
  | "PAID"
  | "SENT"
  | "OVERDUE"
  | "DRAFT"
  | "CANCELLED"
  | "PARTIALLY_PAID";

export type RecurringInvoice = PrismaRecurringInvoice & {
  client: {
    id: string;
    name: string;
    email: string;
  };
  user: {
    name: string;
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    issueDate: string;
    totalAmount: number;
  }>;
};
