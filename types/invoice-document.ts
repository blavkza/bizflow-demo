// types/invoice-document.ts
import {
  InvoiceDocument as PrismaInvoiceDocument,
  DocumentItem as PrismaDocumentItem,
  DocumentStatus,
  InvoiceDocumentType,
  GeneralSetting,
} from "@prisma/client";

export type DocumentItem = PrismaDocumentItem & {
  quantity: any;
  unitPrice: any;
  amount: any;
  taxRate?: any;
  taxAmount?: any;
  deliveredQuantity?: any;
  product?: any;
  service?: any;
};

export interface GeneralSettingType {
  companyName?: string;
  Address?: string;
  city?: string;
  province?: string;
  postCode?: string;
  phone?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  website?: string;
  bankAccount?: string;
  bankAccount2?: string;
  bankName?: string;
  bankName2?: string;
  email?: string;
  taxId?: string;
  logo?: string;
}

export interface ClientType {
  id: string;
  name: string;
  email: string;
  company?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  phone?: string;
  taxNumber?: string;
}

export interface SupplierType {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  country?: string;
  phone?: string;
}

export type InvoiceDocument = PrismaInvoiceDocument & {
  client?: ClientType;
  supplier?: SupplierType;
  creator?: {
    id: string;
    name: string;
    email: string;
    GeneralSetting?: GeneralSettingType[];
  };
  items: DocumentItem[];
  payments?: any[];
  project?: any;
  department?: any;
};

export type InvoiceDocumentWithRelations = InvoiceDocument & {
  client: ClientType;
  supplier?: SupplierType;
  creator: {
    id: string;
    name: string;
    email: string;
    GeneralSetting?: GeneralSettingType[];
  };
  items: DocumentItem[];
  payments: any[];
  project?: any;
  department?: any;
};
