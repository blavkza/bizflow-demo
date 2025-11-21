import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    const { subtaskId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // First, get the subtask with its parent task information
    const subtaskWithTask = await db.subtask.findUnique({
      where: { id: subtaskId },
      include: {
        task: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!subtaskWithTask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Update the subtask
    const updatedSubtask = await db.subtask.update({
      where: { id: subtaskId },
      data: { status },
    });

    if (subtaskWithTask.task.status === "TODO") {
      await db.task.update({
        where: { id: subtaskWithTask.task.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json(updatedSubtask);
  } catch (error) {
    console.error("Error updating subtask:", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 }
    );
  }
}
