import { Quotation, QuotationItem, Client, User } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export type QuotationWithRelations = Quotation & {
  client: Client;
  items: (QuotationItem & {
    quantity: number | Decimal;
    unitPrice: number | Decimal;
    amount: number | Decimal;
    taxAmount?: number | Decimal | null;
    taxRate?: number | Decimal | null;
  })[];
  invoice?: {
    invoiceNumber: string;
  };
  creator?: {
    id: string;
    name: string;
    GeneralSetting?: Array<{
      logo?: string;
      companyName?: string;
      Address?: string;
      city?: string;
      taxId?: string;
      province?: string;
      postCode?: string;
      email?: string;
      phone?: string;
      phone2?: string;
      phone3?: string;
      website?: string;
      bankAccount?: string;
      bankAccount2?: string;
      bankName?: string;
      bankName2?: string;
    }>;
  };
  activities?: {
    id: string;
    type: string;
    date: Date | string;
    description: string;
    user: string;
  }[];
  amount: number | Decimal;
  taxAmount?: number | Decimal | null;
  taxRate?: number | Decimal | null;
  discountAmount?: number | Decimal | null;
  totalAmount: number | Decimal;
  depositRequired?: boolean;
  depositType?: "AMOUNT" | "PERCENTAGE";
  depositAmount?: number | Decimal | null;
  installmentPeriod?: string | null;
  interestRate?: number | Decimal | null;
  interestAmount?: number | Decimal | null;
};

export type QuotationFormValues = {
  clientId: string;
  projectId?: string | null;
  departmentId?: string | null;
  title: string;
  issueDate: string;
  validUntil: string;
  description?: string | null;
  terms?: string | null;
  notes?: string | null;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number | null;
    shopProductId?: string;
  }[];
  discountType?: "AMOUNT" | "PERCENTAGE" | null;
  discountAmount?: number | null;
};
