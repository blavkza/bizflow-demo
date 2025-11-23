import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { sendPushNotification } from "@/lib/expo";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

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

    const {
      medicalCondition,
      allergies,
      restrictions,
      firstAidNeeds,
      riskLevel,
      additionalInfo,
      emergencyContacts,
    } = body;

    const updatedEmployee = await db.employee.update({
      where: { id },
      data: {
        medicalCondition,
        allergies,
        restrictions,
        firstAidNeeds,
        riskLevel,
        additionalInfo,
        emergencyContacts,
      },
    });

    await db.notification.create({
      data: {
        title: "Employee Contat-Info Updated",
        message: `Employee ${updatedEmployee.lastName} ${updatedEmployee.firstName} , Contact Information have been Updated By ${updater.name}.`,
        type: "EMPLOYEE",
        isRead: false,
        actionUrl: `/dashboard/human-resources/employees/${updatedEmployee.id}`,
        userId: updater.id,
      },
    });

    const employeeMessage = `Your profile health-safety info have been updated by ${updater.name}. Please verify your information.`;

    await db.employeeNotification.create({
      data: {
        employeeId: updatedEmployee.id,
        title: "Profile Updated",
        message: employeeMessage,
        type: "EMPLOYEE",
        isRead: false,
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

    return NextResponse.json({ employee: updatedEmployee });
  } catch (error) {
    console.error("Error updating health & safety information:", error);
    return NextResponse.json(
      { error: "Failed to update health & safety information" },
      { status: 500 }
    );
  }
}
