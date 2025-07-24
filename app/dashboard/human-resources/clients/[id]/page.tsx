import { Button } from "@/components/ui/button";
import Link from "next/link";
import Header from "./_components/header";
import StatsCard from "./_components/stats-card";
import TabsSection from "./_components/tabs";
import { ArrowLeft } from "lucide-react";
import db from "@/lib/db";
import { Client } from "@prisma/client";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const client = await db.client.findUnique({
    where: {
      id,
    },
    include: {
      invoices: {
        select: {
          totalAmount: true,
          status: true,
          issueDate: true,
          payments: {
            select: {
              amount: true,
              paidAt: true,
            },
          },
        },
        where: {
          status: {
            not: "DRAFT",
          },
        },
      },
    },
  });

  if (!client) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        No client found
      </div>
    );
  }

  // Convert Decimal values to number before passing to components
  const sanitizedClient = {
    ...client,
    invoices: client.invoices?.map((invoice) => ({
      ...invoice,
      totalAmount: Number(invoice.totalAmount),
      payments: invoice.payments?.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    })),
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" className="bg-white" size="sm" asChild>
          <Link href="/dashboard/human-resources/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Client Header */}
      <Header client={sanitizedClient} />

      {/* Key Metrics */}
      <StatsCard client={sanitizedClient} />

      {/* Tabs */}
      <TabsSection client={sanitizedClient} />
    </div>
  );
}
