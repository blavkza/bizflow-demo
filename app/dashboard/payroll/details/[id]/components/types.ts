import { PayrollStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { Payroll } from "@/types/payroll";

export interface PayrollDetailsHeaderProps {
  payroll: Payroll;
  formatMonth: (month: string) => string;
  onDownloadReport: () => void;
  onBack: () => void;
}

export interface SummaryCardsProps {
  payroll: Payroll;
  formatMonth: (month: string) => string;
  getStatusVariant: (
    status: PayrollStatus
  ) => "default" | "secondary" | "outline" | "destructive";
}

export interface PayrollInformationProps {
  payroll: Payroll;
  getStatusVariant: (
    status: PayrollStatus
  ) => "default" | "secondary" | "outline" | "destructive";
  totalBaseAmount: number;
  totalOvertimeAmount: number;
  totalAmount: number;
}

export interface EmployeeBreakdownProps {
  payroll: Payroll;
  getPaymentAmount: (amount: number | Decimal | undefined | null) => number;
  formatCurrency: (amount: number) => string;
  formatHours: (hours: number) => string;
}

export interface TransactionDetailsProps {
  payroll: Payroll;
  formatCurrency: (amount: number) => string;
}
