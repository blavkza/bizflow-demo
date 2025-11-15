import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      estimatedHours,
      assigneeIds = [],
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const existingTask = await db.task.findFirst({
      where: {
        id,
      },
      include: {
        assignees: true,
        subtask: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    const updateData: any = {
      title,
      description: description,
      status: status,
      priority: priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours: estimatedHours || null,
      assignees: {
        set: assigneeIds.map((id: string) => ({ id })),
      },
    };

    if (status === "COMPLETED" && existingTask.status !== "COMPLETED") {
      updateData.completedAt = new Date();
    } else if (status !== "COMPLETED" && existingTask.status === "COMPLETED") {
      updateData.completedAt = null;
    }

    const result = await db.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: updateData,
        include: {
          assignees: true,
          subtask: true,
        },
      });

      if (
        status === "COMPLETED" &&
        existingTask.status !== "COMPLETED" &&
        existingTask.subtask.length > 0
      ) {
        await tx.subtask.updateMany({
          where: {
            taskId: id,
            status: {
              not: "COMPLETED",
            },
          },
          data: {
            status: "COMPLETED",
          },
        });
      }

      await db.notification.create({
        data: {
          title: "Task Updated",
          message: `Task ${updatedTask.title} has been updated by ${updater.name}.`,
          type: "PROJECT",
          isRead: false,
          actionUrl: `/dashboard/projects/${updatedTask.projectId}`,
          userId: updater.id,
        },
      });

      return updatedTask;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[TASK_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = await db.task.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          managerId: true,
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  try {
    await db.task.delete({
      where: { id },
    });

    await db.notification.create({
      data: {
        title: "Task Deleted",
        message: `Task "${task.title}" from project "${task.project.title}" has been deleted by ${user.name}.`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects/${task.project.id}`,
        userId: user.id,
      },
    });

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
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

    const user = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const task = await db.task.findUnique({
      where: {
        id,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        assignees: {
          select: {
            firstName: true,
            lastName: true,
            id: true,
            position: true,
            avatar: true,
          },
        },
        subtask: {
          orderBy: {
            order: "asc",
          },
        },
        comment: {
          include: {
            commentReply: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        documents: true,
        timeEntries: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
