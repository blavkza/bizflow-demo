import db from "@/lib/db";
import { taskSchema } from "@/lib/formValidationSchemas";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true, email: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = taskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const { data } = validation;

    const projectExists = await db.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, title: true, status: true },
    });

    if (!projectExists) {
      return NextResponse.json(
        { error: "Specified project does not exist" },
        { status: 404 }
      );
    }
    if (projectExists.status === "COMPLETED") {
      await db.project.update({
        where: { id: projectExists.id },
        data: {
          status: "ACTIVE",
        },
      });
    }

    if (data.assigneeIds?.length > 0) {
      const existingAssignees = await db.employee.findMany({
        where: { id: { in: data.assigneeIds } },
      });

      if (existingAssignees.length !== data.assigneeIds.length) {
        const missingIds = data.assigneeIds.filter(
          (id) => !existingAssignees.some((a) => a.id === id)
        );
        return NextResponse.json(
          { error: `Employees not found: ${missingIds.join(", ")}` },
          { status: 404 }
        );
      }
    }

    const taskNumber = `TSK-${Math.floor(100000 + Math.random() * 900000)}`;

    const result = await db.$transaction(async (prisma) => {
      const task = await prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          projectId: data.projectId,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate || null,
          estimatedHours: data.estimatedHours,
          taskNumber,
          assignees: {
            connect: data.assigneeIds?.map((id) => ({ id })) || [],
          },
        },
        include: {
          assignees: true,
          project: {
            select: {
              title: true,
            },
          },
        },
      });

      // Create notification for creator
      await prisma.notification.create({
        data: {
          title: "New Task Created",
          message: `You created task "${task.title}" in project ${task.project.title}`,
          type: "PROJECT",
          isRead: false,
          actionUrl: `/dashboard/projects/${task.projectId}/tasks/${task.id}`,
          userId: creator.id,
        },
      });

      // Create notifications for assignees if any
      /*   if (task.assignees.length > 0) {
        await prisma.notification.createMany({
          data: task.assignees.map((assignee) => ({
            title: "New Task Assigned",
            message: `You've been assigned to task "${task.title}" in project ${task.project.title}`,
            type: "TASK_ASSIGNED",
            isRead: false,
            actionUrl: `/dashboard/projects/${task.projectId}/tasks/${task.id}`,
            userId: assignee.id,
          })),
        });
 */

      return task;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[TASK_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const projects = await db.project.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            assignees: true,
          },
        },
        invoices: {
          select: {
            totalAmount: true,
          },
        },
        timeEntries: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform the data for better client-side consumption
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      projectNumber: project.projectNumber,
      title: project.title,
      description: project.description,
      status: project.status,
      priority: project.priority,
      starred: project.starred,
      progress: project.progress,
      budget: project.budget,
      currency: project.currency,
      hourlyRate: project.hourlyRate,
      startDate: project.startDate?.toISOString(),
      endDate: project.endDate?.toISOString(),
      deadline: project.deadline?.toISOString(),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      tasks: project.tasks,
      invoice: project.invoices,
      client: project.client
        ? {
            id: project.client.id,
            name: project.client.name,
            email: project.client.email,
          }
        : null,
      manager: {
        id: project.manager?.id,
        name: project.manager?.name,
        email: project.manager?.email,
        avatar: project.manager?.avatar,
      },
      stats: {
        totalTasks: project.tasks.length,
        completedTasks: project.tasks.filter(
          (task) => task.status === "COMPLETED"
        ).length,
        timeEntries: project.timeEntries.length,
      },
    }));

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error("[GET_PROJECTS_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
