import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const body = await req.json();
    const {
      email,
      phone,
      address,
      city,
      province,
      postalCode,
      country,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      emergencyAddress,
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
        email,
        phone,
        address,
        city,
        province,
        postalCode,
        country,
        emergencyName,
        emergencyPhone,
        emergencyRelation,
        emergencyAddress,
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

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating Employee contact info:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
