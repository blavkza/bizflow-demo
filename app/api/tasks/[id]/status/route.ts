import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NotificationType } from "@prisma/client";
import { sendPushNotification } from "@/lib/expo"; // Assuming this is the correct path

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

    const { status } = body;
    // ... (rest of body properties)

    const currentTask = await db.task.findUnique({
      where: { id },
      include: {
        subtask: true,
        assignees: true,
        project: { select: { title: true, id: true } },
      },
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // --- Rest of updateData logic (omitted for brevity) ---
    const updateData: any = {
      /* ... */
    };
    // ...

    const result = await db.$transaction(async (tx) => {
      // 1. Update Task Status/Data
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          status,
          completedAt:
            status === "COMPLETED"
              ? new Date()
              : currentTask.status === "COMPLETED"
                ? null
                : currentTask.completedAt,
          // ... other updateData fields
        },
      });

      // 2. Update Subtasks (existing logic)
      if (
        status === "COMPLETED" &&
        currentTask.status !== "COMPLETED" &&
        currentTask.subtask.length > 0
      ) {
        await tx.subtask.updateMany({
          where: { taskId: id, status: { not: "COMPLETED" } },
          data: { status: "COMPLETED" },
        });
      }

      // 3. Project Completion Check (existing logic)
      const projectTasks = await tx.task.findMany({
        where: { projectId: updatedTask.projectId },
      });
      const allTasksCompleted = projectTasks.every(
        (task) => task.status === "COMPLETED"
      );
      const updatedProject = await tx.project.update({
        where: { id: updatedTask.projectId },
        data: { status: allTasksCompleted ? "COMPLETED" : "ACTIVE" },
      });

      // 4. Send Notifications (Push and DB)
      if (currentTask.assignees && currentTask.assignees.length > 0) {
        const employeeNotifications = currentTask.assignees.map((employee) => ({
          employeeId: employee.id,
          title: "Task Status Updated",
          message: `Task "${currentTask.title}" status changed to ${status} by ${updater.name}.`,
          type: NotificationType.Task,
          isRead: false,
          actionUrl: `/dashboard/projects/${updatedTask.projectId}/tasks/${id}`,
        }));

        // --- PUSH NOTIFICATION (CORRECTED) ---
        for (const employee of currentTask.assignees) {
          await sendPushNotification({
            employeeId: employee.id,
            title: "Task Status Updated",
            // Use currentTask.title because updatedTask only has data for status/dates
            body: `Task "${currentTask.title}" status changed to ${status} by ${updater.name}.`,
            data: {
              taskId: updatedTask.id,
              url: `/dashboard/projects/${updatedTask.projectId}/tasks/${updatedTask.id}`,
            },
          });
        }
        // --- END PUSH NOTIFICATION ---

        await tx.employeeNotification.createMany({
          data: employeeNotifications,
        });
      }

      // Notify Admin/Updater
      await tx.notification.create({
        data: {
          title: "Task Updated",
          message: `Task ${currentTask.title} has been updated by ${updater.name}.`,
          type: "PROJECT",
          isRead: false,
          actionUrl: `/dashboard/projects/${updatedTask.projectId}`,
          userId: updater.id,
        },
      });

      return { updatedTask, updatedProject };
    });

    // NOTE: The separate fetch for fullUpdatedTask at the end of the original function
    // is often unnecessary. We rely on the result from the transaction here.
    return NextResponse.json({
      task: result.updatedTask,
      project: result.updatedProject,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleter = await db.user.findUnique({
      where: { userId },
      select: { name: true, id: true },
    });

    const taskToDelete = await db.task.findUnique({
      where: { id },
      include: {
        assignees: true,
        project: { select: { title: true, id: true } },
      },
    });

    if (!taskToDelete) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Perform Delete
    await db.task.delete({ where: { id } });

    // 1. Notify Assignees (DB History)
    if (taskToDelete.assignees && taskToDelete.assignees.length > 0) {
      const employeeNotifications = taskToDelete.assignees.map((employee) => ({
        employeeId: employee.id,
        title: "Task Deleted",
        message: `Task "${taskToDelete.title}" has been deleted by ${deleter?.name || "Admin"}.`,
        type: NotificationType.Task,
        isRead: false,
        actionUrl: `/dashboard/projects/${taskToDelete.project.id}`,
      }));

      await db.employeeNotification.createMany({ data: employeeNotifications });

      // 2. PUSH NOTIFICATION (MOBILE ALERT)
      for (const employee of taskToDelete.assignees) {
        await sendPushNotification({
          employeeId: employee.id,
          title: "Task Deleted",
          body: `Task "${taskToDelete.title}" has been deleted by ${deleter?.name || "Admin"}.`,
          data: { projectId: taskToDelete.project.id },
        });
      }
    }

    // Notify Admin/Deleter (existing logic)
    await db.notification.create({
      data: {
        title: "Task Deleted",
        message: `Task "${taskToDelete.title}" from project "${taskToDelete.project.title}" has been deleted by ${deleter?.name || "Admin"}.`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects/${taskToDelete.project.id}`,
        userId: deleter?.id!,
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
