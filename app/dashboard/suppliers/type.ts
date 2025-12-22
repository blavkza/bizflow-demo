import { ProductCategory, VendorStatus } from "@prisma/client";

export enum VendorType {
  SUPPLIER = "SUPPLIER",
  MATERIAL_SUPPLIER = "MATERIAL_SUPPLIER",
  ELECTRONICS_SUPPLIER = "ELECTRONICS_SUPPLIER",
  COURIER = "COURIER",
  CAMERA_MAN = "CAMERA_MAN",
  LOGISTICS = "LOGISTICS",
  SERVICE_PROVIDER = "SERVICE_PROVIDER",
  CONTRACTOR = "CONTRACTOR",
  SUBCONTRACTOR = "SUBCONTRACTOR",
  MANUFACTURER = "MANUFACTURER",
  WHOLESALER = "WHOLESALER",
  RETAILER = "RETAILER",
  DISTRIBUTOR = "DISTRIBUTOR",
  FREELANCER = "FREELANCER",
  AGENCY = "AGENCY",
  CONSULTANT = "CONSULTANT",
  IT_SERVICES = "IT_SERVICES",
  MARKETING = "MARKETING",
  LEGAL = "LEGAL",
  ACCOUNTING = "ACCOUNTING",
  SECURITY_SERVICES = "SECURITY_SERVICES",
  ELECTRICITY_PROVIDER = "ELECTRICITY_PROVIDER",
  WATER_PROVIDER = "WATER_PROVIDER",
  LANDLORD = "LANDLORD",
  OTHER = "OTHER",
}

export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  phone2?: string | null;
  website: string | null;
  address: string | null;
  taxNumber: string | null;
  registrationNumber?: string | null;
  categories: string[] | ProductCategory[];
  type: VendorType;
  tags: string[];
  status: VendorStatus;
  paymentTerms?: string | null;
  notes?: string | null;
  _count: {
    expenses: number;
    Document?: number;
  };
}

export interface VendorFormData {
  name: string;
  fullName?: string;
  email?: string;
  phone: string;
  phone2?: string;
  website?: string;
  address?: string;
  taxNumber?: string;
  registrationNumber?: string;
  categoryIds: string[];
  type: VendorType;
  status: VendorStatus;
  paymentTerms: string;
  notes?: string;
}
