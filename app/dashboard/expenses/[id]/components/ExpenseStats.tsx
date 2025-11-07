import { Card, CardContent } from "@/components/ui/card";
import { Expense } from "../types";
import {
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExpenseStatsProps {
  expense: Expense;
}

export default function ExpenseStats({ expense }: ExpenseStatsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 border-green-200";
      case "PARTIAL":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-orange-600";
      case "LOW":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getDaysUntilDue = () => {
    const dueDate = new Date(expense.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();
  const paymentProgress = (expense.paidAmount / expense.totalAmount) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Amount */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Amount
              </p>
              <p className="text-3xl font-bold mt-2">
                R{expense.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {expense.expenseNumber}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Payment Status
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(expense.status)}>
                  {expense.status}
                </Badge>
                <span
                  className={`text-sm font-semibold ${getPriorityColor(expense.priority)}`}
                >
                  {expense.priority}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {paymentProgress.toFixed(1)}% paid
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Due Date */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Due Date
              </p>
              <p className="text-xl font-bold mt-2">
                {new Date(expense.dueDate).toLocaleDateString()}
              </p>
              <p
                className={`text-xs font-medium mt-1 ${
                  daysUntilDue < 0
                    ? "text-red-600"
                    : daysUntilDue <= 3
                      ? "text-orange-600"
                      : "text-green-600"
                }`}
              >
                {daysUntilDue < 0
                  ? `${Math.abs(daysUntilDue)} days overdue`
                  : `${daysUntilDue} days remaining`}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${
                daysUntilDue < 0
                  ? "bg-red-100"
                  : daysUntilDue <= 3
                    ? "bg-orange-100"
                    : "bg-green-100"
              }`}
            >
              <Calendar
                className={`h-6 w-6 ${
                  daysUntilDue < 0
                    ? "text-red-600"
                    : daysUntilDue <= 3
                      ? "text-orange-600"
                      : "text-green-600"
                }`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amount Breakdown */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Remaining
              </p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                R{expense.remainingAmount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                R{expense.paidAmount.toLocaleString()} paid
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
