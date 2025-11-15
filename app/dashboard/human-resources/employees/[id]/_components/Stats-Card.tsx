"use client";
import { Calendar, DollarSign, User, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee, SalaryType } from "@prisma/client";
import { formatCurrency } from "@/lib/formatters";
import { Decimal } from "@prisma/client/runtime/library";

interface StatsCardProps {
  employee: Employee & {
    department?: {
      id: string;
      name: string;
      manager?: {
        name: string;
      } | null;
    } | null;
    payments?: {
      id: string;
      amount: Decimal;
      payDate: Date;
      type: string;
      status: string;
      description?: string | null;
    }[];
  };
}

export default function StatsCard({ employee }: StatsCardProps) {
  const totalPaid =
    employee.payments?.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    ) || 0;

  const displaySalary =
    employee.salaryType === "DAILY"
      ? Number(employee.dailySalary)
      : Number(employee.monthlySalary);

  const salaryLabel = employee.salaryType === "DAILY" ? "Per Day" : "Per Month";

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee ID</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.employeeNumber}</div>
            <p className="text-xs text-muted-foreground">
              {new Date(employee.hireDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {employee.salaryType === "DAILY"
                ? "Daily Rate"
                : "Monthly Salary"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(displaySalary)}
            </div>
            <p className="text-xs text-muted-foreground">{salaryLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">Current total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Review</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{"Not scheduled"}</div>
            <p className="text-xs text-muted-foreground">Scheduled date</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
