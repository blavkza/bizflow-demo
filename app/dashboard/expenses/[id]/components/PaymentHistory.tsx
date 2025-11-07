import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Expense, UpcomingPayment } from "../types";
import RecordPaymentDialog from "./RecordPaymentDialog";

interface PaymentHistoryProps {
  expense: Expense;
  upcomingPayments: UpcomingPayment[];
  onRefresh: () => void;
}

export default function PaymentHistory({
  expense,
  upcomingPayments,
  onRefresh,
}: PaymentHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "PAID":
        return "default";
      case "SCHEDULED":
      case "PARTIAL":
        return "secondary";
      case "PENDING":
        return "outline";
      case "OVERDUE":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All payments made for this expense</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expense.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-bold text-green-600">
                    R{payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {payment.method.toLowerCase().replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {payment.reference}
                  </TableCell>
                  <TableCell>{payment.paidBy}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {payment.notes || "N/A"}
                  </TableCell>
                </TableRow>
              ))}
              {expense.payments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <p>No payments recorded yet.</p>
                      <RecordPaymentDialog
                        expense={expense}
                        onPaymentRecorded={onRefresh}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>Scheduled and pending payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell className="font-bold text-orange-600">
                      R{payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <RecordPaymentDialog
                        expense={expense}
                        onPaymentRecorded={onRefresh}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
