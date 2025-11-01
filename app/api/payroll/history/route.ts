import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payrolls = await db.payroll.findMany({
      include: {
        transaction: {
          select: {
            id: true,
            reference: true,
            date: true,
            description: true,
          },
        },
        payments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                department: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(payrolls);
  } catch (error) {
    console.error("Failed to fetch payroll history:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll history" },
      { status: 500 }
    );
  }
}
