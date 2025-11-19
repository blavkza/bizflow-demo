import {
  PayrollStatus,
  PaymentType,
  AttendanceStatus,
  SalaryType,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface Payment {
  id: string;
  employeeId: string;
  freeLancerId?: string;
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
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    position: string;
    salary: number | Decimal;
    salaryType: SalaryType;
    department: {
      name: string;
      id: string;
    } | null;
  };
  freeLancer?: {
    id: string;
    freeLancerNumber: string;
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

export type FreeLancerWithDetails = {
  id: string;
  freeLancerNumber: string;
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
  isFreelancer: true;
  reliable?: boolean;
  overtimeHourRate: number;
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
  attendanceRecords?: {
    id: string;
    date: Date;
    status: AttendanceStatus;
    regularHours: number | null;
  }[];
};

export type EmployeeWithDetails = {
  id: string;
  employeeNumber: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  position: string;
  salary: number | Decimal;
  salaryType: SalaryType;
  dailySalary: number | Decimal;
  monthlySalary: number | Decimal;
  overtimeHourRate: number;
  status: string;
  hireDate: Date | null;
  probationEnd: Date | null;
  avatar: string | null;
  baseAmount: number;
  isFreelancer: false;
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

export type WorkerWithDetails = EmployeeWithDetails | FreeLancerWithDetails;

export interface AttendanceBreakdown {
  presentDays: number;
  lateDays: number;
  halfDays: number;
  annualLeaveDays: number;
  sickLeaveDays: number;
  absentDays: number;
  unpaidLeaveDays: number;
  totalDays: number;
}

export type PayrollCalculationData = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  salaryType: "DAILY" | "MONTHLY";
  monthlySalary: number;
  dailySalary: number;
  overtimeHourRate: number;
  department: {
    id: string;
    name: string;
    manager?: {
      name: string;
    } | null;
  } | null;
  paidDays: number;
  baseAmount: number;
  overtimeHours: number;
  overtimeAmount: number;
  amount: number;
  totalAmount: number;
  regularHours: number;
  isFreelancer: boolean;
  employeeType: "EMPLOYEE" | "FREELANCER";
  attendanceBreakdown?: AttendanceBreakdown;
  dailyRate?: number;
  overtimeFixedRate?: number;
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
  isFreelancer?: boolean;
};

export type PayrollData = {
  description?: string;
  type: PaymentType;
  month: string;
  workerType: "all" | "employees" | "freelancers";
  employees: PayrollSubmissionData[];
  totalAmount: number;
};

export interface PayrollStats {
  totalEmployees: number;
  totalPayroll: number;
  totalBaseAmount: number;
  totalOvertimeAmount: number;
  totalPaidDays: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
}

export interface PayrollFilter {
  searchTerm: string;
  statusFilter: string;
  monthFilter: string;
  yearFilter: string;
}

export interface PayrollFormValues {
  description?: string;
  type: PaymentType;
  month: string;
  workerType: "all" | "employees" | "freelancers";
}
