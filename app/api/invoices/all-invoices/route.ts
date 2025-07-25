import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const invoices = await db.invoice.findMany({
      include: {
        client: {
          select: {
            name: true,
          },
        },
        items: true,
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Prepare the data exactly as it was in the page component
    const responseData = {
      rawInvoices: invoices,
      statsData: {
        totalOutstanding: invoices
          .filter((inv) => inv.status !== "PAID")
          .reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0),
        pendingInvoices: invoices.filter((inv) => inv.status !== "PAID").length,
        paidThisMonth: invoices
          .filter((inv) => inv.status === "PAID")
          .reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0),
        paidInvoices: invoices.filter((inv) => inv.status === "PAID").length,
        overdueAmount: invoices
          .filter((inv) => inv.status === "OVERDUE")
          .reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0),
        overdueInvoices: invoices.filter((inv) => inv.status === "OVERDUE")
          .length,
        averageInvoice:
          invoices.length > 0
            ? invoices.reduce(
                (sum, inv) => sum + inv.totalAmount.toNumber(),
                0
              ) / invoices.length
            : 0,
        totalInvoices: invoices.length,
      },
      tableData: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        client: invoice.client.name,
        description: invoice.description || "",
        issueDate: invoice.issueDate.toLocaleDateString(),
        dueDate: invoice.dueDate.toLocaleDateString(),
        amount: invoice.totalAmount.toNumber(),
        status: invoice.status,
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch invoices", error },
      { status: 500 }
    );
  }
}
