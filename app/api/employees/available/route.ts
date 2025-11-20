import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeCurrent = searchParams.get("includeCurrent") === "true";
    const currentEmployeeId = searchParams.get("currentEmployeeId");

    let whereClause: any = {
      status: "ACTIVE",
    };

    if (!includeCurrent) {
      whereClause.user = null;
    }

    const employees = await db.employee.findMany({
      where: whereClause,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    const availableEmployees = employees.map((employee) => ({
      id: employee.id,
      employeeNumber: employee.employeeNumber,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      status: employee.status,
      avatar: employee.avatar,
      isLinked: employee.user !== null,
    }));

    return NextResponse.json(availableEmployees);
  } catch (error) {
    console.error("[AVAILABLE_EMPLOYEES_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
