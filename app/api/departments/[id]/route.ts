import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const department = await db.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        employees: {
          select: {
            id: true,
            avatar: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            dailySalary: true,
            monthlySalary: true,
            salaryType: true,
            hireDate: true,
          },
        },
        freelancers: {
          select: {
            id: true,
            avatar: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            salary: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ department });
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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
    const { name, description, managerId, location, floor, building } = body;

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

    const updatedDepartment = await db.department.update({
      where: { id },
      data: {
        name,
        description,
        managerId,
        location,
        floor,
        building,
        updater: updater.name,
      },
    });

    await db.notification.create({
      data: {
        title: "Department Updated",
        message: `DEPARTMENT ${updatedDepartment.name} , has been Updated By ${updater.name}.`,
        type: "DEPARTMENT",
        isRead: false,
        actionUrl: `/dashboard/human-resources/departments/${updatedDepartment.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json({ updatedDepartment });
  } catch (error) {
    console.error("Error updating department:", error);
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
    await db.client.delete({
      where: { id },
    });

    return NextResponse.json({ message: "client deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting Client:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
