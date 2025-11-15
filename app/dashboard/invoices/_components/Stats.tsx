"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  FileText,
  TrendingDown,
  TrendingUp,
  Calendar,
} from "lucide-react";

import { FullInvoice } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatters";

type TimeFilter = "overall" | "this_month" | "last_6_months";

interface StatsProps {
  invoices: FullInvoice[];
}

export default function Stats({ invoices }: StatsProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("overall");

  const getDateRange = () => {
    const now = new Date();

    if (timeFilter === "this_month") {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    }

    if (timeFilter === "last_6_months") {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      return { start, end: now };
    }

    return { start: new Date(0), end: now };
  };

  const { start, end } = getDateRange();

  // Helper function to get total paid amount for an invoice
  const getInvoicePaidAmount = (invoice: FullInvoice): number => {
    if (!invoice.payments || invoice.payments.length === 0) return 0;

    return invoice.payments.reduce((sum, payment) => {
      return sum + Number(payment.amount || 0);
    }, 0);
  };

  // Helper function to get outstanding amount for an invoice
  const getInvoiceOutstanding = (invoice: FullInvoice): number => {
    const totalAmount = Number(invoice.totalAmount || 0);
    const paidAmount = getInvoicePaidAmount(invoice);
    return Math.max(0, totalAmount - paidAmount);
  };

  // Helper function to check if invoice is paid
  const isInvoicePaid = (invoice: FullInvoice): boolean => {
    const totalAmount = Number(invoice.totalAmount || 0);
    const paidAmount = getInvoicePaidAmount(invoice);
    return paidAmount >= totalAmount;
  };

  // Helper function to check if invoice is partially paid
  const isInvoicePartiallyPaid = (invoice: FullInvoice): boolean => {
    const totalAmount = Number(invoice.totalAmount || 0);
    const paidAmount = getInvoicePaidAmount(invoice);
    return paidAmount > 0 && paidAmount < totalAmount;
  };

  // Helper function to check if invoice is overdue
  const isInvoiceOverdue = (invoice: FullInvoice): boolean => {
    if (isInvoicePaid(invoice)) return false;
    if (!invoice.dueDate) return false;

    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return dueDate < today;
  };

  // Filter invoices based on time period and status
  const activeInvoices = invoices
    .filter((invoice) => invoice.status !== "CANCELLED")
    .filter((invoice) => {
      const issueDate = new Date(invoice.issueDate);
      return issueDate >= start && issueDate <= end;
    });

  // Calculate total revenue (sum of all invoice total amounts that are paid within the period)
  const totalRevenue = activeInvoices.reduce((sum, invoice) => {
    if (!isInvoicePaid(invoice)) return sum;

    // Check if the invoice was paid within the current time period
    const payments = invoice.payments || [];
    const lastPayment = payments[payments.length - 1];

    if (!lastPayment?.paidAt) return sum;

    const paidAt = new Date(lastPayment.paidAt);
    if (paidAt >= start && paidAt <= end) {
      return sum + Number(invoice.totalAmount || 0);
    }

    return sum;
  }, 0);

  // Calculate total paid amount (sum of all payments within the period)
  const totalPaid = activeInvoices.reduce((sum, invoice) => {
    const payments = invoice.payments || [];
    const paymentsInPeriod = payments.filter((payment) => {
      if (!payment.paidAt) return false;
      const paidAt = new Date(payment.paidAt);
      return paidAt >= start && paidAt <= end;
    });

    return (
      sum +
      paymentsInPeriod.reduce((paymentSum, payment) => {
        return paymentSum + Number(payment.amount || 0);
      }, 0)
    );
  }, 0);

  // Calculate total outstanding (sum of outstanding amounts for all unpaid invoices)
  const totalOutstanding = activeInvoices.reduce((sum, invoice) => {
    if (isInvoicePaid(invoice)) return sum;
    return sum + getInvoiceOutstanding(invoice);
  }, 0);

  // Calculate total overdue (sum of outstanding amounts for overdue invoices)
  const totalOverdue = activeInvoices.reduce((sum, invoice) => {
    if (!isInvoiceOverdue(invoice)) return sum;
    return sum + getInvoiceOutstanding(invoice);
  }, 0);

  // Count invoices by status
  const totalActiveInvoices = activeInvoices.length;
  const paidInvoices = activeInvoices.filter(isInvoicePaid).length;
  const pendingInvoices = activeInvoices.filter(
    (invoice) => !isInvoicePaid(invoice)
  ).length;
  const overdueInvoices = activeInvoices.filter(isInvoiceOverdue).length;
  const partiallyPaidInvoices = activeInvoices.filter(
    isInvoicePartiallyPaid
  ).length;

  // Calculate average invoice value
  const averageInvoice =
    totalActiveInvoices > 0
      ? activeInvoices.reduce(
          (sum, invoice) => sum + Number(invoice.totalAmount || 0),
          0
        ) / totalActiveInvoices
      : 0;

  const getFilterDisplayText = () => {
    if (timeFilter === "this_month") return "This Month";
    if (timeFilter === "last_6_months") return "Last 6 Months";
    return "Overall";
  };

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={timeFilter === "overall" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeFilter("overall")}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Overall
        </Button>

        <Button
          variant={timeFilter === "this_month" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeFilter("this_month")}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          This Month
        </Button>

        <Button
          variant={timeFilter === "last_6_months" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeFilter("last_6_months")}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Last 6 Months
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Outstanding */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
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
              {pendingInvoices} pending invoice
              {pendingInvoices !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices} full paid invoice{paidInvoices !== 1 ? "s" : ""} •{" "}
              {getFilterDisplayText()}
            </p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOverdue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overdueInvoices} overdue invoice
              {overdueInvoices !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Average */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Average Invoice
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageInvoice)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {totalActiveInvoices} invoice
              {totalActiveInvoices !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Summary for {getFilterDisplayText()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <SummaryItem label="Total Invoices" value={totalActiveInvoices} />
            <SummaryItem
              label="Paid Invoices"
              value={paidInvoices}
              valueClass="text-green-600"
            />
            <SummaryItem
              label="Pending Invoices"
              value={pendingInvoices}
              valueClass="text-amber-600"
            />
            <SummaryItem
              label="Overdue Invoices"
              value={overdueInvoices}
              valueClass="text-red-600"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t">
            <SummaryItem
              label="Partially Paid"
              value={partiallyPaidInvoices}
              valueClass="text-blue-600"
            />
            <SummaryItem
              label="Total Payments"
              value={`${formatCurrency(totalPaid)} ${getFilterDisplayText()}`}
            />
            <SummaryItem
              label="Outstanding"
              value={formatCurrency(totalOutstanding)}
              valueClass="text-amber-600"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: any;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={`font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
