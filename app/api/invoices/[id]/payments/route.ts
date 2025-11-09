import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const paymentSchema = z.object({
  amount: z.number().min(0.01),
  method: z.enum([
    "CASH",
    "BANK_TRANSFER",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "MOBILE_PAYMENT",
    "INVOICE",
  ]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().min(1, "Payment date is required"),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const data = paymentSchema.parse(json);

    // Get the invoice to check total amount
    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        payments: true,
        client: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Calculate total paid so far
    const totalPaid = invoice.payments.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0);

    const remainingBalance = Number(invoice.totalAmount) - totalPaid;

    if (data.amount > remainingBalance) {
      return NextResponse.json(
        { error: "Payment amount exceeds remaining balance" },
        { status: 400 }
      );
    }

    // Find or create INVOICE_PAYMENT category
    let paymentCategory = await db.category.findFirst({
      where: {
        name: "INVOICE_PAYMENT",
        type: "INCOME",
      },
    });

    if (!paymentCategory) {
      paymentCategory = await db.category.create({
        data: {
          name: "INVOICE_PAYMENT",
          description: "Payments received from invoices",
          type: "INCOME",
          createdBy: creator.name,
        },
      });
    }

    const payment = await db.invoicePayment.create({
      data: {
        invoiceId: params.id,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        paidAt: new Date(data.paidAt),
        status: "COMPLETED",
      },
    });

    const transaction = await db.transaction.create({
      data: {
        amount: data.amount,
        currency: "ZAR",
        type: "INCOME",
        status: "COMPLETED",
        description: `Payment for invoice ${invoice.invoiceNumber} from ${invoice.client.name}`,
        reference: data.reference || payment.id,
        date: new Date(data.paidAt),
        method: data.method,
        invoiceId: params.id,
        clientId: invoice.clientId,
        categoryId: paymentCategory.id,
        createdBy: creator.id,
        taxAmount: 0,
        netAmount: data.amount,
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    // Update invoice status if fully paid
    const newTotalPaid = totalPaid + data.amount;
    if (Math.abs(newTotalPaid - Number(invoice.totalAmount)) < 0.01) {
      // Using tolerance for floating point comparison
      await db.invoice.update({
        where: { id: params.id },
        data: { status: "PAID" },
      });
    } else if (newTotalPaid > 0) {
      await db.invoice.update({
        where: { id: params.id },
        data: { status: "PARTIALLY_PAID" },
      });
    }

    // Create notification
    await db.notification.create({
      data: {
        title: "Payment Received",
        message: `Payment of ${formatCurrency(data.amount)} received for invoice ${invoice.invoiceNumber}`,
        type: "PAYMENT",
        isRead: false,
        actionUrl: `/dashboard/invoices/${params.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json(
      {
        payment,
        transaction,
        remainingBalance: remainingBalance - data.amount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
}
