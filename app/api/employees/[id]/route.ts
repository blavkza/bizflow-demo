import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      position,
      phone,
      departmentId,
      salary,
      status,
      hireDate,
      address,
    } = body;

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

    const updatedEmployee = await db.employee.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        position,
        phone,
        departmentId,
        salary,
        status,
        hireDate,
        address,
      },
    });

    return NextResponse.json({ updatedEmployee });
  } catch (error) {
    console.error("Error updating Employee:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    await db.employee.delete({
      where: { id },
    });

    return NextResponse.json({ message: "employee deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
