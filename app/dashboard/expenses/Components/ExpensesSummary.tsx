import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Expense } from "../types";

interface ExpensesSummaryProps {
  expenses: Expense[];
}

export default function ExpensesSummary({ expenses }: ExpensesSummaryProps) {
  // Ensure amounts are treated as numbers by using Number() or parseFloat()
  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + Number(exp.totalAmount),
    0
  );
  const totalPaid = expenses.reduce(
    (sum, exp) => sum + Number(exp.paidAmount),
    0
  );
  const totalRemaining = expenses.reduce(
    (sum, exp) => sum + Number(exp.remainingAmount),
    0
  );
  const overdueCount = expenses.filter(
    (exp) => exp.status === "OVERDUE"
  ).length;

  // Format numbers properly for display
  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-xs text-muted-foreground">All recorded expenses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPaid)}
          </div>
          <Progress
            value={totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {totalExpenses > 0
              ? ((totalPaid / totalExpenses) * 100).toFixed(1)
              : 0}
            % of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(totalRemaining)}
          </div>
          <Progress
            value={
              totalExpenses > 0 ? (totalRemaining / totalExpenses) * 100 : 0
            }
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {totalExpenses > 0
              ? ((totalRemaining / totalExpenses) * 100).toFixed(1)
              : 0}
            % outstanding
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
          <p className="text-xs text-muted-foreground">
            {overdueCount > 0
              ? "Requires immediate attention"
              : "All payments on track"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
