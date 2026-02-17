import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const notifications = await db.notification.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, message, type, priority, actionUrl } = body;

    if (type === "ATTENDANCE") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingNotification = await db.notification.findFirst({
        where: {
          userId,
          title,
          createdAt: {
            gte: today,
          },
        },
      });

      if (existingNotification) {
        return NextResponse.json(existingNotification);
      }
    }

    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || "SYSTEM",
        priority: priority || "MEDIUM",
        actionUrl,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("[NOTIFICATIONS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
