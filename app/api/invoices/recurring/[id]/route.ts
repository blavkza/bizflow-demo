import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const recurringInvoice = await db.recurringInvoice.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            taxNumber: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            issueDate: true,
            dueDate: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            issueDate: "desc",
          },
        },
      },
    });

    if (!recurringInvoice) {
      return new NextResponse("Recurring invoice not found", { status: 404 });
    }

    return NextResponse.json(recurringInvoice);
  } catch (error) {
    console.error("[RECURRING_INVOICE_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { status } = await req.json();

    const recurringInvoice = await db.recurringInvoice.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(recurringInvoice);
  } catch (error) {
    console.error("[RECURRING_INVOICE_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
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

    await db.recurringInvoice.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[RECURRING_INVOICE_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
