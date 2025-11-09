"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FullInvoice } from "@/types/invoice";
import {
  DollarSign,
  FileText,
  TrendingDown,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Client } from "@prisma/client";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface StatsProps {
  invoices: FullInvoice[];
}

type TimeFilter = "overall" | "this_month" | "last_6_months";

export default function Stats({ invoices }: StatsProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("overall");

  // Get date ranges based on filter
  const getDateRange = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    switch (timeFilter) {
      case "this_month":
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
        return { start: startOfMonth, end: endOfMonth };

      case "last_6_months":
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return { start: sixMonthsAgo, end: now };

      case "overall":
      default:
        return { start: new Date(0), end: now }; // All time
    }
  };

  const { start, end } = getDateRange();

  // Filter invoices based on time period
  const filterInvoicesByTime = (invoice: FullInvoice) => {
    const invoiceDate = new Date(invoice.issueDate);
    return invoiceDate >= start && invoiceDate <= end;
  };

  // Filter out cancelled invoices and apply time filter
  const activeInvoices = invoices
    .filter((invoice) => invoice.status !== "CANCELLED")
    .filter(filterInvoicesByTime);

  // Calculate total outstanding (all unpaid invoices that are not cancelled)
  const totalOutstanding = activeInvoices
    .filter((invoice) => invoice.status !== "PAID")
    .reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);

  // Pending invoices (all unpaid invoices that are not cancelled)
  const pendingInvoices = activeInvoices.filter(
    (invoice) => invoice.status !== "PAID"
  ).length;

  // Paid invoices count (only active invoices)
  const paidInvoices = activeInvoices.filter(
    (invoice) => invoice.status === "PAID"
  ).length;

  // Total paid amount (all paid invoices in the period)
  const totalPaid = activeInvoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);

  // Paid this period - check all payments in the selected period
  const paidThisPeriod = activeInvoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => {
      // Check if any payment was made in the selected period
      const hasPaymentInPeriod = invoice.payments?.some((payment) => {
        if (!payment.paidAt) return false;
        const paymentDate = new Date(payment.paidAt);
        return paymentDate >= start && paymentDate <= end;
      });

      return hasPaymentInPeriod ? sum + Number(invoice.totalAmount || 0) : sum;
    }, 0);

  // Overdue invoices (unpaid invoices with due date passed)
  const overdueInvoices = activeInvoices.filter((invoice) => {
    if (invoice.status === "PAID") return false;
    if (!invoice.dueDate) return false;

    const dueDate = new Date(invoice.dueDate);
    return dueDate < new Date();
  }).length;

  // Overdue amount
  const overdueAmount = activeInvoices
    .filter((invoice) => {
      if (invoice.status === "PAID") return false;
      if (!invoice.dueDate) return false;

      const dueDate = new Date(invoice.dueDate);
      return dueDate < new Date();
    })
    .reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);

  // Total active invoices count
  const totalActiveInvoices = activeInvoices.length;

  // Total revenue (sum of all paid invoices in period)
  const totalRevenue = activeInvoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);

  // Average invoice amount (only from active invoices)
  const averageInvoice =
    totalActiveInvoices > 0
      ? activeInvoices.reduce(
          (sum, invoice) => sum + Number(invoice.totalAmount || 0),
          0
        ) / totalActiveInvoices
      : 0;

  // Get filter display text
  const getFilterDisplayText = () => {
    switch (timeFilter) {
      case "this_month":
        return "This Month";
      case "last_6_months":
        return "Last 6 Months";
      case "overall":
        return "Overall";
      default:
        return "Overall";
    }
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
              {pendingInvoices} pending invoice
              {pendingInvoices !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices} paid invoice{paidInvoices !== 1 ? "s" : ""} •{" "}
              {getFilterDisplayText()}
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
              {overdueInvoices !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

      {/* Additional Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Summary for {getFilterDisplayText()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Invoices</p>
              <p className="font-semibold">{totalActiveInvoices}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid Invoices</p>
              <p className="font-semibold text-green-600">{paidInvoices}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pending Invoices</p>
              <p className="font-semibold text-amber-600">{pendingInvoices}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Overdue Invoices</p>
              <p className="font-semibold text-red-600">{overdueInvoices}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
