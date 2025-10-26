import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const date = body.date || new Date().toISOString();

    // Call the cron endpoint internally
    const cronUrl = new URL("/api/cron/attendance", request.url);

    const response = await fetch(cronUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: "Failed to trigger auto-attendance", details: error },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      message: "Auto-attendance triggered successfully",
      ...result,
    });
  } catch (error) {
    console.error("Manual trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
