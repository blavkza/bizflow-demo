import db from "@/lib/db";
import { projectSchema } from "@/lib/formValidationSchemas";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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
