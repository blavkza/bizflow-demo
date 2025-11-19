import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Briefcase,
  CalendarIcon,
  Clock,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { formatCurrency, formatNumber, formatHours } from "../utils";

interface SummaryCardsProps {
  payrollData: any[];
  totalBaseAmount: number;
  totalOvertimeAmount: number;
  totalPayroll: number;
  totalPaidDays: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  workerType: "all" | "employees" | "freelancers";
}

export function SummaryCards({
  payrollData,
  totalBaseAmount,
  totalOvertimeAmount,
  totalPayroll,
  totalPaidDays,
  totalRegularHours,
  totalOvertimeHours,
  workerType = "all",
}: SummaryCardsProps) {
  // Calculate worker type breakdown
  const employees = payrollData.filter((emp) => !emp.isFreelancer);
  const freelancers = payrollData.filter((emp) => emp.isFreelancer);

  const getWorkerLabel = () => {
    switch (workerType) {
      case "employees":
        return "Employees";
      case "freelancers":
        return "Freelancers";
      default:
        return "Workers";
    }
  };

  const getWorkerIcon = () => {
    switch (workerType) {
      case "employees":
        return <UserCheck className="h-4 w-4 text-muted-foreground" />;
      case "freelancers":
        return <Briefcase className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getWorkerBreakdown = () => {
    if (workerType === "all") {
      return `${employees.length} emp + ${freelancers.length} free`;
    }
    return "";
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
      {/* Workers Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {getWorkerLabel()}
              </p>
              <p className="text-2xl font-bold">{payrollData.length}</p>
              {getWorkerBreakdown() && (
                <p className="text-xs text-muted-foreground">
                  {getWorkerBreakdown()}
                </p>
              )}
            </div>
            {getWorkerIcon()}
          </div>
        </CardContent>
      </Card>

      {/* Paid Days Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Paid Days
              </p>
              <p className="text-2xl font-bold">
                {formatNumber(totalPaidDays)}
              </p>
            </div>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Regular Hours Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Regular Hours
              </p>
              <p className="text-2xl font-bold">
                {formatHours(totalRegularHours)}
              </p>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Base Amount Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Base Amount
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalBaseAmount)}
              </p>
            </div>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Overtime Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Overtime
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalOvertimeAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatHours(totalOvertimeHours)}
              </p>
            </div>
            <Clock className="h-4 w-4 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Total Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalPayroll)}
              </p>
            </div>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
