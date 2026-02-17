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

    const trainer = await db.trainer.update({
      where: { id },
      data: {
        reliable,
      },
    });

    await db.notification.create({
      data: {
        title: "Trainer Reliable",
        message: `Trainer ${trainer.firstName} ${trainer.lastName} reliable status has been updated by ${updater.name}.`,
        type: "TRAINER",
        isRead: false,
        actionUrl: `/dashboard/human-resources/trainers/${trainer.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json(trainer);
  } catch (error) {
    console.error("Error updating trainer reliability:", error);
    return NextResponse.json(
      { error: "Failed to update reliability status" },
      { status: 500 },
    );
  }
}
