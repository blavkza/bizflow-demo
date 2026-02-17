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

    // Process each worker entry
    for (const entry of entries) {
      const { workerId, workerType, checkIn, checkOut } = entry;
      const isEmployee = workerType === "employee";
      const isFreelancer = workerType === "freelancer";
      const isTrainer = workerType === "trainer";

      let worker;
      if (isEmployee) {
        worker = await db.employee.findUnique({
          where: { id: workerId },
        });
      } else if (isFreelancer) {
        worker = await db.freeLancer.findUnique({
          where: { id: workerId },
        });
      } else {
        worker = await db.trainer.findUnique({
          where: { id: workerId },
        });
      }

      if (!worker) {
        results.push({
          workerId,
          status: "error",
          message: `${isEmployee ? "Employee" : isFreelancer ? "Freelancer" : "Trainer"} not found`,
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

      // Reuse calculation logic
      const calculation = await calculateHoursAndStatus(
        worker,
        checkInDate,
        checkOutDate,
        AttendanceStatus.PRESENT,
        false,
        hrSettings,
      );

      // Build specific search key for upsert
      const upsertWhere: any = isEmployee
        ? { employeeId_date: { employeeId: worker.id, date: recordDate } }
        : isFreelancer
          ? {
              freeLancerId_date: {
                freeLancerId: worker.id,
                date: recordDate,
              },
            }
          : { trainerId_date: { trainerId: worker.id, date: recordDate } };

      const dataBatch: any = {
        date: recordDate,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        regularHours: calculation.regularHours,
        overtimeHours: calculation.overtimeHours,
        status: calculation.newStatus,
        checkInMethod: CheckInMethod.MANUAL,
        notes: "Manual entry for past date",
      };

      if (isEmployee) {
        dataBatch.employeeId = worker.id;
      } else if (isFreelancer) {
        dataBatch.freeLancerId = worker.id;
      } else {
        dataBatch.trainerId = worker.id;
      }

      // Upsert Attendance Record
      const record = await db.attendanceRecord.upsert({
        where: upsertWhere,
        update: dataBatch,
        create: dataBatch,
      });

      // If there's overtime, create an approved overtime request automatically
      if (calculation.overtimeHours > 0) {
        const otWhere: any = { id: record.overtimeRequestId || "new" };
        const otData: any = {
          date: recordDate,
          startTime: checkInDate,
          endTime: checkOutDate,
          duration: calculation.overtimeHours,
          status: OvertimeStatus.APPROVED,
          reason: "Auto-approved via bulk manual entry",
          approvedAt: new Date(),
          approvedBy: userId,
        };

        if (isEmployee) {
          otData.employeeId = worker.id;
        } else if (isFreelancer) {
          otData.freeLancerId = worker.id;
        } else {
          otData.trainerId = worker.id;
        }

        const otRequest = await db.overtimeRequest.upsert({
          where: otWhere,
          update: otData,
          create: otData,
        });

        // Link it back to the record if it wasn't already
        if (record.overtimeRequestId !== otRequest.id) {
          await db.attendanceRecord.update({
            where: { id: record.id },
            data: { overtimeRequestId: otRequest.id },
          });
        }
      }

      results.push({ workerId, status: "success", recordId: record.id });
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
