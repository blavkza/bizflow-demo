"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/invoiceUtils";
import { InvoiceProps } from "@/types/invoice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddPaymentForm from "./AddPaymentForm";

interface InvoicePaymentsProps {
  invoice: InvoiceProps;
}

export default function InvoicePayments({ invoice }: InvoicePaymentsProps) {
  // Calculate payment statistics
  const totalPaid =
    invoice.payments?.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0) || 0;

  const remainingBalance = Number(invoice.totalAmount) - totalPaid;
  const paymentProgress = (totalPaid / Number(invoice.totalAmount)) * 100;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "PENDING":
        return "secondary";
      case "FAILED":
        return "destructive";
      case "REFUNDED":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payments</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="min-w-[800px] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Payment</DialogTitle>
                <DialogDescription>
                  Record a new payment for invoice {invoice.invoiceNumber}
                </DialogDescription>
              </DialogHeader>
              <AddPaymentForm
                invoiceId={invoice.id}
                remainingBalance={remainingBalance}
                onSuccess={() => window.location.reload()}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
            <div className="text-sm text-muted-foreground">Total Paid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(remainingBalance)}
            </div>
            <div className="text-sm text-muted-foreground">
              Remaining Balance
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {paymentProgress.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Payment Progress
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(paymentProgress, 100)}%` }}
          ></div>
        </div>

        {/* Payments Table */}
        {invoice.payments && invoice.payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {formatDate(payment.paidAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {payment.method.replace("_", " ")}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {payment.reference || "N/A"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(payment.amount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {payment.notes || "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No payments recorded yet</p>
            <p className="text-sm">Add the first payment to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
