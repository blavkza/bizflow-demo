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
      freelancerIds = [],
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
        freeLancerAssignees: true,
        subtask: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    if (assigneeIds.length > 0) {
      const existingEmployees = await db.employee.findMany({
        where: { id: { in: assigneeIds } },
      });

      if (existingEmployees.length !== assigneeIds.length) {
        const missingIds = assigneeIds.filter(
          (id: string) => !existingEmployees.some((emp) => emp.id === id)
        );
        return NextResponse.json(
          { error: `Employees not found: ${missingIds.join(", ")}` },
          { status: 404 }
        );
      }
    }

    if (freelancerIds.length > 0) {
      const existingFreelancers = await db.freeLancer.findMany({
        where: { id: { in: freelancerIds } },
      });

      if (existingFreelancers.length !== freelancerIds.length) {
        const missingIds = freelancerIds.filter(
          (id: string) => !existingFreelancers.some((fl) => fl.id === id)
        );
        return NextResponse.json(
          { error: `Freelancers not found: ${missingIds.join(", ")}` },
          { status: 404 }
        );
      }
    }

    const updateData: any = {
      title,
      description: description || null,
      status: status,
      priority: priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours: estimatedHours || null,
    };

    if (status === "COMPLETED" && existingTask.status !== "COMPLETED") {
      updateData.completedAt = new Date();
    } else if (status !== "COMPLETED" && existingTask.status === "COMPLETED") {
      updateData.completedAt = null;
    }

    const result = await db.$transaction(
      async (tx) => {
        const updatedTask = await tx.task.update({
          where: { id },
          data: updateData,
        });

        if (assigneeIds.length > 0 || existingTask.assignees.length > 0) {
          await tx.task.update({
            where: { id },
            data: {
              assignees: {
                set: assigneeIds.map((id: string) => ({ id })),
              },
            },
          });
        }

        if (
          freelancerIds.length > 0 ||
          existingTask.freeLancerAssignees.length > 0
        ) {
          await tx.task.update({
            where: { id },
            data: {
              freeLancerAssignees: {
                set: freelancerIds.map((id: string) => ({ id })),
              },
            },
          });
        }

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

        return updatedTask;
      },
      {
        timeout: 30000,
        maxWait: 30000,
      }
    );

    const fullUpdatedTask = await db.task.findUnique({
      where: { id },
      include: {
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        freeLancerAssignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        subtask: true,
        project: {
          select: {
            title: true,
            id: true,
          },
        },
      },
    });

    if (fullUpdatedTask) {
      await db.notification.create({
        data: {
          title: "Task Updated",
          message: `Task "${fullUpdatedTask.title}" has been updated by ${updater.name}.`,
          type: "PROJECT",
          isRead: false,
          actionUrl: `/dashboard/projects/${fullUpdatedTask.projectId}/tasks/${fullUpdatedTask.id}`,
          userId: updater.id,
        },
      });
    }

    return NextResponse.json(fullUpdatedTask);
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
        freeLancerAssignees: {
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
