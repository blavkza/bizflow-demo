import { NextResponse, type NextRequest } from "next/server";
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
      idNumber,
      taxNumber,
      nationality,
      maritalStatus,
      bankName,
      accountNumber,
      branchCode,
      accountType,
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
        idNumber,
        taxNumber,
        nationality,
        maritalStatus,
        bankName,
        accountNumber,
        branchCode,
        accountType,
      },
    });

    const notification = await db.notification.create({
      data: {
        title: "Employee Personal-Infor Updated",
        message: `Employee ${updatedEmployee.lastName} ${updatedEmployee.firstName} , Personal Information have been Updated By ${updater.name}.`,
        type: "EMPLOYEE",
        isRead: false,
        actionUrl: `/dashboard/human-resources/employees/${updatedEmployee.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json({ updatedEmployee });
  } catch (error) {
    console.error("Error updating Employee personal info:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
