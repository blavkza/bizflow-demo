import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import {
  InvoicePaymentStatus,
  PaymentMethod,
  TransactionStatus,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { log } from "console";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const transactions = await db.transaction.findMany({
      orderBy: {
        date: "desc",
      },
      include: {
        category: true,
        client: true,
        department: true,
        invoice: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Account: true,
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

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

    const body = await req.json();

    if (!body.amount || !body.type || !body.description || !body.date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const amount = new Decimal(body.amount);

    const result = await db.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
        data: {
          amount,
          currency: body.currency || "ZAR",
          type: body.type,
          status: TransactionStatus.COMPLETED,
          method: body.method,
          description: body.description,
          reference: body.reference || "",
          date: new Date(body.date),
          invoiceId: body.invoiceId || null,
          categoryId: body.categoryId || null,
          clientId: body.clientId || null,
          vendor: body.vendor || null,
          createdBy: creator.id,
        },
      });

      if (body.invoiceId) {
        const invoicePayment = await db.invoicePayment.create({
          data: {
            invoiceId: body.invoiceId,
            amount,
            currency: body.currency || "ZAR",
            method: body.method || PaymentMethod.CASH,
            reference: body.reference || "",
            status: InvoicePaymentStatus.COMPLETED,
            paidAt: new Date(body.date),
          },
        });

        const upadeteInvoiceStatus = await db.invoice.update({
          where: { id: body.invoiceId },
          data: { status: "PAID" },
        });

        return { transaction, invoicePayment, upadeteInvoiceStatus };
      }

      return { transaction };
    });

    return NextResponse.json(result.transaction, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
