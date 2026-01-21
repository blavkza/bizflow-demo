import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarIcon,
  Clock,
  CreditCard,
  Users,
  DollarSign,
  UserCheck,
  Briefcase,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency, formatHours } from "../utils";

interface PayrollSummaryProps {
  payrollData: any[];
  totalBaseAmount: number;
  totalOvertimeAmount: number;
  totalBonusAmount: number;
  totalDeductionAmount: number;
  totalPayroll: number;
  netPayroll: number;
  totalPaidDays: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  workerType: "all" | "employees" | "freelancers";
}

export function PayrollSummary({
  payrollData,
  totalBaseAmount,
  totalOvertimeAmount,
  totalBonusAmount = 0,
  totalDeductionAmount = 0,
  totalPayroll,
  netPayroll,
  totalPaidDays,
  totalRegularHours,
  totalOvertimeHours,
  workerType = "all",
}: PayrollSummaryProps) {
  const employees = payrollData.filter((emp) => !emp.isFreelancer);
  const freelancers = payrollData.filter((emp) => emp.isFreelancer);

  const getWorkerIcon = () => {
    switch (workerType) {
      case "employees":
        return <UserCheck className="h-8 w-8 text-blue-600" />;
      case "freelancers":
        return <Briefcase className="h-8 w-8 text-blue-600" />;
      default:
        return <Users className="h-8 w-8 text-blue-600" />;
    }
  };

  const getWorkerLabel = () => {
    switch (workerType) {
      case "employees":
        return "Employees";
      case "freelancers":
        return "Freelancers";
      default:
        return "Total Workers";
    }
  };

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payroll Summary -{" "}
          {workerType.charAt(0).toUpperCase() + workerType.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Detailed Breakdown */}
        <div className="mt-6 p-4 bg-white dark:bg-zinc-900 rounded-lg border">
          <h4 className="font-semibold mb-3">Detailed Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Base Salaries:</span>
              <span className="font-medium">
                {formatCurrency(totalBaseAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Overtime Total:</span>
              <span className="font-medium text-orange-600">
                +{formatCurrency(totalOvertimeAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Bonuses Total:</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(totalBonusAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Deductions Total:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(totalDeductionAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Regular Hours:</span>
              <span className="font-medium">
                {formatHours(totalRegularHours)}{" "}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Overtime Hours:</span>
              <span className="font-medium text-orange-600">
                {formatHours(totalOvertimeHours)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Gross Amount:</span>
              <span className="font-medium">
                {formatCurrency(totalPayroll)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Workers:</span>
              <span className="font-medium">{payrollData.length}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="font-semibold">Net Amount Payable:</span>
            <span className="font-bold text-lg text-purple-600">
              {formatCurrency(netPayroll)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
