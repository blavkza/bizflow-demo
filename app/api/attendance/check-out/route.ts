import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { CheckInMethod } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      employeeId,
      location,
      notes,
      method = CheckInMethod.MANUAL,
      lat,
      lng,
      address,
    } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    // Find employee
    const employee = await db.employee.findUnique({
      where: { employeeNumber: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = new Date();

    // Find today's attendance record
    let attendanceRecord = await db.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
    });

    if (!attendanceRecord) {
      return NextResponse.json(
        { error: "No check-in found for today" },
        { status: 400 }
      );
    }

    if (attendanceRecord.checkOut) {
      return NextResponse.json(
        { error: "Employee already checked out today" },
        { status: 400 }
      );
    }

    const checkInTime = attendanceRecord.checkIn!;

    // Calculate regular hours (based on scheduled hours or default 8 hours)
    let regularHours = 8; // Default regular hours
    let overtimeHours = 0;

    if (employee.scheduledKnockIn && employee.scheduledKnockOut) {
      // Parse time strings (e.g., "20:00" and "06:00")
      const [startHours, startMinutes] = employee.scheduledKnockIn
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = employee.scheduledKnockOut
        .split(":")
        .map(Number);

      // Create scheduled times based on check-in date
      const scheduledStartTime = new Date(checkInTime);
      scheduledStartTime.setHours(startHours, startMinutes, 0, 0);

      const scheduledEndTime = new Date(checkInTime);
      scheduledEndTime.setHours(endHours, endMinutes, 0, 0);

      // Handle overnight shifts (if end time is earlier than start time, add 1 day)
      if (scheduledEndTime <= scheduledStartTime) {
        scheduledEndTime.setDate(scheduledEndTime.getDate() + 1);
      }

      // Calculate scheduled hours
      const scheduledHours =
        (scheduledEndTime.getTime() - scheduledStartTime.getTime()) /
        (1000 * 60 * 60);

      // Calculate actual hours worked
      const actualHoursWorked =
        (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      // Overtime is any time worked beyond scheduled end time
      if (currentTime > scheduledEndTime) {
        const overtime =
          (currentTime.getTime() - scheduledEndTime.getTime()) /
          (1000 * 60 * 60);
        overtimeHours = Math.max(overtime, 0);

        // Adjust regular hours to not exceed scheduled hours
        regularHours = Math.min(
          actualHoursWorked - overtimeHours,
          scheduledHours
        );
      } else {
        // No overtime if checked out before scheduled end time
        regularHours = Math.min(actualHoursWorked, scheduledHours);
        overtimeHours = 0;
      }

      // Ensure regular hours doesn't go negative
      regularHours = Math.max(0, regularHours);
    } else {
      // Fallback: calculate based on 8-hour workday
      const hoursWorked =
        (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      regularHours = Math.min(hoursWorked, 8);
      overtimeHours = Math.max(hoursWorked - 8, 0);
    }

    // Round hours to 2 decimal places
    regularHours = Math.round(regularHours * 100) / 100;
    overtimeHours = Math.round(overtimeHours * 100) / 100;

    // Update attendance record with check-out and calculated hours
    attendanceRecord = await db.attendanceRecord.update({
      where: { id: attendanceRecord.id },
      data: {
        checkOut: currentTime,
        checkOutAddress: location || address,
        checkOutLat: lat ? parseFloat(lat) : null,
        checkOutLng: lng ? parseFloat(lng) : null,
        regularHours,
        overtimeHours,
        notes: notes || attendanceRecord.notes,
      },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Check-out recorded successfully",
      record: attendanceRecord,
      regularHours,
      overtimeHours,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
