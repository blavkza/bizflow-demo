import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tool = await db.tool.findUnique({
      where: { id: params.id },
      include: {
        rentals: {
          orderBy: { createdAt: "desc" },
        },
        InterUse: {
          include: {
            Project: {
              select: {
                id: true,
                projectNumber: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        maintenanceLogs: {
          orderBy: { maintenanceDate: "desc" },
        },
        rentalRequests: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    return NextResponse.json(tool);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tool" },
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
    const user = await db.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return new NextResponse("User Not Found", { status: 401 });
    }

    const body = await request.json();

    const tool = await db.tool.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        purchasePrice: body.purchasePrice,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        rentalRateDaily: body.rentalRateDaily,
        rentalRateWeekly: body.rentalRateWeekly,
        rentalRateMonthly: body.rentalRateMonthly,
        status: body.status,
        condition: body.condition,
        primaryImage: body.primaryImage,
        images: body.images,
        canBeRented: body.canBeRented,
      },
    });

    return NextResponse.json(tool);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update tool" },
      { status: 500 }
    );
  }
}
