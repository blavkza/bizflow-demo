import db from "@/lib/db";
import { projectSchema } from "@/lib/formValidationSchemas";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendPushNotification, sendPushFreelancer } from "@/lib/expo";
import { UserRole, NotificationType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = projectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 },
      );
    }

    const {
      title,
      description,
      projectType,
      billingType,
      managerId,
      clientId,
      startDate,
      priority,
      endDate,
      deadline,
      scheduledStartTime,
      assistantEmployeeIds,
      assistantFreelancerIds,
      toolIds,
      tasks,
    } = validation.data;

    // Only check manager if managerId is provided
    if (managerId) {
      const managerExists = await db.user.findUnique({
        where: { id: managerId },
      });

      if (!managerExists) {
        return NextResponse.json(
          { error: "Specified manager does not exist" },
          { status: 400 },
        );
      }
    }

    // Only check client if clientId is provided
    if (clientId) {
      const clientExists = await db.client.findUnique({
        where: { id: clientId },
      });

      if (!clientExists) {
        return NextResponse.json(
          { error: "Specified client does not exist" },
          { status: 400 },
        );
      }
    }

    const lastProject = await db.project.findFirst({
      orderBy: { createdAt: "desc" },
      select: { projectNumber: true },
    });

    const projectNumber = lastProject
      ? `PRO-${(parseInt(lastProject.projectNumber.split("-")[1]) + 1)
          .toString()
          .padStart(4, "0")}`
      : "PRO-0001";

    const project = await db.project.create({
      data: {
        projectNumber,
        title,
        description,
        projectType,
        billingType: billingType || null,
        clientId: clientId || null,
        managerId: managerId || creater.id,
        priority,
        startDate,
        endDate,
        deadline,
        scheduledStartTime,
        status: "PLANNING",
        assistantEmployees: {
          connect: assistantEmployeeIds?.map((id: string) => ({ id })) || [],
        },
        assistantFreelancers: {
          connect: assistantFreelancerIds?.map((id: string) => ({ id })) || [],
        },
        tools: {
          connect: toolIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        manager: { select: { employeeId: true, name: true } },
        assistantEmployees: { include: { user: true } },
        assistantFreelancers: { include: { user: true } },
        client: true,
      },
    });

    // Automatically create ProjectTeam members for assistants
    const assistantUsers = new Set<string>();

    project.assistantEmployees.forEach((emp) => {
      if (emp.user) assistantUsers.add(emp.user.id);
    });

    project.assistantFreelancers.forEach((free) => {
      if (free.user) assistantUsers.add(free.user.id);
    });

    // Also include the manager
    assistantUsers.add(project.managerId);

    if (assistantUsers.size > 0) {
      await db.projectTeam.createMany({
        data: Array.from(assistantUsers).map((uId) => ({
          projectId: project.id,
          userId: uId,
          role: uId === project.managerId ? "LEADER" : "MEMBER",
          canEditTask: true,
          canCreateTask: true,
          canViewFinancial: false,
          canUploadFiles: true,
          canDeleteFiles: false,
          canDeleteTask: false,
          canEditFile: true,
          canAddInvoice: false,
          canAddWorkLog: true,
        })),
        skipDuplicates: true,
      });
    }

    // Create tasks if provided
    if (tasks && tasks.length > 0) {
      for (const taskData of tasks) {
        const lastTask = await db.task.findFirst({
          orderBy: { createdAt: "desc" },
          select: { taskNumber: true },
        });

        const taskNumber = lastTask
          ? `TSK-${(parseInt(lastTask.taskNumber.split("-")[1]) + 1)
              .toString()
              .padStart(4, "0")}`
          : "TSK-0001";

        const task = await db.task.create({
          data: {
            taskNumber,
            title: taskData.title,
            description: taskData.description,
            projectId: project.id,
            status: taskData.status || "TODO",
            priority: taskData.priority || "MEDIUM",
            dueDate: taskData.dueDate || null,
            startTime: taskData.startTime || null,
            endTime: taskData.endTime || null,
            allocatedTime: taskData.allocatedTime || null,
            estimatedHours: taskData.estimatedHours || null,
            assignees: {
              connect:
                taskData.assigneeIds?.map((id: string) => ({ id })) || [],
            },
            freeLancerAssignees: {
              connect:
                taskData.freelancerIds?.map((id: string) => ({ id })) || [],
            },
          },
        });

        // Notifications for task assignees (reusing logic from tasks route)
        if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
          await Promise.all(
            taskData.assigneeIds.map((employeeId: string) =>
              sendPushNotification({
                employeeId,
                title: "New Task Assigned",
                body: `You have been assigned task "${task.title}" in project "${project.title}"!`,
                data: {
                  taskId: task.id,
                  url: `/dashboard/projects/${project.id}/tasks/${task.id}`,
                },
              }),
            ),
          );

          await db.employeeNotification.createMany({
            data: taskData.assigneeIds.map((employeeId: string) => ({
              employeeId,
              title: "New Task Assigned",
              message: `Task: ${task.title}\nProject: ${project.title}\nDetails: ${task.description || "No description"}\nAssigned by: ${creater.name}`,
              type: NotificationType.Task,
              isRead: false,
              actionUrl: `/dashboard/projects/${project.id}/tasks/${task.id}`,
            })),
          });
        }

        // Notifications for task assignees (freelancers)
        if (taskData.freelancerIds && taskData.freelancerIds.length > 0) {
          await Promise.all(
            taskData.freelancerIds.map((freelancerId: string) =>
              sendPushFreelancer({
                freelancerId,
                title: "New Task Assigned",
                body: `You have been assigned task "${task.title}" in project "${project.title}"!`,
                data: {
                  taskId: task.id,
                  url: `/dashboard/projects/${project.id}/tasks/${task.id}`,
                },
              }),
            ),
          );

          await db.employeeNotification.createMany({
            data: taskData.freelancerIds.map((freelancerId: string) => ({
              freeLancerId: freelancerId,
              title: "New Task Assigned",
              message: `Task: ${task.title}\nProject: ${project.title}\nDetails: ${task.description || "No description"}\nAssigned by: ${creater.name}`,
              type: NotificationType.Task,
              isRead: false,
              actionUrl: `/dashboard/projects/${project.id}/tasks/${task.id}`,
            })),
          });
        }
      }
    }

    const notification = await db.notification.create({
      data: {
        title: "New Project Created",
        message: `Project ${project.title} has been created by ${creater.name}.`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects/${project.id}`,
        userId: creater.id,
      },
    });

    if (project.manager?.employeeId) {
      const managerMessage = `You have been appointed as a team leader for project ${project.title} : ${project.projectNumber} by ${creater.name}.`;

      await db.employeeNotification.create({
        data: {
          employeeId: project.manager.employeeId,
          title: "Project Team-Leader",
          message: managerMessage,
          type: "EMPLOYEE",
          isRead: false,
          actionUrl: `/dashboard/projects/${project.id}`,
        },
      });

      await sendPushNotification({
        employeeId: project.manager.employeeId,
        title: "New Team Leader Role",
        body: managerMessage,
        data: {
          projectId: project.id,
          url: `/dashboard/projects/${project.id}`,
        },
      });
      console.log(
        `Push notification sent to new project manager: ${project.manager.employeeId}`,
      );
    }

    // Notifications for assistant employees
    if (assistantEmployeeIds && assistantEmployeeIds.length > 0) {
      const assistantMessage = `You have been assigned as an assistant to project ${project.title} : ${project.projectNumber} by ${creater.name}.`;

      await db.employeeNotification.createMany({
        data: assistantEmployeeIds.map((id: string) => ({
          employeeId: id,
          title: "Project Assistant",
          message: assistantMessage,
          type: "EMPLOYEE",
          actionUrl: `/dashboard/projects/${project.id}`,
        })),
      });

      await Promise.all(
        assistantEmployeeIds.map((id: string) =>
          sendPushNotification({
            employeeId: id,
            title: "Project Assignment",
            body: assistantMessage,
            data: {
              projectId: project.id,
              url: `/dashboard/projects/${project.id}`,
            },
          }),
        ),
      );
    }

    // Notifications for assistant freelancers
    if (assistantFreelancerIds && assistantFreelancerIds.length > 0) {
      const assistantMessage = `You have been assigned as an assistant to project ${project.title} : ${project.projectNumber} by ${creater.name}.`;

      await db.employeeNotification.createMany({
        data: assistantFreelancerIds.map((id: string) => ({
          freeLancerId: id,
          title: "Project Assistant",
          message: assistantMessage,
          type: "EMPLOYEE",
          actionUrl: `/dashboard/projects/${project.id}`,
        })),
      });

      await Promise.all(
        assistantFreelancerIds.map((id: string) =>
          sendPushFreelancer({
            freelancerId: id,
            title: "Project Assignment",
            body: assistantMessage,
            data: {
              projectId: project.id,
              url: `/dashboard/projects/${project.id}`,
            },
          }),
        ),
      );
    }

    return NextResponse.json({ project, notification });
  } catch (error) {
    console.error("[PROJECT_CREATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
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
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin =
      user.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
      user.role === UserRole.ADMIN_MANAGER;

    let projects;

    if (isSuperAdmin) {
      // SUPER ADMIN GETS ALL PROJECTS
      projects = await db.project.findMany({
        include: {
          client: true,
          manager: true,
          tasks: true,
          invoices: true,
          Folder: {
            include: {
              Document: true,
              Note: true,
            },
          },
          timeEntries: true,
          workLogs: true,
        },
        orderBy: { updatedAt: "desc" },
      });
    } else {
      // NORMAL USERS GET ONLY THEIR OWN PROJECTS
      projects = await db.project.findMany({
        where: {
          OR: [
            { managerId: user.id },
            {
              teamMembers: {
                some: { userId: user.id },
              },
            },
          ],
        },
        include: {
          client: true,
          manager: true,
          tasks: true,
          invoices: true,
          Folder: {
            include: {
              Document: true,
              Note: true,
            },
          },
          timeEntries: true,
          workLogs: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }

    // Format Data
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      projectNumber: project.projectNumber,
      title: project.title,
      description: project.description,
      projectType: project.projectType,
      billingType: project.billingType,
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
      folder: project.Folder,
      invoices: project.invoices,
      archived: project.archived,
      client: project.client,
      manager: project.manager,
      stats: {
        totalTasks: project.tasks.length,
        completedTasks: project.tasks.filter(
          (task) => task.status === "COMPLETED",
        ).length,
        timeEntries: project.timeEntries.length,
        totalWorkHours: project.workLogs.reduce(
          (total, log) => total + (log.hours ? Number(log.hours) : 0),
          0,
        ),
      },
    }));

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error("[GET_PROJECTS_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
