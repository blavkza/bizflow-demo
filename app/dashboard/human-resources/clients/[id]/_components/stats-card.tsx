import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText } from "lucide-react";
import { Client } from "@prisma/client";

interface StatsCardProps {
  client: Client & {
    invoices?: {
      totalAmount: number;
      status: string;
      issueDate: Date;
      payments: {
        amount: number;
        paidAt: Date | null;
      }[];
    }[];
  };
}

export default function StatsCard({ client }: StatsCardProps) {
  // Calculate metrics from invoices
  const totalRevenue =
    client.invoices?.reduce((sum, invoice) => sum + invoice.totalAmount, 0) ||
    0;

  const pendingInvoices =
    client.invoices?.filter((invoice) => invoice.status !== "PAID") || [];

  const outstandingBalance = pendingInvoices.reduce(
    (sum, invoice) => sum + invoice.totalAmount,
    0
  );

  const allPayments =
    client.invoices?.flatMap((invoice) => invoice.payments) || [];

  const completedPayments = allPayments.filter(
    (payment) => payment.paidAt !== null
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R{totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Since {new Date(client.createdAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Outstanding Balance
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            R{outstandingBalance.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {pendingInvoices.length} pending invoice
            {pendingInvoices.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment History</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{allPayments.length}</div>
          <p className="text-xs text-muted-foreground">
            {completedPayments.length} completed payment
            {completedPayments.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
