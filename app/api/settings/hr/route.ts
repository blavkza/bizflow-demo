import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
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

    // Get HR settings or create default if they don't exist
    let settings = await db.hRSettings.findFirst();

    if (!settings) {
      // Create default settings if they don't exist
      settings = await db.hRSettings.create({
        data: {
          // All defaults are handled by Prisma schema
          updatedBy: creater.name,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch HR settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch HR settings", error },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const updates = await request.json();

    // Get current settings
    const currentSettings = await db.hRSettings.findFirst();

    if (!currentSettings) {
      // Create new settings with updates
      const newSettings = await db.hRSettings.create({
        data: {
          ...updates,
          updatedBy: userId,
        },
      });
      return NextResponse.json(newSettings);
    }

    // Update existing settings
    const updatedSettings = await db.hRSettings.update({
      where: { id: currentSettings.id },
      data: {
        ...updates,
        updatedBy: creator.name,
      },
    });

    await db.notification.create({
      data: {
        title: "Settings Updated",
        message: `Settings , has been Updated By ${creator.name}.`,
        type: "SYSTEM",
        isRead: false,
        actionUrl: `/dashboard/settings`,
        userId: creator.id,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Failed to save HR settings:", error);
    return NextResponse.json(
      { message: "Failed to save HR settings", error },
      { status: 500 }
    );
  }
}
