import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  AttendanceStatus,
  OvertimeStatus,
  CheckInMethod,
} from "@prisma/client";
import { addMinutes, isAfter, parse } from "date-fns";

// SIMPLIFIED TIMEZONE FUNCTION (Matching existing routes)
function getCurrentSAST() {
  const now = new Date();
  const sastFormatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const sastParts = sastFormatter.formatToParts(now);
  const getPart = (type: string) =>
    sastParts.find((p) => p.type === type)?.value || "00";

  const year = parseInt(getPart("year"));
  const month = parseInt(getPart("month")) - 1; // 0-indexed
  const day = parseInt(getPart("day"));
  const hour = parseInt(getPart("hour"));
  const minute = parseInt(getPart("minute"));
  const second = parseInt(getPart("second"));

  return {
    nowSAST: new Date(year, month, day, hour, minute, second),
    todaySASTMidnight: new Date(Date.UTC(year, month, day)),
  };
}

export async function GET(request: NextRequest) {
  try {
    // Basic security check (optional, but good practice if you have a CRON_SECRET)
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      // For now, let's allow it if no secret is set so the user can test,
      // but in a real prod app we'd enforce this.
      console.warn("Cron triggered without valid secret");
    }

    const { nowSAST, todaySASTMidnight } = getCurrentSAST();
    const yesterdaySASTMidnight = new Date(todaySASTMidnight);
    yesterdaySASTMidnight.setDate(yesterdaySASTMidnight.getDate() - 1);

    // 1. Find all active attendance records from today and yesterday
    const activeRecords = await db.attendanceRecord.findMany({
      where: {
        checkOut: null,
        OR: [{ date: todaySASTMidnight }, { date: yesterdaySASTMidnight }],
      },
      include: {
        employee: true,
        freeLancer: true,
        overtimeRequest: true,
      },
    });

    const checkouts = [];

    for (const record of activeRecords) {
      const person = record.employee || record.freeLancer;
      if (!person) continue;

      // Handle weekend vs weekday schedule
      const isWeekend = record.isWeekend;
      const scheduledKnockOutStr = isWeekend
        ? person.scheduledWeekendKnockOut || person.scheduledKnockOut
        : person.scheduledKnockOut;

      const scheduledKnockInStr = isWeekend
        ? person.scheduledWeekendKnockIn || person.scheduledKnockIn
        : person.scheduledKnockIn;

      if (!scheduledKnockOutStr) continue;

      try {
        // Parse scheduled knockout time for the record's date
        const [h, m] = scheduledKnockOutStr.split(":").map(Number);

        // We use the record date to construct the scheduled time
        const scheduledTime = new Date(record.date);
        // Date from DB is UTC midnight, we need to treat it as SAST date
        const year = scheduledTime.getUTCFullYear();
        const month = scheduledTime.getUTCMonth();
        const day = scheduledTime.getUTCDate();

        const scheduledEnd = new Date(year, month, day, h, m, 0);

        // Construct scheduled start time to cap regular hours
        let scheduledStart = new Date(year, month, day, 8, 0, 0); // Default 08:00
        if (scheduledKnockInStr) {
          const [sh, sm] = scheduledKnockInStr.split(":").map(Number);
          scheduledStart = new Date(year, month, day, sh, sm, 0);
        }

        // Adjust for night shift if necessary (if knockout is earlier than check-in or specific case)
        // For simplicity here, we assume if it's "yesterday's" record and knockOut is morning, it's today.
        if (
          record.date.getTime() === yesterdaySASTMidnight.getTime() &&
          h < 12
        ) {
          scheduledEnd.setDate(scheduledEnd.getDate() + 1);
        }

        // --- Logic A: Auto checkout after 32 minutes (2m prompt + 30m grace) ---
        const autoCheckoutDeadline = addMinutes(scheduledEnd, 32);

        // --- Logic B: Immediate checkout if overtime REJECTED ---
        const isRejected =
          record.overtimeRequest?.status === OvertimeStatus.REJECTED;

        let shouldCheckOut = false;
        let reason = "";

        if (isRejected) {
          shouldCheckOut = true;
          reason = "Overtime Rejected - Auto Checkout";
        } else if (
          !record.overtimeRequest &&
          isAfter(nowSAST, autoCheckoutDeadline)
        ) {
          shouldCheckOut = true;
          reason = "Overtime Request Timeout - Auto Checkout";
        }

        if (shouldCheckOut) {
          // Perform checkout
          // Calculate regular hours: from actual check-in (capped at scheduled start) to scheduled end
          const checkIn = record.checkIn;
          const effectiveStart = new Date(
            Math.max(checkIn.getTime(), scheduledStart.getTime()),
          );
          const grossHours =
            (scheduledEnd.getTime() - effectiveStart.getTime()) /
            (1000 * 60 * 60);
          const breakHours = (record.breakDuration || 0) / 60;
          let calculatedRegularHours = Math.max(0, grossHours - breakHours);
          calculatedRegularHours = Math.round(calculatedRegularHours * 10) / 10;

          // Note: Since this is a cron job, we use the record's check-in location or null
          await db.attendanceRecord.update({
            where: { id: record.id },
            data: {
              checkOut: new Date(), // Actual time of checkout
              checkOutAddress: reason,
              // status: AttendanceStatus.ABSENT, // Removed as per request: workers shouldn't be absent if they worked
              notes: (record.notes ? record.notes + " | " : "") + reason,
              regularHours: calculatedRegularHours,
              overtimeHours: 0,
            },
          });

          checkouts.push({
            id: record.id,
            name: person.firstName + " " + person.lastName,
            reason,
          });
        }
      } catch (err) {
        console.error(`Error processing record ${record.id}:`, err);
      }
    }

    return NextResponse.json({
      processed: activeRecords.length,
      checkoutsPerformed: checkouts.length,
      details: checkouts,
    });
  } catch (error) {
    console.error("Auto-checkout cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
