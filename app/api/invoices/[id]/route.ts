import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        items: true,
        creator: {
          select: {
            GeneralSetting: true,
            name: true,
          },
        },
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!updater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    await db.notification.create({
      data: {
        title: "Invoice Updated",
        message: `Invoice ${updatedInvoice.invoiceNumber} , has been Updated By ${updater.name}.`,
        type: "INVOICE",
        isRead: false,
        actionUrl: `/dashboard/invoices/${updatedInvoice.id}`,
        userId: updater.id,
      },
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
    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return new NextResponse("Invoice Not Found", { status: 401 });
    }

    await db.invoiceItem.deleteMany({
      where: { invoiceId: params.id },
    });

    // Then delete the invoice
    const deletedInvoice = await db.invoice.delete({
      where: { id: params.id },
    });

    await db.notification.create({
      data: {
        title: "Invoice Deleted",
        message: `Invoice ${invoice?.invoiceNumber} , has been deleted By ${creator.name}.`,
        type: "INVOICE",
        isRead: false,
        userId: creator.id,
      },
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
