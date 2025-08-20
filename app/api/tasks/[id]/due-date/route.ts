import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { dueDate } = body;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: { dueDate: new Date(dueDate) },
    });

    await db.notification.create({
      data: {
        title: "Due Date Updated",
        message: `Task "${updatedTask.title}" due date changed to ${new Date(dueDate).toLocaleDateString()}`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/tasks/${id}`,
        userId: user.id,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating due date:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
