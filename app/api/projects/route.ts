import db from "@/lib/db";
import { projectSchema } from "@/lib/formValidationSchemas";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
        { status: 400 }
      );
    }

    const {
      title,
      description,
      managerId,
      clientId,
      startDate,
      priority,
      endDate,
      deadline,
    } = validation.data;

    // Only check manager if managerId is provided
    if (managerId) {
      const managerExists = await db.user.findUnique({
        where: { id: managerId },
      });

      if (!managerExists) {
        return NextResponse.json(
          { error: "Specified manager does not exist" },
          { status: 400 }
        );
      }
    }

    function generateClientNumber() {
      const randomSix = Math.floor(100000 + Math.random() * 900000);
      return `PRO-${randomSix}`;
    }

    const projectNumber = generateClientNumber();

    const project = await db.project.create({
      data: {
        projectNumber,
        title,
        clientId,
        managerId,
        description,
        priority,
        startDate,
        endDate,
        deadline,
        status: "PLANNING",
      },
      include: {
        manager: true,
      },
    });

    const notification = await db.notification.create({
      data: {
        title: "New Project Created",
        message: `Project ${project.title} , has been created By ${creater.name}.`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects/${project.id}`,
        userId: creater.id,
      },
    });

    return NextResponse.json({ project, notification });
  } catch (error) {
    console.error("[DEPARTMENT_CREATE_ERROR]", error);
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await db.project.findMany({
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
        tasks: true,
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
          },
        },
        Folder: { include: { Document: true, Note: true } },

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
      folder: project.Folder,
      invoice: project.invoices,
      archived: project.archived,
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
