import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AvailabilityStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    console.log(`API: Fetching pending overtime for userId: ${userId}`);

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Find the user and their associated employee/freelancer/trainee
    const user = await db.user.findUnique({
      where: { userId },
      include: {
        employee: true,
        freeLancer: true,
        trainee: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const conditions = [];
    if (user.employeeId) conditions.push({ employeeId: user.employeeId });
    if (user.freeLancerId) conditions.push({ freeLancerId: user.freeLancerId });
    if (user.traineeId) conditions.push({ traineeId: user.traineeId });

    if (conditions.length === 0) {
      return NextResponse.json({ availability: null });
    }

    const pendingAvailability = await db.overtimeAvailability.findFirst({
      where: {
        OR: conditions,
        status: AvailabilityStatus.PENDING,
        date: {
          gte: today,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ availability: pendingAvailability });
  } catch (error) {
    console.error("Error fetching pending overtime availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
