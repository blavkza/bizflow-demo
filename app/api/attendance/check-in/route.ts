import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { CheckInMethod, AttendanceStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

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

    // Find employee with scheduled times
    const employee = await db.employee.findUnique({
      where: { employeeNumber: employeeId },
      include: { department: true },
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

    // Check if today is a working day
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const todayDay = dayNames[currentTime.getDay()];

    if (
      employee.workingDays &&
      employee.workingDays.length > 0 &&
      !employee.workingDays.includes(todayDay)
    ) {
      return NextResponse.json(
        {
          error: "Today is not a scheduled working day",
        },
        { status: 400 }
      );
    }

    // Check if employee has already checked in today
    let attendanceRecord = await db.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
    });

    if (attendanceRecord && attendanceRecord.checkIn) {
      return NextResponse.json(
        { error: "Employee already checked in today" },
        { status: 400 }
      );
    }

    // Determine status based on scheduled knock-in time
    let status: AttendanceStatus = AttendanceStatus.PRESENT;

    if (employee.scheduledKnockIn) {
      // Parse the time string (e.g., "20:00") to compare with current time
      const scheduledTimeString = employee.scheduledKnockIn; // This should be "HH:mm" format
      const [scheduledHours, scheduledMinutes] = scheduledTimeString
        .split(":")
        .map(Number);

      const scheduledDateTime = new Date();
      scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);

      // If current time is more than 15 minutes after scheduled time, mark as late
      const lateThreshold = new Date(scheduledDateTime.getTime() + 15 * 60000);

      if (currentTime > lateThreshold) {
        status = AttendanceStatus.LATE;
      }
    }

    // Prepare data for create/update - keep scheduled times as strings
    const attendanceData: any = {
      checkIn: currentTime,
      checkInMethod: method as CheckInMethod,
      checkInAddress: location || address,
      checkInLat: lat ? parseFloat(lat) : null,
      checkInLng: lng ? parseFloat(lng) : null,
      status: status,
      notes: notes || null,
    };

    // Only include scheduled times as strings (don't convert to Date)
    if (employee.scheduledKnockIn) {
      attendanceData.scheduledKnockIn = employee.scheduledKnockIn; // Keep as string "HH:mm"
    }
    if (employee.scheduledKnockOut) {
      attendanceData.scheduledKnockOut = employee.scheduledKnockOut; // Keep as string "HH:mm"
    }

    if (!attendanceRecord) {
      // Create new attendance record
      attendanceRecord = await db.attendanceRecord.create({
        data: {
          employeeId: employee.id,
          date: today,
          ...attendanceData,
        },
        include: {
          employee: {
            include: {
              department: true,
            },
          },
        },
      });
    } else {
      // Update existing record with check-in
      attendanceRecord = await db.attendanceRecord.update({
        where: { id: attendanceRecord.id },
        data: attendanceData,
        include: {
          employee: {
            include: {
              department: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      message: "Check-in recorded successfully",
      record: attendanceRecord,
      status: status.toLowerCase(),
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
