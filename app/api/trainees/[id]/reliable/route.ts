import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
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

    const body = await req.json();
    const { reliable } = body;

    // Validate the input
    if (typeof reliable !== "boolean") {
      return NextResponse.json(
        { error: "Reliable status must be a boolean" },
        { status: 400 },
      );
    }

    const trainee = await db.trainee.update({
      where: { id },
      data: {
        reliable,
      },
    });

    await db.notification.create({
      data: {
        title: "Trainee Reliable",
        message: `Trainee ${trainee.firstName} ${trainee.lastName} reliable status has been updated by ${updater.name}.`,
        type: "TRAINEE",
        isRead: false,
        actionUrl: `/dashboard/human-resources/trainees/${trainee.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json(trainee);
  } catch (error) {
    console.error("Error updating trainee reliability:", error);
    return NextResponse.json(
      { error: "Failed to update reliability status" },
      { status: 500 },
    );
  }
}
