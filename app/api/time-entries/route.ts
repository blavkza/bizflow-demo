import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

export async function POST(req: Request) {
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

    const body = await req.json();
    const { taskId, projectId, timeIn, timeOut, hours, description, date } =
      body;

    const timeEntry = await db.timeEntry.create({
      data: {
        taskId,
        projectId,
        timeIn: new Date(timeIn),
        timeOut: timeOut ? new Date(timeOut) : null,
        hours,
        description,
        date: new Date(date),
        userId: user.id,
      },
    });

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error("[TIME_ENTRY_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create time entry" },
      { status: 500 }
    );
  }
}
