import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  CheckInMethod,
  AttendanceStatus,
  EmployeeStatus,
  LeaveStatus,
} from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId,
      freelancerId,
      location,
      notes,
      method = CheckInMethod.MANUAL,
      lat,
      lng,
      address,
    } = body;

    if (!employeeId && !freelancerId) {
      return NextResponse.json(
        { error: "Employee ID or Freelancer ID is required" },
        { status: 400 },
      );
    }

    let person: any = null;
    let personType: "employee" | "freelancer" = "employee";

    // Find employee or freelancer
    if (employeeId) {
      person = await db.employee.findFirst({
        where: {
          OR: [{ id: employeeId }, { employeeNumber: employeeId }],
        },
      });
      personType = "employee";
    } else {
      person = await db.freeLancer.findFirst({
        where: {
          OR: [{ id: freelancerId }, { freeLancerNumber: freelancerId }],
        },
      });
      personType = "freelancer";
    }

    if (!person) {
      return NextResponse.json(
        {
          error: `${personType === "employee" ? "Employee" : "Freelancer"} not found`,
        },
        { status: 404 },
      );
    }

    // Get HR Settings
    const hrSettings = await db.hRSettings.findFirst();
    const overtimeThreshold = hrSettings?.overtimeThreshold || 8.0;
    const halfDayThreshold = hrSettings?.halfDayThreshold || 4.0;
    const workingHoursPerDay = hrSettings?.workingHoursPerDay || 8;
    const workingHoursOnWeekend = hrSettings?.workingHoursWeekend || 4;
    const overtimeHourRate = hrSettings?.overtimeHourRate || 50.0;

    // Weekend-specific overtime threshold
    const weekendOvertimeThreshold =
      hrSettings?.WeekendovertimeThreshold || workingHoursOnWeekend;

    // Debug: Log HR settings
    console.log("=== HR SETTINGS FROM DATABASE ===");
    console.log("overtimeThreshold:", overtimeThreshold);
    console.log("halfDayThreshold:", halfDayThreshold);
    console.log("WeekendovertimeThreshold:", weekendOvertimeThreshold);
    console.log("workingHoursPerDay:", workingHoursPerDay);
    console.log("workingHoursWeekend:", workingHoursOnWeekend);
    console.log("=================================");

    // ---------------------------------------------------------
    // 1. TIMEZONE CALCULATION (FIXED)
    // ---------------------------------------------------------
    const currentTime = new Date();

    // Calculate "Today" based on South African Calendar
    const sastFormatter = new Intl.DateTimeFormat("en-ZA", {
      timeZone: "Africa/Johannesburg",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour12: false,
    });

    const parts = sastFormatter.formatToParts(currentTime);
    const getDatePart = (type: string) =>
      parts.find((p) => p.type === type)?.value;

    const year = parseInt(getDatePart("year")!);
    const month = parseInt(getDatePart("month")!);
    const day = parseInt(getDatePart("day")!);

    // Create a Date object that represents 00:00 UTC on the South African day.
    const today = new Date(Date.UTC(year, month - 1, day));

    // ---------------------------------------------------------
    // 3. CHECK FOR ATTENDANCE BYPASS RULES
    // ---------------------------------------------------------
    const bypassResult = await checkAttendanceBypass(
      person.id,
      personType,
      today,
    );

    console.log(`=== CHECK-OUT BYPASS DEBUG ===`);
    console.log(`Person: ${personType} ${person.id}`);
    console.log(`Current Time (Instant): ${currentTime.toISOString()}`);
    console.log(`Today (Bucket): ${today.toISOString()}`);
    console.log(`Bypass result:`, bypassResult);

    // ---------------------------------------------------------
    // 4. FIND ACTIVE ATTENDANCE RECORD
    // ---------------------------------------------------------
    // Find the LATEST attendance record that doesn't have a checkout
    // This handles overnight shifts, late checkouts, and multi-day scenarios
    const attendanceRecord = await db.attendanceRecord.findFirst({
      where: {
        ...(personType === "employee"
          ? { employeeId: person.id }
          : { freeLancerId: person.id }),
        checkIn: { not: null }, // Must have checked in
        checkOut: null, // Must not be checked out already
      },
      orderBy: { date: "desc" }, // Get the most recent one
      include: {
        employee:
          personType === "employee"
            ? {
                select: {
                  scheduledKnockIn: true,
                  scheduledKnockOut: true,
                  scheduledWeekendKnockIn: true,
                  scheduledWeekendKnockOut: true,
                },
              }
            : false,
        freeLancer:
          personType === "freelancer"
            ? {
                select: {
                  scheduledKnockIn: true,
                  scheduledKnockOut: true,
                  scheduledWeekendKnockIn: true,
                  scheduledWeekendKnockOut: true,
                },
              }
            : false,
      },
    });

    if (!attendanceRecord) {
      console.log(`No active check-in found for ${personType} ${person.id}`);
      return NextResponse.json(
        { error: "No active check-in found" },
        { status: 400 },
      );
    }

    console.log(
      `Found attendance record: ${attendanceRecord.id}, date: ${attendanceRecord.date}, checkIn: ${attendanceRecord.checkIn}`,
    );

    // Determine if this is a night shift
    const isNightShift =
      attendanceRecord.date.toISOString() !== today.toISOString();

    if (attendanceRecord.checkOut) {
      return NextResponse.json(
        {
          error: `${personType === "employee" ? "Employee" : "Freelancer"} already checked out`,
        },
        { status: 400 },
      );
    }

    // Ensure the record has a check-in time
    if (!attendanceRecord.checkIn) {
      return NextResponse.json(
        { error: "Invalid attendance record: missing check-in time" },
        { status: 400 },
      );
    }

    const checkInTime = attendanceRecord.checkIn;

    // ---------------------------------------------------------
    // 5. DETERMINE SCHEDULE (PRIORITY: BYPASS > WEEKEND > NORMAL)
    // ---------------------------------------------------------
    // We need to know if it's a weekend relative to the Check-In date
    const checkInDayName = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][
      new Date(checkInTime.getTime() + 2 * 60 * 60 * 1000).getUTCDay()
    ];
    const isWeekend = checkInDayName === "SAT" || checkInDayName === "SUN";

    let scheduledKnockInTime: string | null = null;
    let scheduledKnockOutTime: string | null = null;

    // A. PRIORITY 1: BYPASS TIME (Schedule Override)
    if (
      bypassResult.bypassCheckOut &&
      bypassResult.customCheckOutTime &&
      bypassResult.customCheckOutTime !== "none"
    ) {
      scheduledKnockOutTime = bypassResult.customCheckOutTime;
      // Use original Knock-In unless it was also bypassed (stored in record)
      scheduledKnockInTime =
        attendanceRecord.scheduledKnockIn ||
        (isWeekend
          ? person.scheduledWeekendKnockIn || person.scheduledKnockIn
          : person.scheduledKnockIn);

      console.log(
        `Schedule Override: Using Bypass Time ${scheduledKnockOutTime} as Knock-Out Schedule`,
      );
    }
    // B. PRIORITY 2: STANDARD SCHEDULE
    else {
      if (isWeekend) {
        scheduledKnockInTime =
          person.scheduledWeekendKnockIn || person.scheduledKnockIn;
        scheduledKnockOutTime =
          person.scheduledWeekendKnockOut || person.scheduledKnockOut;
      } else {
        scheduledKnockInTime = person.scheduledKnockIn;
        scheduledKnockOutTime = person.scheduledKnockOut;
      }
    }

    // ---------------------------------------------------------
    // 6. CALCULATE HOURS AND STATUS
    // ---------------------------------------------------------
    let checkOutTimeToUse: Date = currentTime;
    let customCheckOutTimeUsed: string | null = null;
    let bypassApplied = false;

    if (bypassResult.bypassCheckOut) {
      bypassApplied = true;
      if (
        bypassResult.customCheckOutTime &&
        bypassResult.customCheckOutTime !== "none"
      ) {
        customCheckOutTimeUsed = bypassResult.customCheckOutTime;
        // We do NOT overwrite checkOutTimeToUse with custom time.
        // We keep 'currentTime' as the actual check-out time.
        // The custom time became the 'scheduledKnockOutTime' above.
      }
    }

    // Temporarily inject the overridden schedule into the person object
    // so the calculation function uses it.
    const personWithOverride = {
      ...person,
      scheduledKnockIn: scheduledKnockInTime,
      scheduledKnockOut: scheduledKnockOutTime,
      // Clear weekend props so logic defaults to the main props we just set
      scheduledWeekendKnockIn: null,
      scheduledWeekendKnockOut: null,
    };

    const { regularHours, overtimeHours, newStatus, workedPercentage } =
      await calculateHoursAndStatus(
        personWithOverride,
        checkInTime,
        checkOutTimeToUse,
        attendanceRecord.status,
        isNightShift,
        hrSettings,
        attendanceRecord.breakDuration || 0,
      );

    // Apply Generic Bypass (Force Present) if no custom time
    let finalStatus = newStatus;
    const isGenericBypass =
      bypassResult.bypassCheckOut &&
      (!bypassResult.customCheckOutTime ||
        bypassResult.customCheckOutTime === "none");

    if (isGenericBypass) {
      finalStatus = AttendanceStatus.PRESENT;
      console.log("Generic Bypass: Forcing PRESENT status");
    }

    // ---------------------------------------------------------
    // CHECK FOR APPROVED OVERTIME REQUEST
    // ---------------------------------------------------------
    // Only count overtime hours if there's an approved overtime request
    let finalOvertimeHours = 0;
    let overtimePay = 0;

    if (overtimeHours > 0) {
      // Check if there's an approved overtime request for this attendance record
      const overtimeRequest = await db.overtimeRequest.findFirst({
        where: {
          ...(personType === "employee"
            ? { employeeId: person.id }
            : { freelancerId: person.id }),
          date: attendanceRecord.date,
          status: "APPROVED",
        },
      });

      if (overtimeRequest) {
        // Overtime is approved, calculate it
        finalOvertimeHours = overtimeHours;
        if (personType === "employee") {
          overtimePay = overtimeHours * overtimeHourRate;
          console.log(
            `Overtime APPROVED: ${overtimeHours}h * R${overtimeHourRate} = R${overtimePay}`,
          );
        }
      } else {
        // No approved overtime, those hours won't be counted as overtime
        console.log(
          `Overtime NOT APPROVED: ${overtimeHours}h will not be counted as overtime`,
        );
        // finalOvertimeHours stays 0
      }
    }

    // Prepare Notes
    let statusNotes = notes || attendanceRecord.notes || "";

    if (bypassApplied) {
      if (customCheckOutTimeUsed) {
        statusNotes +=
          (statusNotes ? " | " : "") +
          `Schedule changed to ${customCheckOutTimeUsed} by Bypass`;
      } else {
        statusNotes +=
          (statusNotes ? " | " : "") +
          `Bypass applied: Time restrictions bypassed`;
      }
    }

    if (finalStatus !== attendanceRecord.status) {
      if (finalStatus === AttendanceStatus.HALF_DAY) {
        statusNotes +=
          (statusNotes ? " | " : "") +
          `Auto-status: Half Day (${workedPercentage.toFixed(0)}% of schedule)`;
      } else if (finalStatus === AttendanceStatus.ABSENT) {
        statusNotes +=
          (statusNotes ? " | " : "") +
          `Auto-status: Absent (${workedPercentage.toFixed(0)}% of schedule)`;
      }
    }

    if (finalOvertimeHours > 0) {
      statusNotes +=
        (statusNotes ? " | " : "") +
        `Overtime: ${finalOvertimeHours.toFixed(1)}h`;
      if (overtimePay > 0) {
        statusNotes += ` (Pay: R${overtimePay.toFixed(2)})`;
      }
    }

    // ---------------------------------------------------------
    // 7. WARNINGS
    // ---------------------------------------------------------
    let warningCreated = null;
    if (
      finalStatus === AttendanceStatus.ABSENT &&
      personType === "employee" &&
      !isGenericBypass // Don't warn if generic bypass is active
    ) {
      warningCreated = await checkAndCreateAbsentWarning(
        person.id,
        checkOutTimeToUse,
        finalStatus,
        false,
      );
    }

    // ---------------------------------------------------------
    // 8. UPDATE RECORD
    // ---------------------------------------------------------
    const updateData: any = {
      checkOut: checkOutTimeToUse,
      checkOutAddress: location || address,
      checkOutLat: (() => {
        if (lat === undefined || lat === null) return null;
        const p = parseFloat(lat.toString());
        return isNaN(p) ? null : p;
      })(),
      checkOutLng: (() => {
        if (lng === undefined || lng === null) return null;
        const p = parseFloat(lng.toString());
        return isNaN(p) ? null : p;
      })(),
      regularHours,
      overtimeHours: finalOvertimeHours, // Use approved overtime hours only
      status: finalStatus,
      notes: statusNotes,
      bypassApplied: bypassApplied || attendanceRecord.bypassApplied,
      bypassRuleId: bypassResult.rule?.id || attendanceRecord.bypassRuleId,
    };

    // If we changed the schedule via bypass, update the record's scheduled time
    // so the history reflects why they weren't marked early/late
    if (scheduledKnockOutTime) {
      updateData.scheduledKnockOut = scheduledKnockOutTime;
    }

    const updatedRecord = await db.attendanceRecord.update({
      where: { id: attendanceRecord.id },
      data: updateData,
      include: {
        employee:
          personType === "employee"
            ? {
                include: {
                  department: true,
                },
              }
            : false,
        freeLancer:
          personType === "freelancer"
            ? {
                include: {
                  department: true,
                },
              }
            : false,
      },
    });

    // Check if we should create absent records (only for employees)
    let shouldCreateAbsentRecords = false;
    if (personType === "employee" && !bypassApplied) {
      shouldCreateAbsentRecords =
        await checkAndCreateAbsentRecords(workedPercentage);
    }

    return NextResponse.json({
      message: "Check-out recorded successfully",
      record: updatedRecord,
      regularHours,
      overtimeHours: finalOvertimeHours,
      overtimePay: overtimePay > 0 ? overtimePay : null,
      status: finalStatus,
      workedPercentage: Math.round(workedPercentage),
      hasOvertime: finalOvertimeHours > 0,
      warning: warningCreated,
      triggeredAbsentCreation: shouldCreateAbsentRecords,
      personType,
      bypassApplied: bypassApplied,
      customCheckOutTime: customCheckOutTimeUsed,
      actualCheckOutTime: checkOutTimeToUse.toISOString(),
      isNightShift: isNightShift,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ------------------------------------------------------------------
// ATTENDANCE BYPASS CHECK FUNCTION
// ------------------------------------------------------------------
async function checkAttendanceBypass(
  assigneeId: string,
  assigneeType: "employee" | "freelancer",
  date: Date,
): Promise<{
  hasBypass: boolean;
  bypassCheckIn: boolean;
  bypassCheckOut: boolean;
  customCheckInTime?: string | null;
  customCheckOutTime?: string | null;
  rule?: any;
}> {
  try {
    const today = new Date(date);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      AND: [{ startDate: { lte: tomorrow } }, { endDate: { gte: today } }],
    };

    if (assigneeType === "employee") {
      where.employees = { some: { id: assigneeId } };
    } else {
      where.freelancers = { some: { id: assigneeId } };
    }

    const bypassRule = await db.attendanceBypassRule.findFirst({
      where,
      include: {
        employees:
          assigneeType === "employee"
            ? {
                select: { id: true },
              }
            : false,
        freelancers:
          assigneeType === "freelancer"
            ? {
                select: { id: true },
              }
            : false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!bypassRule) {
      return {
        hasBypass: false,
        bypassCheckIn: false,
        bypassCheckOut: false,
      };
    }

    return {
      hasBypass: true,
      bypassCheckIn: bypassRule.bypassCheckIn,
      bypassCheckOut: bypassRule.bypassCheckOut,
      customCheckInTime: bypassRule.customCheckInTime,
      customCheckOutTime: bypassRule.customCheckOutTime,
      rule: bypassRule,
    };
  } catch (error) {
    console.error("Error checking attendance bypass:", error);
    return {
      hasBypass: false,
      bypassCheckIn: false,
      bypassCheckOut: false,
    };
  }
}

// ------------------------------------------------------------------
// CALCULATE HOURS AND STATUS
// ------------------------------------------------------------------
async function calculateHoursAndStatus(
  person: any,
  checkInTime: Date,
  checkOutTime: Date,
  currentStatus: AttendanceStatus,
  isNightShift: boolean = false,
  hrSettings?: any,
  breakDurationMinutes: number = 0,
): Promise<{
  regularHours: number;
  overtimeHours: number;
  newStatus: AttendanceStatus;
  workedPercentage: number;
}> {
  let regularHours = 0;
  let overtimeHours = 0;
  let newStatus = currentStatus;
  let workedPercentage = 0;

  // Get HR settings with defaults
  const overtimeThreshold = hrSettings?.overtimeThreshold || 8.0;
  const halfDayThreshold = hrSettings?.halfDayThreshold || 4.0;
  const workingHoursWeekend = hrSettings?.workingHoursWeekend || 4;
  const workingHoursPerDay = hrSettings?.workingHoursPerDay || 8;

  // Weekend-specific overtime threshold
  const weekendOvertimeThreshold =
    hrSettings?.WeekendovertimeThreshold || workingHoursWeekend;

  const grossHoursWorked =
    (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

  const actualHoursWorked = grossHoursWorked - breakDurationMinutes / 60;

  console.log(`Calculate hours:`, {
    checkInTime: checkInTime.toISOString(),
    checkOutTime: checkOutTime.toISOString(),
    grossHoursWorked: grossHoursWorked.toFixed(2),
    breakDurationMinutes,
    actualHoursWorked: actualHoursWorked.toFixed(2),
  });

  // Determine if it's weekend based on SAST timezone
  const sastFormatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "short",
  });
  const checkInDay = sastFormatter.format(checkInTime).toUpperCase();
  const isWeekend = checkInDay === "SAT" || checkInDay === "SUN";

  // Use appropriate working hours for the day type
  const workingHoursForDay = isWeekend
    ? workingHoursWeekend
    : workingHoursPerDay;

  // Use weekend-specific thresholds for weekends
  const effectiveOvertimeThreshold = isWeekend
    ? weekendOvertimeThreshold
    : overtimeThreshold;

  console.log(`Day info:`, {
    isWeekend,
    checkInDay,
    workingHoursForDay,
    effectiveOvertimeThreshold,
    halfDayThreshold,
  });

  // Get scheduled times
  let scheduledKnockInTime: string | null = null;
  let scheduledKnockOutTime: string | null = null;

  if (isWeekend) {
    scheduledKnockInTime =
      person.scheduledWeekendKnockIn ?? person.scheduledKnockIn ?? null;
    scheduledKnockOutTime =
      person.scheduledWeekendKnockOut ?? person.scheduledKnockOut ?? null;
  } else {
    scheduledKnockInTime = person.scheduledKnockIn ?? null;
    scheduledKnockOutTime = person.scheduledKnockOut ?? null;
  }

  if (scheduledKnockInTime && scheduledKnockOutTime) {
    const [startHours, startMinutes] = scheduledKnockInTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = scheduledKnockOutTime.split(":").map(Number);

    // Create Schedule dates relative to CheckIn Time (using SAST offset +02:00)
    const dateStr = checkInTime.toISOString().split("T")[0];
    const scheduleStartStr = `${dateStr}T${String(startHours).padStart(
      2,
      "0",
    )}:${String(startMinutes).padStart(2, "0")}:00+02:00`;
    const scheduleEndStr = `${dateStr}T${String(endHours).padStart(
      2,
      "0",
    )}:${String(endMinutes).padStart(2, "0")}:00+02:00`;

    const scheduledStartTime = new Date(scheduleStartStr);
    const scheduledEndTime = new Date(scheduleEndStr);

    // Handle night shifts and schedules that cross midnight
    if (endHours <= startHours || isNightShift) {
      if (endHours < startHours && endHours < 12) {
        scheduledEndTime.setDate(scheduledEndTime.getDate() + 1);
      } else if (isNightShift && startHours >= 18) {
        scheduledEndTime.setDate(scheduledEndTime.getDate() + 1);
      }
    }

    const scheduledHours =
      (scheduledEndTime.getTime() - scheduledStartTime.getTime()) /
      (1000 * 60 * 60);

    console.log(`Schedule details:`, {
      scheduledStartTime: scheduledStartTime.toISOString(),
      scheduledEndTime: scheduledEndTime.toISOString(),
      scheduledHours: scheduledHours.toFixed(2),
      isNightShift,
    });

    const totalHoursWorked = actualHoursWorked;

    // Calculate hours and status based on schedule
    console.log(
      `Overtime check: ${totalHoursWorked.toFixed(2)} > ${effectiveOvertimeThreshold}?`,
    );

    if (totalHoursWorked > effectiveOvertimeThreshold) {
      console.log("OVERTIME DETECTED");
      regularHours = effectiveOvertimeThreshold;
      overtimeHours = totalHoursWorked - effectiveOvertimeThreshold;
      newStatus = currentStatus; // Keep current status (usually PRESENT)
      workedPercentage = 100;
    } else {
      console.log("NO OVERTIME - Checking status...");
      regularHours = totalHoursWorked;
      overtimeHours = 0;

      if (scheduledHours > 0) {
        workedPercentage = (totalHoursWorked / scheduledHours) * 100;

        // NEW LOGIC: Check if checked out BEFORE scheduled knock-out time
        const checkOutDateTime = new Date(checkOutTime);
        const scheduledEndDateTime = new Date(scheduledEndTime);

        console.log(`Checking if checked out early:`, {
          checkOutTime: checkOutDateTime.toISOString(),
          scheduledEndTime: scheduledEndDateTime.toISOString(),
          isEarly: checkOutDateTime < scheduledEndDateTime,
        });

        // If checked out BEFORE scheduled end time, mark as ABSENT
        if (checkOutDateTime < scheduledEndDateTime) {
          console.log(
            `EARLY CHECK-OUT: Marking as ABSENT (checked out before scheduled time)`,
          );
          newStatus = AttendanceStatus.ABSENT;
        }
        // Otherwise, check normal thresholds
        else if (totalHoursWorked >= halfDayThreshold) {
          console.log(
            `Normal check: ${totalHoursWorked.toFixed(2)} >= ${halfDayThreshold}`,
          );
          newStatus = currentStatus; // PRESENT (worked full schedule)
        } else {
          console.log(
            `UNDER HALF DAY: ${totalHoursWorked.toFixed(2)} < ${halfDayThreshold}`,
          );
          newStatus = AttendanceStatus.ABSENT;
        }
      } else {
        // No schedule - use threshold-based logic
        workedPercentage = (totalHoursWorked / workingHoursForDay) * 100;

        if (totalHoursWorked >= halfDayThreshold) {
          newStatus = currentStatus;
        } else {
          newStatus = AttendanceStatus.ABSENT;
        }
      }

      console.log(`Worked percentage: ${workedPercentage.toFixed(2)}%`);
    }
  } else {
    // No schedule set - use thresholds only
    console.log("NO SCHEDULE SET - Using threshold-based logic");
    const totalHoursWorked = actualHoursWorked;

    console.log(
      `Overtime check: ${totalHoursWorked.toFixed(2)} > ${effectiveOvertimeThreshold}?`,
    );
    if (totalHoursWorked > effectiveOvertimeThreshold) {
      console.log("OVERTIME DETECTED (no schedule)");
      regularHours = effectiveOvertimeThreshold;
      overtimeHours = totalHoursWorked - effectiveOvertimeThreshold;
      newStatus = currentStatus;
      workedPercentage = 100;
    } else {
      console.log("NO OVERTIME - Checking status (no schedule)...");
      regularHours = totalHoursWorked;
      overtimeHours = 0;
      workedPercentage = (totalHoursWorked / workingHoursForDay) * 100;

      // Use halfDayThreshold for status determination
      if (totalHoursWorked >= halfDayThreshold) {
        newStatus = currentStatus;
      } else {
        newStatus = AttendanceStatus.ABSENT;
      }

      console.log(
        `Status check: ${totalHoursWorked.toFixed(2)} >= ${halfDayThreshold} ?`,
      );
    }
  }

  // Round hours to 1 decimal place
  regularHours = Math.round(regularHours * 10) / 10;
  overtimeHours = Math.round(overtimeHours * 10) / 10;

  console.log(`=== CALCULATION RESULTS ===`);
  console.log({
    regularHours,
    overtimeHours,
    newStatus,
    workedPercentage: Math.round(workedPercentage),
    isWeekend,
    effectiveOvertimeThreshold,
    halfDayThreshold,
    scheduledKnockInTime,
    scheduledKnockOutTime,
  });
  console.log(`==========================`);

  return { regularHours, overtimeHours, newStatus, workedPercentage };
}

// ------------------------------------------------------------------
// HELPER: Absent Warning
// ------------------------------------------------------------------
async function checkAndCreateAbsentWarning(
  employeeId: string,
  currentTime: Date,
  status: AttendanceStatus,
  isAutoCreated: boolean = false,
): Promise<any> {
  try {
    if (status !== AttendanceStatus.ABSENT) {
      return null;
    }

    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1),
    ); // UTC Midnight Month Start

    const monthlyAbsentCount = await db.attendanceRecord.count({
      where: {
        employeeId: employeeId,
        status: AttendanceStatus.ABSENT,
        date: {
          gte: startOfMonth,
          lte: currentTime,
        },
      },
    });

    let warningType = "";
    let severity = "";
    let reason = "";
    let actionPlan = "";

    if (monthlyAbsentCount === 1) {
      warningType = "Attendance";
      severity = "LOW";
      reason = `First absent day this month.`;
      if (isAutoCreated) reason += " (Auto-detected: No check-in recorded)";
      actionPlan =
        "Please ensure regular attendance. Absences should be properly requested as leave.";
    } else if (monthlyAbsentCount === 2) {
      warningType = "Attendance";
      severity = "MEDIUM";
      reason = `Second absent day this month.`;
      if (isAutoCreated) reason += " (Auto-detected: No check-in recorded)";
      actionPlan =
        "This is concerning attendance pattern. Please discuss with your manager.";
    } else if (monthlyAbsentCount >= 3) {
      warningType = "Attendance";
      severity = "HIGH";
      reason = `Third absent day this month.`;
      if (isAutoCreated) reason += " (Auto-detected: No check-in recorded)";
      actionPlan =
        "Formal warning for persistent absenteeism. Immediate improvement required.";
    }

    if (warningType) {
      const warning = await db.warning.create({
        data: {
          employeeId: employeeId,
          type: warningType,
          severity: severity,
          reason: reason,
          actionPlan: actionPlan,
          date: currentTime,
          status: "ACTIVE",
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeNumber: true,
            },
          },
        },
      });

      await db.employeeNotification.create({
        data: {
          employeeId: employeeId,
          title: "Absence Warning Issued",
          message: `${reason} (Severity: ${severity})`,
          type: "WARNING",
          isRead: false,
          actionUrl: `/dashboard/warnings/${warning.id}`,
        },
      });

      return warning;
    }

    return null;
  } catch (error) {
    console.error("Error creating absent warning:", error);
    return null;
  }
}

