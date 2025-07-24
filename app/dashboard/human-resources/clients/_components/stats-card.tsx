"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, DollarSign, TrendingUp, Users } from "lucide-react";
import { Client } from "@/types/client";

interface StatsCardProps {
  clients: Client[];
}

export default function StatsCard({ clients }: StatsCardProps) {
  // Calculate statistics
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "ACTIVE").length;

  const { totalOutstanding, clientsWithOutstanding } = clients.reduce(
    (acc, client) => {
      if (!client.invoices || client.invoices.length === 0) return acc;

      const unpaidInvoices = client.invoices.filter(
        (invoice) => invoice.status !== "PAID"
      );

      const unpaidAmount = unpaidInvoices.reduce((sum, invoice) => {
        const paidAmount = invoice.payments.reduce(
          (paymentSum, payment) => paymentSum + payment.amount,
          0
        );
        return sum + (invoice.totalAmount - paidAmount);
      }, 0);

      if (unpaidAmount > 0) {
        acc.totalOutstanding += unpaidAmount;
        acc.clientsWithOutstanding += 1;
      }

      return acc;
    },
    { totalOutstanding: 0, clientsWithOutstanding: 0 }
  );

  const { totalPaymentTime, paymentCount } = clients.reduce(
    (acc, client) => {
      if (!client.invoices || client.invoices.length === 0) return acc;

      client.invoices.forEach((invoice) => {
        if (invoice.status === "PAID" && invoice.payments.length > 0) {
          const paidPayment = invoice.payments.find((p) => p.paidAt);
          if (paidPayment?.paidAt) {
            const paymentTime = Math.ceil(
              (paidPayment.paidAt.getTime() - invoice.issueDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            acc.totalPaymentTime += paymentTime;
            acc.paymentCount += 1;
          }
        }
      });

      return acc;
    },
    { totalPaymentTime: 0, paymentCount: 0 }
  );

  const averagePaymentTime =
    paymentCount > 0 ? Math.round(totalPaymentTime / paymentCount) : 0;

  // Calculate new clients from last month
  const now = new Date();
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const newClientsLastMonth = clients.filter(
    (client) => new Date(client.createdAt) >= firstDayLastMonth
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Clients Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalClients}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">+{newClientsLastMonth}</span> from
            last month
          </p>
        </CardContent>
      </Card>

      {/* Active Clients Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeClients}</div>
          <p className="text-xs text-muted-foreground">
            {totalClients > 0
              ? `${((activeClients / totalClients) * 100).toFixed(1)}% of total`
              : "No clients"}
          </p>
        </CardContent>
      </Card>

      {/* Outstanding Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R{totalOutstanding.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Across {clientsWithOutstanding} client
            {clientsWithOutstanding !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Avg Payment Time Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg Payment Time
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averagePaymentTime > 0 ? `${averagePaymentTime} days` : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {averagePaymentTime > 0 && (
              <span className="text-green-600">-2 days</span>
            )}{" "}
            from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
