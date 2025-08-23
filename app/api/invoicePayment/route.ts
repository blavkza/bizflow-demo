import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      invoiceId,
      amount,
      method,
      currency = "ZAR",
      reference,
      notes,
      status = "PENDING",
      paidAt,
    } = body;

    if (!invoiceId || !amount || !method) {
      return NextResponse.json(
        { error: "Invoice ID, amount, and payment method are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot add payment to cancelled invoice" },
        { status: 400 }
      );
    }

    // Calculate total paid amount for this invoice
    const existingPayments = await db.invoicePayment.findMany({
      where: { invoiceId },
    });

    const totalPaid = existingPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    const newTotalPaid = totalPaid + amount;

    if (newTotalPaid > Number(invoice.totalAmount)) {
      return NextResponse.json(
        { error: "Payment amount exceeds invoice total" },
        { status: 400 }
      );
    }

    // Create the payment
    const payment = await db.invoicePayment.create({
      data: {
        invoiceId,
        amount,
        currency,
        method,
        reference: reference || null,
        notes: notes || null,
        status,
        paidAt: paidAt
          ? new Date(paidAt)
          : status === "COMPLETED"
            ? new Date()
            : null,
      },
      include: {
        invoice: {
          include: {
            client: true,
          },
        },
      },
    });

    await db.transaction.create({
      data: {
        amount: amount,
        currency: "ZAR",
        type: TransactionType.INCOME,
        status: TransactionStatus.COMPLETED,
        description: notes || `Payroll for ${paidAt.toLocaleDateString()}`,
        date: paidAt,
        createdBy: creater.id,
        reference: `PAYROLL-${Date.now()}`,
      },
    });

    const outStanding = payment.amount === invoice?.totalAmount;

    const newInvoiceStatus = outStanding ? "PAID" : "PARTIALLY_PAID";

    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: newInvoiceStatus },
    });

    await db.notification.create({
      data: {
        title: "Invoice Payment",
        message: `New invoice payment for client : ${invoice.client.company ? invoice.client.company : invoice.client.name} for invoice : ${invoice.invoiceNumber} has been updated By ${creater.name}.`,
        type: "PAYMENT",
        isRead: false,
        actionUrl: `/dashboard/invoices/${invoice.id}`,
        userId: creater.id,
      },
    });

    return NextResponse.json(
      {
        message: "Payment created successfully",
        payment,
        invoiceStatus: newInvoiceStatus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invoice payment:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Internal server error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
