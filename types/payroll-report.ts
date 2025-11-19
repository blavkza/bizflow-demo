// types/payroll-report.ts
import { Decimal } from "@prisma/client/runtime/library";
import { Payroll } from "@prisma/client";

export interface ProcessedWorker {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: { name: string } | null;
  isFreelancer: boolean;
  workerNumber: string;
  salary: number;
  salaryType: string;
}

export interface ProcessedPayment {
  id: string;
  amount: number;
  baseAmount: number;
  overtimeAmount: number;
  overtimeHours: number;
  regularHours: number;
  daysWorked: number;
  employeeId: string | null;
  freeLancerId: string | null;
  payrollId: string;
  worker: ProcessedWorker | null;
}

export interface ProcessedPayroll {
  id: string;
  month: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  transactionId: string | null;
  createdByName: string;
  notes?: string;
  payments: ProcessedPayment[];
  transaction?: {
    id: string;
    reference: string;
    date: Date;
    description: string;
    amount: number | Decimal;
    currency: string;
  } | null;
}

export interface CompanyInfo {
  id: string;
  companyName: string;
  taxId: string;
  address: string;
  city: string;
  website: string;
  paymentTerms: string;
  note: string;
  bankAccount: string;
  bankAccount2: string;
  bankName: string;
  bankName2: string;
  logo: string;
  province: string;
  postCode: string;
  phone: string;
  phone2: string;
  phone3: string;
  email: string;
}

// Types for the component props
export interface EmployeeWithSalary {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  salaryType: string;
  dailySalary: number | Decimal | null;
  monthlySalary: number | Decimal | null;
  department: { name: string; id: string } | null;
}

export interface PaymentWithWorker {
  id: string;
  amount: number | Decimal | null;
  baseAmount: number | Decimal | null;
  overtimeAmount: number | Decimal | null;
  overtimeHours: number | Decimal | null;
  regularHours: number | Decimal | null;
  daysWorked: number | null;
  employeeId: string | null;
  freeLancerId: string | null;
  payrollId: string;
  employee?: EmployeeWithSalary;
  freeLancer?: {
    id: string;
    freeLancerNumber: string;
    firstName: string;
    lastName: string;
    position: string;
    salary: number | Decimal | null;
    department: { name: string; id: string } | null;
  };
}

export interface ExtendedPayroll {
  id: string;
  month: string;
  description: string;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  transactionId: string | null;
  notes?: string;
  payments: PaymentWithWorker[];
  createdByName: string;
  transaction?: {
    id: string;
    reference: string;
    date: Date;
    description: string;
    amount: number | Decimal;
    currency: string;
  } | null;
}

export type ExtendedPayrollAlt = Omit<Payroll, "transaction"> & {
  payments: PaymentWithWorker[];
  createdByName: string;
  transaction?: {
    id: string;
    reference: string;
    date: Date;
    description: string;
    amount: number | Decimal;
    currency: string;
  } | null;
};
