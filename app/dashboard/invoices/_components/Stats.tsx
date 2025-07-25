"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, TrendingDown, TrendingUp } from "lucide-react";

interface StatsProps {
  totalOutstanding: number;
  pendingInvoices: number;
  paidThisMonth: number;
  paidInvoices: number;
  overdueAmount: number;
  overdueInvoices: number;
  averageInvoice: number;
  totalInvoices: number;
}

export default function Stats({
  totalOutstanding,
  pendingInvoices,
  paidThisMonth,
  paidInvoices,
  overdueAmount,
  overdueInvoices,
  averageInvoice,
  totalInvoices,
}: StatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
            {pendingInvoices} pending invoices
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
            {paidInvoices} invoice paid
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
            {overdueInvoices} overdue invoice
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
            Based on {totalInvoices} invoices
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
