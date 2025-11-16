import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { ProjectStatus, TaskStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const { status, title, description, estimatedHours } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }
    if (title !== undefined) {
      updateData.title = title;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (estimatedHours !== undefined) {
      updateData.estimatedHours = estimatedHours;
    }

    const subtask = await db.subtask.update({
      where: { id },
      data: updateData,
      include: {
        task: {
          include: {
            subtask: true,
            project: true,
          },
        },
      },
    });

    const parentTask = subtask.task;
    const allSubtasks = parentTask.subtask;

    const allSubtasksCompleted = allSubtasks.every(
      (st) => st.status === TaskStatus.COMPLETED
    );

    let parentTaskUpdateData: any = {};

    if (allSubtasksCompleted && parentTask.status !== TaskStatus.COMPLETED) {
      parentTaskUpdateData.status = TaskStatus.COMPLETED;
      parentTaskUpdateData.completedAt = new Date();
    } else if (
      !allSubtasksCompleted &&
      parentTask.status === TaskStatus.COMPLETED
    ) {
      parentTaskUpdateData.status = TaskStatus.IN_PROGRESS;
      parentTaskUpdateData.completedAt = null;
    }

    if (Object.keys(parentTaskUpdateData).length > 0) {
      await db.task.update({
        where: { id: parentTask.id },
        data: parentTaskUpdateData,
      });
    }

    if (allSubtasksCompleted) {
      const projectTasks = await db.task.findMany({
        where: { projectId: parentTask.projectId },
      });

      const allTasksCompleted = projectTasks.every(
        (task) => task.status === TaskStatus.COMPLETED
      );

      if (allTasksCompleted) {
        await db.project.update({
          where: { id: parentTask.projectId },
          data: {
            status: ProjectStatus.COMPLETED,
          },
        });
      }
    }

    return NextResponse.json(subtask);
  } catch (error) {
    console.error("[SUBTASK_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.subtask.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Subtask deleted successfully" });
  } catch (error) {
    console.error("[SUBTASK_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete subtask" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const subtask = await db.subtask.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    return NextResponse.json(subtask);
  } catch (error) {
    console.error("[SUBTASK_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch subtask" },
      { status: 500 }
    );
  }
}
