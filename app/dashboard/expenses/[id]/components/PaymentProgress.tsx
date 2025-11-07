import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Expense } from "../types";
import { CheckCircle2, Clock, DollarSign } from "lucide-react";

interface PaymentProgressProps {
  expense: Expense;
}

export default function PaymentProgress({ expense }: PaymentProgressProps) {
  const paymentProgress = (expense.paidAmount / expense.totalAmount) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Progress</CardTitle>
        <CardDescription>Track payment completion status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Paid Amount */}
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Paid</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              R{expense.paidAmount.toLocaleString()}
            </div>
            <Progress value={paymentProgress} className="h-2 bg-muted" />
            <div className="text-sm text-muted-foreground">
              {paymentProgress.toFixed(1)}% of total
            </div>
          </div>

          {/* Remaining Amount */}
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">Remaining</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              R{expense.remainingAmount.toLocaleString()}
            </div>
            <Progress value={100 - paymentProgress} className="h-2 bg-muted" />
            <div className="text-sm text-muted-foreground">
              {(100 - paymentProgress).toFixed(1)}% remaining
            </div>
          </div>

          {/* Total Amount */}
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold">
              R{expense.totalAmount.toLocaleString()}
            </div>
            <Progress value={100} className="h-2 bg-blue-100" />
            <div className="text-sm text-muted-foreground">Complete amount</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
