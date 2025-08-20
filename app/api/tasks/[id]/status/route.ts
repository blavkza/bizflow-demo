import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;
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

    const updatedTask = await db.task.update({
      where: { id },
      data: { status },
    });

    const projectTasks = await db.task.findMany({
      where: { projectId: updatedTask.projectId },
    });

    const allTasksCompleted = projectTasks.every(
      (task) => task.status === "COMPLETED"
    );

    const updatedProject = await db.project.update({
      where: { id: updatedTask.projectId },
      data: {
        status: allTasksCompleted ? "COMPLETED" : "ACTIVE",
      },
    });

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

    return NextResponse.json({
      task: updatedTask,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  try {
    await db.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting Task:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
