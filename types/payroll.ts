import { PayrollStatus, PaymentType, AttendanceStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface Payment {
  id: string;
  employeeId: string;
  amount: number | Decimal;
  baseAmount: number | Decimal;
  overtimeAmount: number | Decimal;
  type: PaymentType;
  description?: string;
  payDate: Date;
  daysWorked: number;
  overtimeHours: number | Decimal;
  regularHours: number | Decimal;
  createdBy?: string;
  transactionId: string;
  payrollId?: string;
  employee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    position: string;
    salary: number | Decimal;
    department: {
      name: string;
      id: string;
    } | null;
  };
}

export interface Transaction {
  id: string;
  reference: string;
  date: Date;
  description: string;
  amount: number | Decimal;
  currency: string;
}

export interface Payroll {
  id: string;
  month: string;
  description: string;
  type: PaymentType;
  totalAmount: number;
  baseAmount: number;
  overtimeAmount: number;
  currency: string;
  status: PayrollStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  createdByName?: string;
  transaction: Transaction;
  transactionId: string;
  payments: Payment[];
  _count: {
    payments: number;
  };
}

export type EmployeeWithDetails = {
  id: string;
  employeeNumber: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  position: string;
  salary: number | Decimal;
  status: string;
  hireDate: Date | null;
  probationEnd: Date | null;
  avatar: string | null;
  baseAmount: number;
  department: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    manager: {
      name: string;
    } | null;
  } | null;
  payments: {
    amount: Decimal;
    baseAmount: Decimal;
    overtimeAmount: Decimal;
    payDate: Date;
    daysWorked: number;
    overtimeHours: Decimal;
    regularHours: Decimal;
  }[];
  AttendanceRecord?: {
    id: string;
    date: Date;
    status: AttendanceStatus;
    regularHours: number | null;
  }[];
};

export type PayrollCalculationData = {
  id: string;
  firstName: string;
  lastName: string;
  amount: number;
  baseAmount: number;
  overtimeAmount: number;
  paidDays: number;
  dailyRate: number;
  dailySalary: number;
  regularHours: number;
  overtimeHours: number;
  overtimeFixedRate: number;
  department?: {
    id: string;
    name: string;
    manager?: {
      name: string;
    } | null;
  };
  attendanceBreakdown: {
    presentDays: number;
    halfDays: number;
    leaveDays: number;
    absentDays: number;
    unpaidLeaveDays: number;
    totalDays: number;
  };
};

export type PayrollSubmissionData = {
  id: string;
  amount: number;
  baseAmount: number;
  overtimeAmount: number;
  daysWorked: number;
  overtimeHours: number;
  regularHours: number;
  description?: string;
  departmentId?: string;
};

export type PayrollData = {
  description?: string;
  type: PaymentType;
  month: string;
  employees: PayrollSubmissionData[];
  totalAmount: number;
};
