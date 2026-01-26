import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface QuickStatsProps {
  grossSalary: number;
  totalDeductions: number;
  netPay: number;
  payDate: string;
  formatCurrency: (amount: number) => string;
  formatDateShort: (dateString: string) => string;
}

const QuickStats: React.FC<QuickStatsProps> = ({
  grossSalary,
  totalDeductions,
  netPay,
  payDate,
  formatCurrency,
  formatDateShort,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Gross Salary</p>
            <p className="text-xl font-bold">{formatCurrency(grossSalary)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Total Deductions
            </p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(totalDeductions)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Net Pay</p>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(netPay)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Payment Date</p>
            <p className="text-sm font-medium">{formatDateShort(payDate)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickStats;
