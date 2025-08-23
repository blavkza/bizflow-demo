"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FullInvoice } from "@/types/invoice";
import { DollarSign, FileText, TrendingDown, TrendingUp } from "lucide-react";
import { Client } from "@prisma/client";
import { formatCurrency } from "@/lib/formatters";

interface StatsProps {
  invoices: FullInvoice[];
}

export default function Stats({ invoices }: StatsProps) {
  // Calculate all the stats
  const totalOutstanding = invoices
    .filter((invoice) => invoice.status !== "PAID")
    .reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);

  const pendingInvoices = invoices.filter(
    (invoice) => invoice.status !== "PAID" && invoice.status !== "CANCELLED"
  ).length;

  const paidInvoices = invoices.filter(
    (invoice) => invoice.status === "PAID"
  ).length;
  const paidThisMonth = invoices
    .filter((invoice) => {
      if (invoice.status !== "PAID") return false;
      const paidDate = invoice.payments[0]?.paidAt;
      if (!paidDate) return false;
      const paymentDate = new Date(paidDate);
      const now = new Date();
      return (
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

  const overdueInvoices = invoices.filter((invoice) => {
    if (invoice.status === "PAID") return false;
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
    return dueDate && dueDate < new Date();
  }).length;

  const overdueAmount = invoices
    .filter((invoice) => {
      if (invoice.status === "PAID") return false;
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
      return dueDate && dueDate < new Date();
    })
    .reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);

  const totalInvoices = invoices.length;
  const averageInvoice =
    totalInvoices > 0
      ? invoices.reduce(
          (sum, invoice) => sum + Number(invoice.totalAmount || 0),
          0
        ) / totalInvoices
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Outstanding
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalOutstanding)}
          </div>
          <p className="text-xs text-muted-foreground">
            {pendingInvoices} pending invoice{pendingInvoices !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Paid invoices
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(paidThisMonth)}
          </div>
          <p className="text-xs text-muted-foreground">
            {paidInvoices} invoice{paidInvoices !== 1 ? "s" : ""} paid
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(overdueAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {overdueInvoices} overdue invoice{overdueInvoices !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
          <FileText className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(averageInvoice)}
          </div>
          <p className="text-xs text-muted-foreground">
            Based on {totalInvoices} invoice{totalInvoices !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
