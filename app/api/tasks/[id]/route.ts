import db from "@/lib/db";
import { projectSchema } from "@/lib/formValidationSchemas";
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

    const { id } = await params;
    const body = await req.json();

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      estimatedHours,
      assignees,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const existingTask = await db.task.findFirst({
      where: {
        id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: {
        title,
        description: description,
        status: status,
        priority: priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours || null,
        assignees: {
          connect:
            assignees?.map((employeeId: string) => ({ id: employeeId })) || [],
        },
      },
    });

    return NextResponse.json(updatedTask);
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
        Subtask: {
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
