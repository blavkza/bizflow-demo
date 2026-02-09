import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            manager: {
              select: {
                name: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            payDate: true,
            type: true,
            status: true,
            description: true,
          },
          orderBy: {
            payDate: "desc",
          },
        },
        documents: {
          select: {
            id: true,
            name: true,
            originalName: true,
            type: true,
            url: true,
            size: true,
            mimeType: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
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
      salaryType,
      dailySalary,
      monthlySalary,
      status,
      hireDate,
      address,
      city,
      province,
      postalCode,
      country,
      scheduledKnockIn,
      scheduledKnockOut,
      overtimeHourRate,
      workingDays,
      scheduledWeekendKnockOut,
      scheduledWeekendKnockIn,
      terminationDate,
      contractType,
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

    const campany = await db.generalSetting.findFirst();

    const updatedEmployee = await db.employee.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: email && email.trim() !== "" ? email.trim() : null,
        position,
        phone,
        departmentId,
        salaryType,
        dailySalary: dailySalary || 0,
        monthlySalary: monthlySalary || 0,
        overtimeHourRate: overtimeHourRate || 0,
        status,
        hireDate,
        address,
        city,
        province,
        postalCode,
        country,
        scheduledKnockIn,
        scheduledKnockOut,
        workingDays,
        scheduledWeekendKnockOut,
        scheduledWeekendKnockIn,
        terminationDate,
        contractType,
        generalSettingId: campany?.id,
      },
    });

    await db.notification.create({
      data: {
        title: "Employee Updated",
        message: `Employee ${updatedEmployee.lastName} ${updatedEmployee.firstName} , have been Updated By ${updater.name}.`,
        type: "EMPLOYEE",
        isRead: false,
        actionUrl: `/dashboard/human-resources/employees/${updatedEmployee.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json({ updatedEmployee });
  } catch (error) {
    console.error("Error updating Employee:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
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

    const employee = await db.employee.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    await db.employee.delete({
      where: { id },
    });

    await db.notification.create({
      data: {
        title: "Employee Deleted",
        message: `Employee ${employee.firstName} ${employee.lastName} has been deleted by ${updater.name}.`,
        type: "EMPLOYEE",
        isRead: false,
        actionUrl: `/dashboard/human-resources/employees`,
        userId: updater.id,
      },
    });

    return NextResponse.json(
      { message: "Employee deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
