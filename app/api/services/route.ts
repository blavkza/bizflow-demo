import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

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
          include: {
            client: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const servicesWithClientCount = services.map((service) => {
      const uniqueClients = new Set(
        service.projects.map((project) => project.client?.id).filter(Boolean)
      );

      return {
        ...service,
        clientsCount: uniqueClients.size,
        projects: undefined,
      };
    });

    return NextResponse.json(servicesWithClientCount);
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
        description: body.description,
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
