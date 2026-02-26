import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AvailabilityStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { availabilityId, status } = await request.json();

    if (!availabilityId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!Object.values(AvailabilityStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedAvailability = await db.overtimeAvailability.update({
      where: { id: availabilityId },
      data: {
        status: status as AvailabilityStatus,
      },
      include: {
        employee: true,
        freeLancer: true,
        trainee: true,
      },
    });

    if (status === AvailabilityStatus.AVAILABLE) {
      // Link to attendance record if it exists for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await db.attendanceRecord.updateMany({
        where: {
          date: today,
          OR: [
            { employeeId: updatedAvailability.employeeId || undefined },
            { freeLancerId: updatedAvailability.freeLancerId || undefined },
            { traineeId: updatedAvailability.traineeId || undefined },
          ].filter((c) => c.employeeId || c.freeLancerId || c.traineeId),
        },
        data: {
          overtimeAvailabilityId: updatedAvailability.id,
        },
      });
    }

    return NextResponse.json({ success: true, data: updatedAvailability });
  } catch (error) {
    console.error("Error responding to overtime availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
