import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ProjectStatus } from "@prisma/client";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const services = await db.service.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        projects: {
          select: {
            id: true,
            status: true,
            client: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const servicesWithStats = services.map((service) => {
      const uniqueClients = new Set(
        service.projects.map((project) => project.client?.id).filter(Boolean)
      );

      const activeProjectsCount = service.projects.filter(
        (project) =>
          project.status === ProjectStatus.ACTIVE || ProjectStatus.PLANNING
      ).length;

      const completedProjectsCount = service.projects.filter(
        (project) => project.status === "COMPLETED"
      ).length;

      return {
        ...service,
        clientsCount: uniqueClients.size,
        activeProjects: activeProjectsCount,
        completedProjects: completedProjectsCount,
        projects: undefined,
      };
    });

    return NextResponse.json(servicesWithStats);
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();

    const service = await db.service.create({
      data: {
        name: body.name,
        description: body.description || "N/A",
        category: body.category,
        categoryId: body.categoryId,
        amount: parseFloat(body.amount),
        duration: body.duration,
        status: body.status,
        features: body.features,
      },
    });

    await db.notification.create({
      data: {
        title: "New Service Created",
        message: `New Service has been created by ${creator.name}.`,
        type: "SERVICE",
        isRead: false,
        actionUrl: `/dashboard/services/${service.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
