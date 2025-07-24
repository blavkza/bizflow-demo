import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const clients = await db.client.findMany({
      include: {
        invoices: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            issueDate: true,
            payments: {
              select: {
                id: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert to proper types with date handling
    const sanitizedClients = clients.map((client) => ({
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      invoices: client.invoices?.map((invoice) => ({
        ...invoice,
        issueDate: invoice.issueDate.toISOString(),
        totalAmount: Number(invoice.totalAmount),
        payments: invoice.payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount),
          paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
        })),
      })),
    }));

    return NextResponse.json(sanitizedClients);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch clients", error },
      { status: 500 }
    );
  }
}
