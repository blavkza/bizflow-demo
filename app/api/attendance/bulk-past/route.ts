import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  AttendanceStatus,
  CheckInMethod,
  OvertimeStatus,
} from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, entries } = body;

    if (!date || !entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const hrSettings = await db.hRSettings.findFirst();
    const results = [];

    // Process each freelancer entry
    for (const entry of entries) {
      const { freelancerId, checkIn, checkOut } = entry;

      const freelancer = await db.freeLancer.findUnique({
        where: { id: freelancerId },
      });

      if (!freelancer) {
        results.push({
          freelancerId,
          status: "error",
          message: "Freelancer not found",
        });
        continue;
      }

      // Parse strings manually to avoid timezone ambiguity
      const parseSASTStr = (sastStr: string) => {
        const [dPart, tPart] = sastStr.split("T");
        const [y, m, d] = dPart.split("-").map(Number);
        const [hh, mm] = tPart.split(":").map(Number);
        // SAST is UTC+2, so subtract 2 from hours for UTC
        return new Date(Date.UTC(y, m - 1, d, hh - 2, mm, 0));
      };

      const checkInDate = parseSASTStr(checkIn);
      const checkOutDate = parseSASTStr(checkOut);
      const recordDate = new Date(date);
      recordDate.setUTCHours(0, 0, 0, 0);

      // Reuse calculation logic (simplified for this context)
      const calculation = await calculateHoursAndStatus(
        freelancer,
        checkInDate,
        checkOutDate,
        AttendanceStatus.PRESENT,
        false, // assuming no night shift for manual bulk for now
        hrSettings,
      );

      // Upsert Attendance Record
      const record = await db.attendanceRecord.upsert({
        where: {
          freeLancerId_date: {
            freeLancerId: freelancer.id,
            date: recordDate,
          },
        },
        update: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          regularHours: calculation.regularHours,
          overtimeHours: calculation.overtimeHours,
          status: calculation.newStatus,
          checkInMethod: CheckInMethod.MANUAL,
          notes: "Manual entry for past date",
        },
        create: {
          freeLancerId: freelancer.id,
          date: recordDate,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          regularHours: calculation.regularHours,
          overtimeHours: calculation.overtimeHours,
          status: calculation.newStatus,
          checkInMethod: CheckInMethod.MANUAL,
          notes: "Manual entry for past date",
        },
      });

      // If there's overtime, create an approved overtime request automatically
      if (calculation.overtimeHours > 0) {
        const otRequest = await db.overtimeRequest.upsert({
          where: {
            // We don't have a unique constraint on OvertimeRequest date/freelancer besides what we add
            // but for manual entry, we should ensure only one exists or update existing
            id: record.overtimeRequestId || "new",
          },
          update: {
            status: OvertimeStatus.APPROVED,
            startTime: checkInDate, // Or some default
            endTime: checkOutDate,
            duration: calculation.overtimeHours,
            approvedAt: new Date(),
            approvedBy: userId,
          },
          create: {
            freeLancerId: freelancer.id,
            date: recordDate,
            startTime: checkInDate,
            endTime: checkOutDate,
            duration: calculation.overtimeHours,
            status: OvertimeStatus.APPROVED,
            reason: "Auto-approved via bulk manual entry",
            approvedAt: new Date(),
            approvedBy: userId,
          },
        });

        // Link it back to the record if it wasn't already
        if (record.overtimeRequestId !== otRequest.id) {
          await db.attendanceRecord.update({
            where: { id: record.id },
            data: { overtimeRequestId: otRequest.id },
          });
        }
      }

      results.push({ freelancerId, status: "success", recordId: record.id });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Bulk manual attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Function replicated from check-out/route.ts but slightly adapted for general use
async function calculateHoursAndStatus(
  person: any,
  checkInTime: Date,
  checkOutTime: Date,
  currentStatus: AttendanceStatus,
  isNightShift: boolean = false,
  hrSettings?: any,
) {
  const overtimeThreshold = hrSettings?.overtimeThreshold || 8.0;
  const halfDayThreshold = hrSettings?.halfDayThreshold || 4.0;
  const workingHoursWeekend = hrSettings?.workingHoursWeekend || 4;
  const workingHoursPerDay = hrSettings?.workingHoursPerDay || 8;
  const weekendOvertimeThreshold =
    hrSettings?.WeekendovertimeThreshold || workingHoursWeekend;

  const actualHoursWorked =
    (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

  const sastFormatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "short",
  });
  const checkInDay = sastFormatter.format(checkInTime).toUpperCase();
  const isWeekend = checkInDay === "SAT" || checkInDay === "SUN";

  const workingHoursForDay = isWeekend
    ? workingHoursWeekend
    : workingHoursPerDay;
  const effectiveOvertimeThreshold = isWeekend
    ? weekendOvertimeThreshold
    : overtimeThreshold;

  let regularHours = 0;
  let overtimeHours = 0;
  let newStatus = currentStatus;
  let workedPercentage = 0;

  if (actualHoursWorked > effectiveOvertimeThreshold) {
    regularHours = effectiveOvertimeThreshold;
    overtimeHours = actualHoursWorked - effectiveOvertimeThreshold;
    workedPercentage = 100;
  } else {
    regularHours = actualHoursWorked;
    overtimeHours = 0;
    workedPercentage = (actualHoursWorked / workingHoursForDay) * 100;
    newStatus =
      actualHoursWorked >= halfDayThreshold
        ? currentStatus
        : AttendanceStatus.ABSENT;
  }

  return {
    regularHours: Math.round(regularHours * 10) / 10,
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    newStatus,
    workedPercentage: Math.round(workedPercentage),
  };
}
