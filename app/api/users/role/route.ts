import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get the userId from the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Find the user in the database
    const user = await db.user.findUnique({
      where: {
        userId: userId,
      },
      select: {
        role: true,
        id: true,
        permissions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
