"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecurringInvoice } from "@prisma/client";
import { Repeat, Play, Pause, Calendar, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface RecurringStatsProps {
  recurringInvoices: RecurringInvoice[];
}

export default function RecurringStats({
  recurringInvoices,
}: RecurringStatsProps) {
  // Calculate stats for recurring invoices
  const activeRecurring = recurringInvoices.filter(
    (invoice) => invoice.status === "ACTIVE"
  ).length;

  const pausedRecurring = recurringInvoices.filter(
    (invoice) => invoice.status === "PAUSED"
  ).length;

  const completedRecurring = recurringInvoices.filter(
    (invoice) => invoice.status === "COMPLETED"
  ).length;

  const cancelledRecurring = recurringInvoices.filter(
    (invoice) => invoice.status === "CANCELLED"
  ).length;

  // Calculate estimated monthly revenue
  const estimatedMonthlyRevenue = recurringInvoices
    .filter((invoice) => invoice.status === "ACTIVE")
    .reduce((sum, invoice) => {
      const items = invoice.items as any[];
      const totalAmount =
        items?.reduce((itemSum: number, item: any) => {
          return itemSum + item.quantity * item.unitPrice;
        }, 0) || 0;

      // Adjust for frequency
      let monthlyMultiplier = 1;
      switch (invoice.frequency) {
        case "DAILY":
          monthlyMultiplier = 30;
          break;
        case "WEEKLY":
          monthlyMultiplier = 4;
          break;
        case "MONTHLY":
          monthlyMultiplier = 1;
          break;
        case "QUARTERLY":
          monthlyMultiplier = 1 / 3;
          break;
        case "YEARLY":
          monthlyMultiplier = 1 / 12;
          break;
      }

      return sum + totalAmount * monthlyMultiplier;
    }, 0);

  // Count by frequency
  const frequencyCount = recurringInvoices.reduce(
    (acc, invoice) => {
      acc[invoice.frequency] = (acc[invoice.frequency] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Recurring
          </CardTitle>
          <Play className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {activeRecurring}
          </div>
          <p className="text-xs text-muted-foreground">Currently active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Estimated Monthly
          </CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(estimatedMonthlyRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">From active recurring</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paused</CardTitle>
          <Pause className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {pausedRecurring}
          </div>
          <p className="text-xs text-muted-foreground">Temporarily paused</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Recurring</CardTitle>
          <Repeat className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recurringInvoices.length}</div>
          <p className="text-xs text-muted-foreground">
            All recurring invoices
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
