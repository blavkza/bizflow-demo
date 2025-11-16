import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { timeOut, hours } = body;

    // Verify the time entry belongs to the user
    const timeEntry = await db.timeEntry.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    const updatedTimeEntry = await db.timeEntry.update({
      where: { id },
      data: {
        timeOut: timeOut ? new Date(timeOut) : null,
        hours: hours,
      },
    });

    return NextResponse.json(updatedTimeEntry);
  } catch (error) {
    console.error("[TIME_ENTRY_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update time entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const timeEntry = await db.timeEntry.findFirst({
      where: { id },
      include: { user: true },
    });

    if (!timeEntry || timeEntry.user.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.timeEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TIME_ENTRY_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 }
    );
  }
}
