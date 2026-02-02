// types/payroll.ts
import {
  PayrollStatus,
  PaymentType,
  AttendanceStatus,
  SalaryType,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// --- NEW INTERFACES ---
export interface BonusCalculation {
  type: string;
  amount: number;
  description: string;
  isPercentage: boolean;
  percentageRate?: number;
}

export interface DeductionCalculation {
  type: string;
  amount: number;
  description: string;
  isPercentage: boolean;
  percentageRate?: number;
}

// Update existing interfaces
export interface Payment {
  id: string;
  employeeId: string;
  freeLancerId?: string;
  amount: number | Decimal;
  netAmount: number | Decimal;
  baseAmount: number | Decimal;
  overtimeAmount: number | Decimal;
  bonusAmount: number | Decimal;
  deductionAmount: number | Decimal;
  type: PaymentType;
  description?: string;
  payDate: Date;
  daysWorked: number;
  overtimeHours: number | Decimal;
  regularHours: number | Decimal;
  createdBy?: string;
  transactionId: string;
  payrollId?: string;

  paymentBonuses?: PaymentBonus[];
  paymentDeductions?: PaymentDeduction[];

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

export interface Payroll {
  id: string;
  month: string;
  description: string;
  type: PaymentType;
  totalAmount: number;
  netAmount: number;
  baseAmount: number;
  overtimeAmount: number;
  totalBonuses: number;
  totalDeductions: number;
  currency: string;
  status: PayrollStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  createdByName?: string;
  transaction?: Transaction;
  transactionId?: string;
  payments: Payment[];

  payrollBonuses?: PayrollBonus[];
  payrollDeductions?: PayrollDeduction[];

  _count: {
    payments: number;
  };
}

// Add new types
export interface PaymentBonus {
  id: string;
  paymentId: string;
  bonusType: string;
  amount: number | Decimal;
  description?: string;
  isPercentage: boolean;
  percentageRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDeduction {
  id: string;
  paymentId: string;
  deductionType: string;
  amount: number | Decimal;
  description?: string;
  isPercentage: boolean;
  percentageRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollBonus {
  id: string;
  payrollId: string;
  bonusType: string;
  amount: number;
  description?: string;
  isPercentage: boolean;
  percentageRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollDeduction {
  id: string;
  payrollId: string;
  deductionType: string;
  amount: number;
  description?: string;
  isPercentage: boolean;
  percentageRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BonusType =
  | "ANNUAL_BONUS"
  | "PERFORMANCE_BONUS"
  | "ATTENDANCE_BONUS"
  | "THIRTEENTH_CHEQUE"
  | "OVERTIME_BONUS"
  | "SPOT_BONUS"
  | "MERIT_BONUS"
  | "OTHER_BONUS";

export type DeductionType =
  | "UIF"
  | "PENSION"
  | "MEDICAL_AID"
  | "TAX"
  | "UNIFORM_PPE"
  | "LOAN_REPAYMENT"
  | "FUNERAL_BENEFIT"
  | "SAVINGS"
  | "DAMAGE_LOSS"
  | "OTHER_DEDUCTION";

// Update PayrollCalculationData
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
  bonusAmount: number;
  deductionAmount: number;
  amount: number;
  netAmount: number;
  totalAmount: number;
  regularHours: number;
  isFreelancer: boolean;
  employeeType: "EMPLOYEE" | "FREELANCER";
  attendanceBreakdown?: AttendanceBreakdown;
  dailyRate?: number;
  overtimeFixedRate?: number;
  performanceScore?: number;

  // Updated to use the new interfaces
  bonuses?: BonusCalculation[];
  deductions?: DeductionCalculation[];

  // For manual adjustments
  manualBonuses?: {
    type: string;
    amount: number;
    description: string;
  }[];
  manualDeductions?: {
    type: string;
    amount: number;
    description: string;
  }[];
};

// Update PayrollSubmissionData
export type PayrollSubmissionData = {
  id: string;
  amount: number;
  netAmount: number;
  baseAmount: number;
  overtimeAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  daysWorked: number;
  overtimeHours: number;
  regularHours: number;
  description?: string;
  departmentId?: string;
  isFreelancer?: boolean;

  bonuses?: {
    type: string;
    amount: number;
    description?: string;
  }[];
  deductions?: {
    type: string;
    amount: number;
    description?: string;
  }[];
};

// Update PayrollData
export type PayrollData = {
  description?: string;
  type: PaymentType;
  month: string;
  workerType: "all" | "employees" | "freelancers";
  employees: PayrollSubmissionData[];
  totalAmount: number;
  netAmount: number;
  totalBonuses: number;
  totalDeductions: number;
};

// Update PayrollStats
export interface PayrollStats {
  totalEmployees: number;
  totalPayroll: number;
  netPayroll: number;
  totalBaseAmount: number;
  totalOvertimeAmount: number;
  totalBonusAmount: number;
  totalDeductionAmount: number;
  totalPaidDays: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
}

// Update PayrollFormValues
export interface PayrollFormValues {
  description?: string;
  type: PaymentType;
  month: string;
  workerType: "all" | "employees" | "freelancers";
}

// Keep existing types...
export interface Transaction {
  id: string;
  reference: string;
  date: Date;
  description: string;
  amount: number | Decimal;
  currency: string;
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
    bonusAmount: Decimal;
    deductionAmount: Decimal;
    netAmount: Decimal;
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
    netAmount: Decimal;
    baseAmount: Decimal;
    overtimeAmount: Decimal;
    bonusAmount: Decimal;
    deductionAmount: Decimal;
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

export interface PayrollFilter {
  searchTerm: string;
  statusFilter: string;
  monthFilter: string;
  yearFilter: string;
}
