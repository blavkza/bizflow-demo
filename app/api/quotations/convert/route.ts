import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { quotationId } = await request.json();

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const quotation = await db.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true, client: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Generate invoice number
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    const invoiceNumber = lastInvoice
      ? `INV-${parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1}`
      : "INV-1001";

    const amount = Number(quotation.amount);
    const taxAmount = Number(quotation.taxAmount);
    const totalAmount = Number(quotation.totalAmount);
    const discountAmount = Number(quotation.discountAmount || 0);

    // Create the invoice with required createdBy field
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        clientId: quotation.clientId,
        amount,
        currency: quotation.currency || "ZAR",
        status: "PAID",
        issueDate: new Date(),
        dueDate: new Date(quotation.validUntil),
        description: quotation.description || undefined,
        taxAmount,
        taxRate: quotation.taxRate || 0,
        discountAmount,
        discountType: quotation.discountType || undefined,
        totalAmount,
        paymentTerms: quotation.paymentTerms || undefined,
        notes: quotation.notes || undefined,
        createdBy: creator.id,
      },
    });

    // Create invoice items
    await db.invoiceItem.createMany({
      data: quotation.items.map((item) => ({
        invoiceId: invoice.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
        currency: quotation.currency || "USD",
        taxRate: Number(item.taxRate),
        taxAmount: Number(item.taxAmount),
      })),
    });

    // Update quotation status
    await db.quotation.update({
      where: { id: quotationId },
      data: {
        status: "CONVERTED",
        acceptedDate: new Date(),
        convertedToInvoice: true,
        invoiceId: invoice.id,
      },
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Failed to convert quotation" },
      { status: 500 }
    );
  }
}
