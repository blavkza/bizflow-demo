import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const departments = await db.department.findMany({
      include: {
        manager: true,
        employees: {
          select: {
            id: true,
          },
        },
        budgets: {
          select: {
            totalAmount: true,
          },
        },
      },
    });

    const serializedDepartments = departments.map((dept) => ({
      ...dept,
      budgets: dept.budgets.map((budget) => ({
        totalAmount: budget.totalAmount.toNumber(),
      })),
    }));

    return NextResponse.json(serializedDepartments);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch departments", error },
      { status: 500 }
    );
  }
}
