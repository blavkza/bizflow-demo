import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { InvoiceStatus, DiscountType } from "@prisma/client";
import { z } from "zod";
import { InvoiceSchema } from "@/lib/formValidationSchemas";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const data = InvoiceSchema.parse(json);

    // Generate invoice number (you might want a better system for this)
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    const invoiceNumber = lastInvoice
      ? `INV-${parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1}`
      : "INV-1001";

    // Calculate amounts
    const itemsWithAmounts = data.items.map((item) => ({
      ...item,
      amount: item.quantity * item.unitPrice,
      taxAmount: item.taxRate
        ? (item.quantity * item.unitPrice * item.taxRate) / 100
        : 0,
    }));

    const subtotal = itemsWithAmounts.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalTax = itemsWithAmounts.reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0
    );

    0;

    const totalAmount = subtotal + totalTax - (data.discountAmount ?? 0);

    // Create the invoice in a transaction
    const result = await db.$transaction(async (prisma) => {
      // Create the invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          clientId: data.clientId,
          project: data.project,
          amount: subtotal,
          currency: data.currency,
          status: data.status,
          issueDate: new Date(data.issueDate),
          dueDate: new Date(data.dueDate),
          description: data.description,
          taxAmount: totalTax,
          taxRate: data.taxRate,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          totalAmount,
          paymentTerms: data.paymentTerms,
          notes: data.notes,
          createdBy: creator.id,
        },
      });

      // Create invoice items
      await prisma.invoiceItem.createMany({
        data: itemsWithAmounts.map((item) => ({
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          currency: data.currency,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
        })),
      });

      await db.notification.create({
        data: {
          title: "New Invoice Created",
          message: `Invoice ${invoiceNumber} , has been created By ${creator.name}.`,
          type: "INVOICE",
          isRead: false,
          actionUrl: `/dashboard/invoices/${invoice.id}`,
          userId: creator.id,
        },
      });

      return invoice;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[INVOICE_POST]", error);

    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 });
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all invoices where status is not CANCELLED
    const invoices = await db.invoice.findMany({
      where: {
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            description: true,
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("[INVOICES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
