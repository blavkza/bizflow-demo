import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employees = await db.employee.findMany({
      where: {
        status: "ACTIVE",
        user: null,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    // Return the raw employee data with department relation
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
