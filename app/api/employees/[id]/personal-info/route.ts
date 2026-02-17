import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { sendPushNotification } from "@/lib/expo"; // Assuming this is imported correctly

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

    // 1. Update Employee
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

    // 2. Notify Admin/Updater (System Notification)
    await db.notification.create({
      data: {
        title: "Employee Personal-Info Updated",
        message: `Employee ${updatedEmployee.lastName} ${updatedEmployee.firstName}, Personal Information have been Updated By ${updater.name}.`,
        type: "EMPLOYEE",
        isRead: false,
        actionUrl: `/dashboard/human-resources/employees/${updatedEmployee.id}`,
        userId: updater.id,
      },
    });

    // 3. Notify Employee (Database Record)
    const employeeMessage = `Your profile personal info have been updated by ${updater.name}. Please verify your information.`;

    await db.employeeNotification.create({
      data: {
        employeeId: updatedEmployee.id,
        title: "Profile Updated",
        message: employeeMessage,
        type: "EMPLOYEE",
        isRead: false,
        actionUrl: "/dashboard/profile",
      },
    });

    await sendPushNotification({
      employeeId: updatedEmployee.id,
      title: "Profile Updated",
      body: employeeMessage,
      data: {
        url: `/dashboard/profile`,
      },
    });

    console.log(
      `Push notification sent for employee profile update: ${updatedEmployee.id}`,
    );
    // ---------------------------------------------------------

    return NextResponse.json({ updatedEmployee });
  } catch (error) {
    console.error("Error updating Employee personal info:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
