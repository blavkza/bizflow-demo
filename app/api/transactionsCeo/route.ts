import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { TransactionStatus } from "@prisma/client";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const transactions = await db.transactionCeo.findMany({
      orderBy: { date: "desc" },
      include: {
        CategoryCeo: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
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

    const transaction = await db.transactionCeo.create({
      data: {
        amount: body.amount,
        type: body.type,
        status: TransactionStatus.COMPLETED,
        description: body.description,
        method: body.method || null,
        reference: body.reference || null,
        vendor: body.vendor || null,
        date: new Date(body.date),
        categoryCeoId: body.categoryCeoId || null,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
