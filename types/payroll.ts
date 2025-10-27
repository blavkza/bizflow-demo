import { Decimal } from "@prisma/client/runtime/library";
import { AttendanceStatus, PaymentType } from "@prisma/client";

export type EmployeeWithDetails = {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  position: string;
  salary: Decimal | number;
  status: string;
  hireDate: Date | null;
  probationEnd: Date | null;
  avatar: string | null;
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
    payDate: Date;
  }[];
  AttendanceRecord?: {
    id: string;
    date: Date;
    status: AttendanceStatus;
    regularHours: number | null;
  }[];
};

// Type for the payroll calculation data we get from the API
export type PayrollCalculationData = {
  id: string;
  firstName: string;
  lastName: string;
  amount: number;
  paidDays: number;
  dailyRate: number;
  monthlySalary: number;
  department?: {
    id: string;
    name: string;
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

// Type for the payroll submission data (what we send to POST /api/payroll)
export type PayrollSubmissionData = {
  id: string;
  amount: number;
  daysWorked: number;
  departmentId?: string;
};

export type PayrollData = {
  description?: string;
  type: PaymentType;
  month: string;
  employees: PayrollSubmissionData[];
  totalAmount: number;
};
