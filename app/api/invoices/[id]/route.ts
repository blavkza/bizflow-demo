import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { items, ...invoiceData } = body;

    // Update invoice
    const updatedInvoice = await db.invoice.update({
      where: { id: params.id },
      data: {
        ...invoiceData,
        issueDate: new Date(invoiceData.issueDate),
        dueDate: new Date(invoiceData.dueDate),
      },
    });

    // Delete existing items
    await db.invoiceItem.deleteMany({
      where: { invoiceId: params.id },
    });

    // Create new items
    const createdItems = await db.invoiceItem.createMany({
      data: items.map((item: any) => ({
        ...item,
        invoiceId: params.id,
      })),
    });

    return NextResponse.json({
      ...updatedInvoice,
      items: createdItems,
    });
  } catch (error) {
    console.error("Invoice update error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First delete all related invoice items
    await db.invoiceItem.deleteMany({
      where: { invoiceId: params.id },
    });

    // Then delete the invoice
    const deletedInvoice = await db.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json(deletedInvoice);
  } catch (error) {
    console.error("Invoice deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
