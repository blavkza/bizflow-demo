import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NotificationType } from "@prisma/client";
import { sendPushNotification } from "@/lib/expo";

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
      include: {
        assignees: true,
      },
    });

    await db.notification.create({
      data: {
        title: "Due Date Updated",
        message: `Task "${updatedTask.title}" due date changed to ${new Date(
          dueDate
        ).toLocaleDateString()}`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/tasks/${id}`,
        userId: user.id,
      },
    });

    if (updatedTask.assignees && updatedTask.assignees.length > 0) {
      const formattedDate = new Date(dueDate).toLocaleDateString();
      const messageBody = `The due date for task "${updatedTask.title}" has been updated to ${formattedDate} by ${user.name}.`;

      const employeeNotifications = updatedTask.assignees.map((employee) => ({
        employeeId: employee.id,
        title: "Task Due Date Changed",
        message: messageBody,
        type: NotificationType.Task,
        isRead: false,
        actionUrl: `/dashboard/projects/${updatedTask.projectId}/tasks/${id}`,
      }));

      const pushPromises = updatedTask.assignees.map((employee) =>
        sendPushNotification({
          employeeId: employee.id,
          title: "Task Due Date Changed",
          body: messageBody,
          data: {
            taskId: updatedTask.id,
            url: `/dashboard/projects/${updatedTask.projectId}/tasks/${id}`,
          },
        })
      );

      await Promise.all(pushPromises);

      await db.employeeNotification.createMany({
        data: employeeNotifications,
      });

      console.log(
        `Due date update: Notifications sent to ${updatedTask.assignees.length} employees.`
      );
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating due date:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
