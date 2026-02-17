import db from "@/lib/db";
import MaintenanceClient from "./_components/maintenance-client";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const maintenance = await db.maintenance.findMany({
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      invoice: true,
      recurringInvoice: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  const clients = await db.client.findMany({
    select: {
      id: true,
      name: true,
      company: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const invoices = await db.invoice.findMany({
    select: {
      id: true,
      invoiceNumber: true,
      clientId: true,
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  const recurringInvoices = await db.recurringInvoice.findMany({
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <MaintenanceClient
        initialMaintenances={maintenance as any}
        clients={clients}
        invoices={invoices}
        recurringInvoices={recurringInvoices as any}
      />
    </div>
  );
}
