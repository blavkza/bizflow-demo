import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const invoices = await db.invoice.findMany({
      include: {
        client: true,
        items: true,
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch invoices", error },
      { status: 500 }
    );
  }
}
