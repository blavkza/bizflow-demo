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

    const trainer = await db.trainer.findUnique({
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

    if (!trainer) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }

    return NextResponse.json(trainer);
  } catch (error) {
    console.error("Error fetching Trainer:", error);
    return NextResponse.json(
      { error: "Failed to fetch Trainer" },
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

    const updatedTrainer = await db.trainer.update({
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
        generalSettingId: campany?.id,
      },
    });

    await db.notification.create({
      data: {
        title: "Trainer Updated",
        message: `Trainer ${updatedTrainer.lastName} ${updatedTrainer.firstName} , have been Updated By ${updater.name}.`,
        type: "TRAINER",
        isRead: false,
        actionUrl: `/dashboard/human-resources/trainers/${updatedTrainer.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json({ updatedTrainer });
  } catch (error) {
    console.error("Error updating Trainer:", error);
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

    const trainer = await db.trainer.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!trainer) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }

    await db.trainer.delete({
      where: { id },
    });

    await db.notification.create({
      data: {
        title: "Trainer Deleted",
        message: `Trainer ${trainer.firstName} ${trainer.lastName} has been deleted by ${updater.name}.`,
        type: "TRAINER",
        isRead: false,
        actionUrl: `/dashboard/human-resources/trainers`,
        userId: updater.id,
      },
    });

    return NextResponse.json(
      { message: "Trainer deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting Trainer:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
