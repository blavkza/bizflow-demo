import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      taskId,
      projectId,
      timeIn,
      timeOut,
      hours,
      description,
      date,
      images,
      userId,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { id: true, status: true, title: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const result = await db.$transaction(async (tx) => {
      const timeEntry = await tx.timeEntry.create({
        data: {
          taskId,
          projectId,
          timeIn: new Date(timeIn),
          timeOut: timeOut ? new Date(timeOut) : null,
          hours,
          description,
          date: new Date(date),
          userId: user.id,
          images: images || [],
        },
      });

      let taskUpdated = false;

      if (task.status === "TODO") {
        await tx.task.update({
          where: { id: taskId },
          data: { status: "IN_PROGRESS" },
        });
        taskUpdated = true;
      }

      return { timeEntry, taskUpdated };
    });

    return NextResponse.json(result.timeEntry);
  } catch (error) {
    console.error("[TIME_ENTRY_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create time entry" },
      { status: 500 }
    );
  }
}
