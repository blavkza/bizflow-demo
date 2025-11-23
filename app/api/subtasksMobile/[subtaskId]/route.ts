import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { sendPushNotification } from "@/lib/expo";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    const { subtaskId } = params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const subtaskWithTask = await db.subtask.findUnique({
      where: { id: subtaskId },
      include: {
        task: {
          include: {
            assignees: true,
            project: { select: { title: true, id: true } },
            subtask: true,
          },
        },
      },
    });

    if (!subtaskWithTask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    if (subtaskWithTask.status === status) {
      return NextResponse.json(subtaskWithTask);
    }

    const updatedSubtask = await db.subtask.update({
      where: { id: subtaskId },
      data: { status },
    });

    const parentTask = subtaskWithTask.task;
    const allSubtasks = parentTask.subtask;
    const projectId = parentTask.project.id;
    const taskId = parentTask.id;
    const assignees = parentTask.assignees;

    if (status === "COMPLETED") {
      const remainingPendingCount = allSubtasks.filter(
        (st) => st.id !== subtaskId && st.status !== "COMPLETED"
      ).length;

      if (remainingPendingCount === 0) {
        await db.task.update({
          where: { id: taskId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });

        for (const employee of assignees) {
          await sendPushNotification({
            employeeId: employee.id,
            title: `Task Completed: ${parentTask.project.title}`,
            body: `All subtasks for task "${parentTask.title}" are complete!`,
            data: {
              taskId: taskId,
              url: `/dashboard/projects/${projectId}/tasks/${taskId}`,
            },
          });
        }
      }
    }

    if (parentTask.status === "TODO" && status === "IN_PROGRESS") {
      await db.task.update({
        where: { id: taskId },
        data: { status: "IN_PROGRESS" },
      });
    }

    if (assignees && assignees.length > 0) {
      for (const employee of assignees) {
        await sendPushNotification({
          employeeId: employee.id,
          title: `Subtask Updated: ${status}`,
          body: `Subtask "${updatedSubtask.title}" in task "${parentTask.title}" is now ${status}.`,
          data: {
            taskId: taskId,
            url: `/dashboard/projects/${projectId}/tasks/${taskId}`,
          },
        });
      }
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
