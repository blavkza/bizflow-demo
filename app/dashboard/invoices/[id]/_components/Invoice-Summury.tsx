"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Building, DollarSign } from "lucide-react";
import Link from "next/link";
import { FullInvoice } from "@/types/invoice";

interface InvoiceSummaryProps {
  invoice: {
    amount: number;
    totalAmount: number;
    interestAmount?: number;
    interestRate?: number;
    installmentPeriod?: string;
    dueDate: Date | string;
    client: {
      id: string;
      name: string;
      company: string;
    };
  };
}

const safeFloat = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? 0 : parsed;
};

export default function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  const daysUntilDue = Math.ceil(
    (new Date(invoice.dueDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invoice Amount</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R
            {invoice.totalAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          {safeFloat(invoice.interestAmount) > 0 ? (
            <p className="text-xs text-orange-600 font-medium">
              +
              {safeFloat(invoice.interestAmount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              Interest ({safeFloat(invoice.interestRate)}%)
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Including VAT</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Days Until Due</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {daysUntilDue > 0 ? daysUntilDue : 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {daysUntilDue > 0 ? "Days remaining" : "Payment overdue"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Client</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {invoice.client.company ? (
            <div className="font-bold">
              {invoice.client.company} ({invoice.client.name})
            </div>
          ) : (
            <div className="font-bold">{invoice.client.name}</div>
          )}

          <p className="text-xs text-muted-foreground">
            <Link
              href={`/clients/${invoice.client.id}`}
              className="hover:underline"
            >
              View client details
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
