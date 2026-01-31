import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    if (!month) {
      return NextResponse.json(
        { error: "Month parameter is required" },
        { status: 400 }
      );
    }

    const draft = await db.payroll.findFirst({
      where: {
        month: month,
        status: "DRAFT",
      },
      include: {
        transaction: {
          select: {
            id: true,
            reference: true,
            date: true,
            description: true,
            amount: true,
            currency: true,
          },
        },
        payments: {
          include: {
            paymentBonuses: true,
            paymentDeductions: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                department: { select: { name: true } }
              }
            },
            freeLancer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                department: { select: { name: true } }
              }
            }
          },
        },
      },
    });

    return NextResponse.json(draft || null);
  } catch (error) {
    console.error("Failed to fetch payroll draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll draft" },
      { status: 500 }
    );
  }
}
