export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  taxNumber: string | null;
  category: string | null;
  tags: string[];
  status: string;
  _count: {
    expenses: number;
  };
}

export type VendorFormData = {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  taxNumber: string;
  category: string;
  paymentTerms: string;
  notes: string;
};
