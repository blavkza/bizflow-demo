import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { TaskStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, estimatedHours, status, taskId } = body;

    if (!title || !taskId) {
      return NextResponse.json(
        { error: "Title and taskId are required" },
        { status: 400 }
      );
    }

    const maxOrder = await db.subtask.aggregate({
      where: { taskId },
      _max: { order: true },
    });

    const nextOrder = (maxOrder._max.order || 0) + 1;

    const subtask = await db.subtask.create({
      data: {
        title,
        description: description || null,
        estimatedHours: estimatedHours || null,
        status: status || TaskStatus.TODO,
        order: nextOrder,
        taskId,
      },
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    console.error("[SUBTASK_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
      { status: 500 }
    );
  }
}
