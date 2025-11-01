import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  CalendarIcon,
  Clock,
  CreditCard,
  DollarSign,
  Calendar,
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
}

export function SummaryCards({
  payrollData,
  totalBaseAmount,
  totalOvertimeAmount,
  totalPayroll,
  totalPaidDays,
  totalRegularHours,
  totalOvertimeHours,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Employees
              </p>
              <p className="text-2xl font-bold">{payrollData.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Paid Days
              </p>
              <p className="text-2xl font-bold">
                {formatNumber(totalPaidDays)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Regular Hours
              </p>
              <p className="text-2xl font-bold">
                {formatHours(totalRegularHours)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Base Amount
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalBaseAmount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalPayroll)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
