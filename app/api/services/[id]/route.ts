import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ProjectStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const service = await db.service.findUnique({
      where: { id: params.id },
      include: {
        projects: {
          include: {
            client: {
              select: {
                id: true,
                clientNumber: true,
                name: true,
                email: true,
                phone: true,
                company: true,
                status: true,
                type: true,
                avatar: true,
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
            _count: {
              select: {
                tasks: true,
                timeEntries: true,
                invoices: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // 1. Extract Unique Clients
    const clients = service.projects
      .map((project) => project.client)
      .filter(
        (client, index, array) =>
          client && array.findIndex((c) => c?.id === client.id) === index
      );

    // 2. Calculate Active Projects (IN_PROGRESS)
    const activeProjects = service.projects.filter(
      (p) => p.status === ProjectStatus.ACTIVE || ProjectStatus.PLANNING
    ).length;

    // 3. Calculate Completed Projects (COMPLETED)
    const completedProjects = service.projects.filter(
      (p) => p.status === "COMPLETED"
    ).length;

    // 4. Return combined data
    return NextResponse.json({
      ...service,
      clients,
      clientsCount: clients.length,
      activeProjects,
      completedProjects,
    });
  } catch (error) {
    console.error("Failed to fetch service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const service = await db.service.update({
      where: { id: params.id },
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
        title: "Service Updated",
        message: `Service has been Upddated by ${creator.name}.`,
        type: "SERVICE",
        isRead: false,
        actionUrl: `/dashboard/services/${service.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Failed to update service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await db.service.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Service deleted" });
  } catch (error) {
    console.error("Failed to delete service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
