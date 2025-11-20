import { Employee, PaymentStatus, PaymentType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export type EmployeeWithDetails = Employee & {
  payments?: {
    id: string;
    amount: Decimal;
    payDate: Date;
    type: PaymentType;
    status: PaymentStatus;
    description?: string | null;
  }[];
  department?: {
    id: string;
    name: string;
    manager?: {
      name: string;
    } | null;
  } | null;
};

export type StatsCardProps = {
  employee: EmployeeWithDetails;
};

export type TabsSectionProps = {
  employee: EmployeeWithDetails;
  hasFullAccess: boolean;
  canEditEmployees: boolean;
  fetchEmployee: () => void;
};

export interface CompanySettings {
  id: string;
  companyName: string;
  taxId?: string;
  address?: string;
  city?: string;
  website?: string;
  paymentTerms?: string;
  note?: string;
  bankAccount?: string;
  bankAccount2?: string;
  bankName?: string;
  bankName2?: string;
  logo?: string;
  province?: string;
  postCode?: string;
  phone?: string;
  phone2?: string;
  phone3?: string;
  email?: string;
}

export interface EmployeeForUserLinking {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string;
  status: string;
  avatar: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
}
