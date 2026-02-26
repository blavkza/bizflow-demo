import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trainee = await db.trainee.findUnique({
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
      },
    });

    if (!trainee) {
      return NextResponse.json({ error: "Trainee not found" }, { status: 404 });
    }

    return NextResponse.json(trainee);
  } catch (error) {
    console.error("Error fetching Trainee:", error);
    return NextResponse.json(
      { error: "Failed to fetch Trainee" },
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
      salary,
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
      reliable,
      scheduledWeekendKnockOut,
      scheduledWeekendKnockIn,
      terminationDate,
      overtimeHourRate,
      emergencyCallOutRate,
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

    const updatedTrainee = await db.trainee.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: email && email.trim() !== "" ? email.trim() : null,
        position,
        phone,
        departmentId,
        salary,
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
        reliable,
        scheduledWeekendKnockOut,
        scheduledWeekendKnockIn,
        terminationDate,
        overtimeHourRate: overtimeHourRate || 0,
        emergencyCallOutRate: emergencyCallOutRate || 0,
        generalSettingId: campany?.id,
      },
    });

    await db.notification.create({
      data: {
        title: "Trainee Updated",
        message: `Trainee ${updatedTrainee.lastName} ${updatedTrainee.firstName} , have been Updated By ${updater.name}.`,
        type: "TRAINEE",
        isRead: false,
        actionUrl: `/dashboard/human-resources/trainees/${updatedTrainee.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json({ updatedTrainee });
  } catch (error) {
    console.error("Error updating Trainee:", error);
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

    const trainee = await db.trainee.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!trainee) {
      return NextResponse.json({ error: "Trainee not found" }, { status: 404 });
    }

    await db.trainee.delete({
      where: { id },
    });

    await db.notification.create({
      data: {
        title: "Trainee Deleted",
        message: `Trainee ${trainee.firstName} ${trainee.lastName} has been deleted by ${updater.name}.`,
        type: "TRAINEE",
        isRead: false,
        actionUrl: `/dashboard/human-resources/trainees`,
        userId: updater.id,
      },
    });

    return NextResponse.json(
      { message: "Trainee deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting Trainee:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
