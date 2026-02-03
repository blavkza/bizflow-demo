import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tools = await db.tool.findMany({
      include: {
        rentals: true,
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
        },
        maintenanceLogs: true,
        rentalRequests: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(tools);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tools" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const tool = await db.tool.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        purchasePrice: body.purchasePrice,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        rentalRateDaily: body.rentalRateDaily,
        rentalRateWeekly: body.rentalRateWeekly,
        rentalRateMonthly: body.rentalRateMonthly,
        status: body.status || "AVAILABLE",
        condition: body.condition || "GOOD",
        primaryImage: body.primaryImage,
        images: body.images || [],
        createdBy: user.name || "system",
        canBeRented: body.canBeRented,
      },
    });

    return NextResponse.json(tool);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create tool" },
      { status: 500 },
    );
  }
}
