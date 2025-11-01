import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarIcon,
  Clock,
  CreditCard,
  Users,
  DollarSign,
} from "lucide-react";
import { formatCurrency, formatHours } from "../utils";

interface PayrollSummaryProps {
  payrollData: any[];
  totalBaseAmount: number;
  totalOvertimeAmount: number;
  totalPayroll: number;
  totalPaidDays: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
}

export function PayrollSummary({
  payrollData,
  totalBaseAmount,
  totalOvertimeAmount,
  totalPayroll,
  totalPaidDays,
  totalRegularHours,
  totalOvertimeHours,
}: PayrollSummaryProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payroll Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="text-center p-4 bg-white rounded-lg border">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Total Employees</p>
            <p className="text-lg font-bold text-blue-600">
              {payrollData.length}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <CalendarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Total Paid Days</p>
            <p className="text-lg font-bold text-green-600">{totalPaidDays}</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Regular Hours</p>
            <p className="text-lg font-bold text-blue-500">
              {formatHours(totalRegularHours)}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Overtime Hours</p>
            <p className="text-lg font-bold text-orange-600">
              {formatHours(totalOvertimeHours)}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Total Payroll</p>
            <p className="text-lg font-bold text-purple-600">
              {formatCurrency(totalPayroll)}
            </p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="mt-6 p-4 bg-white rounded-lg border">
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
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="font-semibold">Grand Total:</span>
            <span className="font-bold text-lg">
              {formatCurrency(totalPayroll)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