// ------------------------------------------------------------------
// HELPER: Auto Absent Records
// ------------------------------------------------------------------
async function checkAndCreateAbsentRecords(
  currentEmployeeWorkedPercentage: number,
): Promise<boolean> {
  try {
    const now = new Date();
    const sastFormatter = new Intl.DateTimeFormat("en-ZA", {
      timeZone: "Africa/Johannesburg",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = sastFormatter.formatToParts(now);
    const getP = (t: string) => parts.find((p) => p.type === t)?.value;
    const today = new Date(
      Date.UTC(
        parseInt(getP("year")!),
        parseInt(getP("month")!) - 1,
        parseInt(getP("day")!),
      ),
    );

    const employeesWorkedOver50 = await db.attendanceRecord.findMany({
      where: {
        date: today,
        checkOut: { not: null },
        regularHours: { gt: 0 },
        employeeId: { not: null },
      },
      include: {
        employee: {
          select: {
            scheduledKnockIn: true,
            scheduledKnockOut: true,
            scheduledWeekendKnockIn: true,
            scheduledWeekendKnockOut: true,
          },
        },
      },
    });

    let someoneWorkedOver50 = false;

    for (const record of employeesWorkedOver50) {
      const recordDay = new Date(record.date);
      const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const recordDayName = dayNames[recordDay.getUTCDay()];
      const isWeekend = recordDayName === "SAT" || recordDayName === "SUN";

      let scheduledKnockInTime: string | null = null;
      let scheduledKnockOutTime: string | null = null;

      if (isWeekend) {
        scheduledKnockInTime =
          record.employee?.scheduledWeekendKnockIn ??
          record.employee?.scheduledKnockIn ??
          null;
        scheduledKnockOutTime =
          record.employee?.scheduledWeekendKnockOut ??
          record.employee?.scheduledKnockOut ??
          null;
      } else {
        scheduledKnockInTime = record.employee?.scheduledKnockIn ?? null;
        scheduledKnockOutTime = record.employee?.scheduledKnockOut ?? null;
      }

      if (scheduledKnockInTime && scheduledKnockOutTime) {
        const [startHours, startMinutes] = scheduledKnockInTime
          .split(":")
          .map(Number);
        const [endHours, endMinutes] = scheduledKnockOutTime
          .split(":")
          .map(Number);

        const scheduledStartTime = new Date(record.checkIn!);
        scheduledStartTime.setHours(startHours, startMinutes, 0, 0);

        const scheduledEndTime = new Date(record.checkIn!);
        scheduledEndTime.setHours(endHours, endMinutes, 0, 0);

        if (scheduledEndTime <= scheduledStartTime) {
          scheduledEndTime.setDate(scheduledEndTime.getDate() + 1);
        }

        const scheduledHours =
          (scheduledEndTime.getTime() - scheduledStartTime.getTime()) /
          (1000 * 60 * 60);
        const workedPercentage =
          (Number(record.regularHours!) / scheduledHours) * 100;

        if (workedPercentage >= 50) {
          someoneWorkedOver50 = true;
          break;
        }
      }
    }

    const shouldCreate =
      currentEmployeeWorkedPercentage >= 50 || someoneWorkedOver50;

    if (shouldCreate) {
      console.log("Creating absent records - condition met:", {
        currentEmployeePercentage: currentEmployeeWorkedPercentage,
        someoneElseWorkedOver50: someoneWorkedOver50,
      });
      await createAbsentRecords();
      return true;
    } else {
      console.log("Skipping absent records - no one worked over 50% yet");
      return false;
    }
  } catch (error) {
    console.error("Error checking absent record condition:", error);
    return false;
  }
}

async function createAbsentRecords() {
  try {
    const now = new Date();
    const sastFormatter = new Intl.DateTimeFormat("en-ZA", {
      timeZone: "Africa/Johannesburg",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = sastFormatter.formatToParts(now);
    const getP = (t: string) => parts.find((p) => p.type === t)?.value;
    const today = new Date(
      Date.UTC(
        parseInt(getP("year")!),
        parseInt(getP("month")!) - 1,
        parseInt(getP("day")!),
      ),
    );

    console.log(
      "Auto-attendance: Creating absent records for EMPLOYEES who didn't check in...",
    );

    const activeEmployeesWithoutRecords = await db.employee.findMany({
      where: {
        status: EmployeeStatus.ACTIVE,
        NOT: {
          AttendanceRecord: {
            some: {
              date: today,
            },
          },
        },
      },
      include: {
        department: true,
        leaveRequests: {
          where: {
            startDate: { lte: today },
            endDate: { gte: today },
            status: LeaveStatus.APPROVED,
          },
        },
      },
    });

    const createdRecords = [];
    const createdWarnings = [];

    for (const employee of activeEmployeesWithoutRecords) {
      try {
        const hasApprovedLeave = employee.leaveRequests.length > 0;
        if (hasApprovedLeave) {
          console.log(`Skipping ${employee.firstName} - has approved leave`);
          continue;
        }

        const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const todayDay = dayNames[today.getUTCDay()];
        const workingDays = Array.isArray(employee.workingDays)
          ? employee.workingDays
          : employee.workingDays
            ? JSON.parse(employee.workingDays)
            : [];

        const isWorkingDay = workingDays.includes(todayDay);

        if (!isWorkingDay) {
          console.log(
            `Skipping ${employee.firstName} - not a working day (${todayDay})`,
          );
          continue;
        }

        const isWeekend = todayDay === "SAT" || todayDay === "SUN";
        let scheduledKnockInTime: string | null = null;
        let scheduledKnockOutTime: string | null = null;

        if (isWeekend) {
          scheduledKnockInTime =
            employee.scheduledWeekendKnockIn ??
            employee.scheduledKnockIn ??
            null;
          scheduledKnockOutTime =
            employee.scheduledWeekendKnockOut ??
            employee.scheduledKnockOut ??
            null;
        } else {
          scheduledKnockInTime = employee.scheduledKnockIn ?? null;
          scheduledKnockOutTime = employee.scheduledKnockOut ?? null;
        }

        const attendanceRecord = await db.attendanceRecord.create({
          data: {
            employeeId: employee.id,
            date: today,
            status: AttendanceStatus.ABSENT,
            scheduledKnockIn: scheduledKnockInTime,
            scheduledKnockOut: scheduledKnockOutTime,
            isWeekend: isWeekend,
            notes: "Auto-created: Absent - No check-in recorded",
          },
        });

        createdRecords.push({
          id: attendanceRecord.id,
          employee: `${employee.firstName} ${employee.lastName}`,
          status: attendanceRecord.status,
          isWeekend: isWeekend,
        });

        console.log(
          `Auto-attendance: Created absent record for EMPLOYEE ${employee.firstName} ${employee.lastName} (${isWeekend ? "WEEKEND" : "WEEKDAY"})`,
        );

        const warning = await checkAndCreateAbsentWarning(
          employee.id,
          today,
          AttendanceStatus.ABSENT,
          true,
        );

        if (warning) {
          createdWarnings.push(warning);
          console.log(
            `Auto-attendance: Created warning for auto-created absent record for ${employee.firstName} ${employee.lastName}`,
          );
        }
      } catch (error) {
        console.error(
          `Auto-attendance: Error processing employee ${employee.id}:`,
          error,
        );
      }
    }

    console.log(
      `Auto-attendance: Completed. Created ${createdRecords.length} EMPLOYEE absent records and ${createdWarnings.length} warnings.`,
    );
    return createdRecords.length > 0;
  } catch (error) {
    console.error("Auto-attendance for absent employees: Failed:", error);
    throw error;
  }
}
