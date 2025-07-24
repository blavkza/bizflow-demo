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
