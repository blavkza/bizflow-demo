import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const { userId: authenticatedUserId } = await auth();

    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    if (authenticatedUserId !== userId) {
      console.warn(
        `User ${authenticatedUserId} attempted to access data for ${userId}`
      );
      return NextResponse.json(
        { error: "Forbidden - You can only access your own data" },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: {
        userId,
      },
      include: {
        employee: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
