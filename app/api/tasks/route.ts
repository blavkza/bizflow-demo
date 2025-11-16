import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { taskSchema } from "@/lib/formValidationSchemas";

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

    if (body.tasks && Array.isArray(body.tasks)) {
      return await createAITasks(body.tasks, creator);
    } else {
      return await createSingleTask(body, creator);
    }
  } catch (error) {
    console.error("[TASK_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function createSingleTask(data: any, creator: any) {
  const validation = taskSchema.safeParse(data);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors },
      { status: 400 }
    );
  }

  const { data: validatedData } = validation;

  const project = await db.project.findUnique({
    where: { id: validatedData.projectId },
    select: { id: true, title: true, status: true },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Specified project does not exist" },
      { status: 404 }
    );
  }

  if (project.status === "COMPLETED") {
    await db.project.update({
      where: { id: project.id },
      data: { status: "ACTIVE" },
    });
  }

  const taskCount = await db.task.count({
    where: { projectId: project.id },
  });

  if (
    taskCount === 0 &&
    project.status !== "ACTIVE" &&
    project.status !== "ON_HOLD"
  ) {
    await db.project.update({
      where: { id: project.id },
      data: { status: "ACTIVE" },
    });
  }

  // Validate employees exist
  if (validatedData?.assigneeIds?.length || 0 > 0) {
    const existingAssignees = await db.employee.findMany({
      where: { id: { in: validatedData.assigneeIds } },
    });

    if (existingAssignees.length !== validatedData?.assigneeIds?.length) {
      const missingIds = validatedData?.assigneeIds?.filter(
        (id: string) => !existingAssignees.some((a) => a.id === id)
      );
      return NextResponse.json(
        { error: `Employees not found: ${missingIds?.join(", ")}` },
        { status: 404 }
      );
    }
  }

  // Validate freelancers exist
  if (validatedData?.freelancerIds?.length || 0 > 0) {
    const existingFreelancers = await db.freeLancer.findMany({
      where: { id: { in: validatedData.freelancerIds } },
    });

    if (existingFreelancers.length !== validatedData?.freelancerIds?.length) {
      const missingIds = validatedData?.freelancerIds?.filter(
        (id: string) => !existingFreelancers.some((f) => f.id === id)
      );
      return NextResponse.json(
        { error: `Freelancers not found: ${missingIds?.join(", ")}` },
        { status: 404 }
      );
    }
  }

  const lastTask = await db.task.findFirst({
    orderBy: { createdAt: "desc" },
    select: { taskNumber: true },
  });

  const taskNumber = lastTask
    ? `TSK-${(parseInt(lastTask.taskNumber.split("-")[1]) + 1)
        .toString()
        .padStart(4, "0")}`
    : "TSK-0001";

  const result = await db.$transaction(
    async (prisma) => {
      const task = await prisma.task.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          projectId: validatedData.projectId,
          status: validatedData.status,
          priority: validatedData.priority,
          dueDate: validatedData.dueDate || null,
          estimatedHours: validatedData.estimatedHours,
          taskNumber,
          isAIGenerated: validatedData.isAIGenerated || false,
          assignees: {
            connect:
              validatedData.assigneeIds?.map((id: string) => ({ id })) || [],
          },
          freeLancerAssignees: {
            connect:
              validatedData.freelancerIds?.map((id: string) => ({ id })) || [],
          },
        },
        include: {
          assignees: true,
          freeLancerAssignees: true,
          project: { select: { title: true } },
        },
      });

      if (validatedData.subtasks && validatedData.subtasks.length > 0) {
        await prisma.subtask.createMany({
          data: validatedData.subtasks.map((subtask: any, index: number) => ({
            title: subtask.title,
            description: subtask.description || "",
            estimatedHours: subtask.estimatedHours || null,
            order: index,
            taskId: task.id,
            status: subtask.status || "TODO",
          })),
        });
      }

      return task;
    },
    {
      timeout: 10000,
    }
  );

  // Create notification outside transaction
  await db.notification.create({
    data: {
      title: "New Task Created",
      message: `You created task "${result.title}" in project ${result.project.title}`,
      type: "PROJECT",
      isRead: false,
      actionUrl: `/dashboard/projects/${result.projectId}/tasks/${result.id}`,
      userId: creator.id,
    },
  });

  return NextResponse.json(result, { status: 201 });
}

async function createAITasks(tasks: any[], creator: any) {
  for (const taskData of tasks) {
    const validation = taskSchema.safeParse(taskData);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }
  }

  const projectId = tasks[0]?.projectId;
  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, title: true, status: true },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Specified project does not exist" },
      { status: 404 }
    );
  }

  // If project was completed, change it back to active when adding new tasks
  if (project.status === "COMPLETED") {
    await db.project.update({
      where: { id: project.id },
      data: { status: "ACTIVE" },
    });
  }

  const taskCount = await db.task.count({
    where: { projectId: project.id },
  });

  if (
    taskCount === 0 &&
    project.status !== "ACTIVE" &&
    project.status !== "ON_HOLD"
  ) {
    await db.project.update({
      where: { id: project.id },
      data: { status: "ACTIVE" },
    });
  }

  // Process tasks individually to avoid transaction timeouts
  const allResults = [];

  for (const taskData of tasks) {
    try {
      const result = await createSingleTaskInBatch(
        taskData,
        projectId,
        creator
      );
      allResults.push(result);
    } catch (error) {
      console.error("Failed to create task:", error);
      // Continue with other tasks even if one fails
      continue;
    }
  }

  return NextResponse.json(allResults, { status: 201 });
}

async function createSingleTaskInBatch(
  taskData: any,
  projectId: string,
  creator: any
) {
  const lastTask = await db.task.findFirst({
    orderBy: { createdAt: "desc" },
    select: { taskNumber: true },
  });

  const taskNumber = lastTask
    ? `TSK-${(parseInt(lastTask.taskNumber.split("-")[1]) + 1)
        .toString()
        .padStart(4, "0")}`
    : "TSK-0001";

  return await db.$transaction(
    async (prisma) => {
      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description || "",
          projectId: projectId,
          status: taskData.status || "TODO",
          priority: taskData.priority || "MEDIUM",
          dueDate: taskData.dueDate || null,
          estimatedHours: taskData.estimatedHours || null,
          taskNumber,
          isAIGenerated: taskData.isAIGenerated || false,
          assignees: {
            connect: taskData.assigneeIds?.map((id: string) => ({ id })) || [],
          },
          freeLancerAssignees: {
            connect:
              taskData.freelancerIds?.map((id: string) => ({ id })) || [],
          },
        },
        include: {
          assignees: true,
          freeLancerAssignees: true,
          project: { select: { title: true } },
        },
      });

      if (taskData.subtasks && taskData.subtasks.length > 0) {
        await prisma.subtask.createMany({
          data: taskData.subtasks.map((subtask: any, index: number) => ({
            title: subtask.title,
            description: subtask.description || "",
            estimatedHours: subtask.estimatedHours || null,
            order: index,
            taskId: task.id,
            status: subtask.status || "TODO",
          })),
        });
      }

      // Create notification
      await prisma.notification.create({
        data: {
          title: "Task Created",
          message: `Created task "${task.title}" in project ${task.project.title}`,
          type: "PROJECT",
          isRead: false,
          actionUrl: `/dashboard/projects/${task.projectId}/tasks/${task.id}`,
          userId: creator.id,
        },
      });

      return task;
    },
    {
      timeout: 15000,
    }
  );
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
