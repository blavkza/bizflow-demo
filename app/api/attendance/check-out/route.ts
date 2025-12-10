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
        { status: 400 }
      );
    }

    let person: any = null;
    let personType: "employee" | "freelancer" = "employee";

    // Find employee or freelancer
    if (employeeId) {
      person = await db.employee.findUnique({
        where: { employeeNumber: employeeId },
      });
      personType = "employee";
    } else {
      person = await db.freeLancer.findUnique({
        where: { freeLancerNumber: freelancerId },
      });
      personType = "freelancer";
    }

    if (!person) {
      return NextResponse.json(
        {
          error: `${personType === "employee" ? "Employee" : "Freelancer"} not found`,
        },
        { status: 404 }
      );
    }

    // Get HR Settings
    const hrSettings = await db.hRSettings.findFirst();
    const overtimeThreshold = hrSettings?.overtimeThreshold || 8.0;
    const halfDayThreshold = hrSettings?.halfDayThreshold || 4.0;
    const workingHoursPerDay = hrSettings?.workingHoursPerDay || 8;
    const overtimeHourRate = hrSettings?.overtimeHourRate || 50.0;

    // Get current time in South Africa timezone (UTC+2)
    const nowUTC = new Date();
    const southAfricaOffset = 2 * 60 * 60 * 1000;
    const currentTime = new Date(nowUTC.getTime() + southAfricaOffset);

    // Create today's date in South Africa timezone
    const today = new Date(currentTime);
    today.setHours(0, 0, 0, 0);

    // ---------------------------------------------------------
    // CHECK FOR ATTENDANCE BYPASS RULES
    // ---------------------------------------------------------
    const bypassResult = await checkAttendanceBypass(
      person.id,
      personType,
      currentTime
    );

    console.log(`=== CHECK-OUT BYPASS DEBUG ===`);
    console.log(`Person: ${personType} ${person.id}`);
    console.log(`Current time SAST: ${currentTime.toISOString()}`);
    console.log(`Today SAST: ${today.toISOString()}`);
    console.log(`Bypass result:`, bypassResult);
    console.log(`HR Settings:`, {
      overtimeThreshold,
      halfDayThreshold,
      workingHoursPerDay,
      overtimeHourRate,
    });

    // ---------------------------------------------------------
    // FIND ACTIVE ATTENDANCE RECORD (SUPPORT NIGHT SHIFTS)
    // ---------------------------------------------------------
    // Get yesterday's date for night shift checking
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayUTC = new Date(yesterday);
    yesterdayUTC.setHours(yesterdayUTC.getHours() - 2);

    const todayUTC = new Date(today);
    todayUTC.setHours(todayUTC.getHours() - 2);

    // Find active records from today OR yesterday (for night shifts)
    const attendanceRecords = await db.attendanceRecord.findMany({
      where: {
        ...(personType === "employee"
          ? { employeeId: person.id }
          : { freeLancerId: person.id }),
        OR: [
          // Check for record from today
          { date: todayUTC },
          // Also check for record from yesterday (for night shifts)
          {
            date: yesterdayUTC,
            checkOut: null, // Only if not checked out yet
          },
        ],
        checkOut: null, // Must not be checked out already
      },
      orderBy: {
        date: "desc", // Get most recent first
      },
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

    // Find the most recent record that hasn't been checked out
    let attendanceRecord = null;
    for (const record of attendanceRecords) {
      if (!record.checkOut) {
        attendanceRecord = record;
        break;
      }
    }

    if (!attendanceRecord) {
      return NextResponse.json(
        { error: "No active check-in found" },
        { status: 400 }
      );
    }

    // Determine if this is a night shift (check-in from previous day)
    const recordDateSAST = new Date(attendanceRecord.date);
    recordDateSAST.setHours(recordDateSAST.getHours() + 2); // Convert back to SAST

    const isNightShift = recordDateSAST.getDate() !== today.getDate();

    console.log(`Record analysis:`, {
      recordDateUTC: attendanceRecord.date,
      recordDateSAST: recordDateSAST.toISOString(),
      todaySAST: today.toISOString(),
      isNightShift: isNightShift,
    });

    if (attendanceRecord.checkOut) {
      return NextResponse.json(
        {
          error: `${personType === "employee" ? "Employee" : "Freelancer"} already checked out`,
        },
        { status: 400 }
      );
    }

    const checkInTime = attendanceRecord.checkIn!;

    // ---------------------------------------------------------
    // BYPASS LOGIC FOR CHECK-OUT
    // ---------------------------------------------------------
    let checkOutTimeToUse: Date = currentTime;
    let customCheckOutTimeUsed: string | null = null;
    let bypassApplied = false;

    // If bypass is enabled for check-out, use custom time if specified
    if (bypassResult.bypassCheckOut) {
      bypassApplied = true;

      if (
        bypassResult.customCheckOutTime &&
        bypassResult.customCheckOutTime !== "none"
      ) {
        customCheckOutTimeUsed = bypassResult.customCheckOutTime;
        console.log(
          `Using custom check-out time: ${customCheckOutTimeUsed} for ${personType} ${person.id}`
        );

        const [hours, minutes] = customCheckOutTimeUsed.split(":").map(Number);

        // Create check-out time based on the appropriate date
        // For night shifts ending in the morning, use today's date
        checkOutTimeToUse = new Date(today);
        checkOutTimeToUse.setHours(hours, minutes, 0, 0);

        // Adjust for night shifts
        if (isNightShift && hours < 12) {
          // Night shift ending in the morning, time is correct
          console.log(`Night shift check-out at ${customCheckOutTimeUsed}`);
        }

        console.log(`Custom check-out time set:`, {
          customTime: customCheckOutTimeUsed,
          checkOutTime: checkOutTimeToUse.toISOString(),
          isNightShift: isNightShift,
        });
      } else {
        console.log(
          `Using current time for check-out with bypass: ${currentTime.toISOString()}`
        );
      }
    }

    // Calculate hours and determine new status USING HR SETTINGS
    const { regularHours, overtimeHours, newStatus, workedPercentage } =
      await calculateHoursAndStatus(
        person,
        checkInTime,
        checkOutTimeToUse,
        attendanceRecord.status,
        isNightShift,
        hrSettings
      );

    // Calculate overtime pay if applicable
    let overtimePay = 0;
    if (overtimeHours > 0 && personType === "employee") {
      overtimePay = overtimeHours * overtimeHourRate;
      console.log(
        `Overtime pay calculated: ${overtimeHours}h × ${overtimeHourRate} = R${overtimePay.toFixed(2)}`
      );
    }

    // Update status based on worked percentage
    let finalStatus = newStatus;
    let statusNotes = notes || attendanceRecord.notes || "";

    // Add bypass info to notes if applied
    if (bypassApplied) {
      if (customCheckOutTimeUsed) {
        statusNotes +=
          (statusNotes ? " | " : "") +
          `Bypass applied: Custom check-out time ${customCheckOutTimeUsed}`;
      } else {
        statusNotes +=
          (statusNotes ? " | " : "") +
          `Bypass applied: Time restrictions bypassed`;
      }
    }

    // Add auto-status change note
    if (finalStatus !== attendanceRecord.status) {
      if (finalStatus === AttendanceStatus.HALF_DAY) {
        statusNotes +=
          (statusNotes ? " | " : "") +
          `Auto-status: Half Day (worked ${workedPercentage.toFixed(0)}% of schedule)`;
      } else if (finalStatus === AttendanceStatus.ABSENT) {
        statusNotes +=
          (statusNotes ? " | " : "") +
          `Auto-status: Absent (worked only ${workedPercentage.toFixed(0)}% of schedule)`;
      }
    }

    // Add overtime note if applicable
    if (overtimeHours > 0) {
      statusNotes +=
        (statusNotes ? " | " : "") + `Overtime: ${overtimeHours.toFixed(1)}h`;
      if (overtimePay > 0) {
        statusNotes += ` (Pay: R${overtimePay.toFixed(2)})`;
      }
    }

    // Check for absent warnings (only for employees, not freelancers)
    let warningCreated = null;
    if (
      finalStatus === AttendanceStatus.ABSENT &&
      personType === "employee" &&
      !bypassApplied
    ) {
      warningCreated = await checkAndCreateAbsentWarning(
        person.id,
        checkOutTimeToUse,
        finalStatus,
        false
      );
    }

    // Update attendance record with check-out and calculated hours
    const updateData: any = {
      checkOut: checkOutTimeToUse,
      checkOutAddress: location || address,
      checkOutLat: lat ? parseFloat(lat) : null,
      checkOutLng: lng ? parseFloat(lng) : null,
      regularHours,
      overtimeHours,
      status: finalStatus,
      notes: statusNotes,
      bypassApplied: bypassApplied || attendanceRecord.bypassApplied,
      bypassRuleId: bypassResult.rule?.id || attendanceRecord.bypassRuleId,
    };

    attendanceRecord = await db.attendanceRecord.update({
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
      record: attendanceRecord,
      regularHours,
      overtimeHours,
      overtimePay: overtimePay > 0 ? overtimePay : null,
      status: finalStatus,
      workedPercentage: Math.round(workedPercentage),
      hasOvertime: overtimeHours > 0,
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
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------------
// ATTENDANCE BYPASS CHECK FUNCTION
// ------------------------------------------------------------------
async function checkAttendanceBypass(
  assigneeId: string,
  assigneeType: "employee" | "freelancer",
  date: Date
): Promise<{
  hasBypass: boolean;
  bypassCheckIn: boolean;
  bypassCheckOut: boolean;
  customCheckInTime?: string | null;
  customCheckOutTime?: string | null;
  rule?: any;
}> {
  try {
    // Get today's date at midnight for date range comparison
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build the where clause based on assignee type
    const where: any = {
      AND: [{ startDate: { lte: tomorrow } }, { endDate: { gte: today } }],
    };

    // Add assignee condition based on type
    if (assigneeType === "employee") {
      where.employees = {
        some: { id: assigneeId },
      };
    } else {
      where.freelancers = {
        some: { id: assigneeId },
      };
    }

    const bypassRule = await db.attendanceBypassRule.findFirst({
      where,
      include: {
        employees:
          assigneeType === "employee"
            ? {
                select: {
                  id: true,
                  employeeNumber: true,
                  firstName: true,
                  lastName: true,
                  position: true,
                  department: true,
                },
              }
            : false,
        freelancers:
          assigneeType === "freelancer"
            ? {
                select: {
                  id: true,
                  freeLancerNumber: true,
                  firstName: true,
                  lastName: true,
                  position: true,
                  department: true,
                },
              }
            : false,
      },
      orderBy: {
        createdAt: "desc",
      },
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
// CALCULATE HOURS AND STATUS WITH HR SETTINGS
// ------------------------------------------------------------------
async function calculateHoursAndStatus(
  person: any,
  checkInTime: Date,
  checkOutTime: Date,
  currentStatus: AttendanceStatus,
  isNightShift: boolean = false,
  hrSettings?: any
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

  // Get HR settings or use defaults
  const overtimeThreshold = hrSettings?.overtimeThreshold || 8.0;
  const halfDayThreshold = hrSettings?.halfDayThreshold || 4.0;
  const workingHoursPerDay = hrSettings?.workingHoursPerDay || 8;

  // Calculate actual hours worked
  const actualHoursWorked =
    (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

  console.log(`Calculate hours:`, {
    checkInTime: checkInTime.toISOString(),
    checkOutTime: checkOutTime.toISOString(),
    actualHoursWorked: actualHoursWorked.toFixed(2),
    isNightShift: isNightShift,
    overtimeThreshold,
    halfDayThreshold,
    workingHoursPerDay,
  });

  // ---------------------------------------------------------
  // DETERMINE IF WEEKDAY OR WEEKEND
  // ---------------------------------------------------------
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const checkInDay = dayNames[checkInTime.getDay()];
  const isWeekend = checkInDay === "SAT" || checkInDay === "SUN";

  // Get the appropriate scheduled times
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
    // Parse time strings
    const [startHours, startMinutes] = scheduledKnockInTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = scheduledKnockOutTime.split(":").map(Number);

    console.log(`Schedule: ${scheduledKnockInTime} - ${scheduledKnockOutTime}`);

    // Create scheduled times based on check-in date
    const scheduledStartTime = new Date(checkInTime);
    scheduledStartTime.setHours(startHours, startMinutes, 0, 0);

    const scheduledEndTime = new Date(checkInTime);
    scheduledEndTime.setHours(endHours, endMinutes, 0, 0);

    // Handle overnight shifts for night workers
    if (endHours <= startHours || isNightShift) {
      if (endHours < startHours && endHours < 12) {
        scheduledEndTime.setDate(scheduledEndTime.getDate() + 1);
      } else if (isNightShift && startHours >= 18) {
        scheduledEndTime.setDate(scheduledEndTime.getDate() + 1);
      }
    }

    // Calculate scheduled hours
    const scheduledHours =
      (scheduledEndTime.getTime() - scheduledStartTime.getTime()) /
      (1000 * 60 * 60);

    // ---------------------------------------------------------
    // OVERTIME LOGIC USING HR SETTINGS
    // ---------------------------------------------------------
    const totalHoursWorked = actualHoursWorked;

    if (totalHoursWorked > overtimeThreshold) {
      // Person worked beyond overtime threshold
      regularHours = overtimeThreshold;
      overtimeHours = totalHoursWorked - overtimeThreshold;
      newStatus = currentStatus;
      workedPercentage = 100;

      console.log(`Overtime Scenario:`, {
        totalHours: totalHoursWorked.toFixed(2),
        overtimeThreshold: overtimeThreshold,
        regularHours: regularHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2),
        status: newStatus,
      });
    } else {
      // No overtime, calculate based on scheduled hours
      regularHours = totalHoursWorked;
      overtimeHours = 0;

      if (scheduledHours > 0) {
        workedPercentage = (totalHoursWorked / scheduledHours) * 100;
      } else {
        workedPercentage = (totalHoursWorked / workingHoursPerDay) * 100;
      }

      // Apply status logic using halfDayThreshold
      if (
        totalHoursWorked >= halfDayThreshold &&
        totalHoursWorked < overtimeThreshold
      ) {
        newStatus = AttendanceStatus.HALF_DAY;
      } else if (totalHoursWorked < halfDayThreshold) {
        newStatus = AttendanceStatus.ABSENT;
      } else {
        newStatus = currentStatus;
      }

      console.log(`Regular Scenario:`, {
        totalHours: totalHoursWorked.toFixed(2),
        scheduledHours: scheduledHours.toFixed(2),
        halfDayThreshold: halfDayThreshold,
        percentage: workedPercentage.toFixed(1),
        status: newStatus,
      });
    }
  } else {
    // No schedule set, use HR settings defaults
    const totalHoursWorked = actualHoursWorked;

    if (totalHoursWorked > overtimeThreshold) {
      regularHours = overtimeThreshold;
      overtimeHours = totalHoursWorked - overtimeThreshold;
      newStatus = currentStatus;
      workedPercentage = 100;
    } else {
      regularHours = totalHoursWorked;
      overtimeHours = 0;
      workedPercentage = (totalHoursWorked / workingHoursPerDay) * 100;

      if (
        totalHoursWorked >= halfDayThreshold &&
        totalHoursWorked < overtimeThreshold
      ) {
        newStatus = AttendanceStatus.HALF_DAY;
      } else if (totalHoursWorked < halfDayThreshold) {
        newStatus = AttendanceStatus.ABSENT;
      } else {
        newStatus = currentStatus;
      }
    }

    console.log(`Default Schedule (no person schedule):`, {
      totalHours: totalHoursWorked.toFixed(2),
      overtimeThreshold: overtimeThreshold,
      halfDayThreshold: halfDayThreshold,
      percentage: workedPercentage.toFixed(1),
      status: newStatus,
    });
  }

  // Round hours to 1 decimal place
  regularHours = Math.round(regularHours * 10) / 10;
  overtimeHours = Math.round(overtimeHours * 10) / 10;

  return { regularHours, overtimeHours, newStatus, workedPercentage };
}

// ------------------------------------------------------------------
// HELPER FUNCTIONS
// ------------------------------------------------------------------

async function checkAndCreateAbsentWarning(
  employeeId: string,
  currentTime: Date,
  status: AttendanceStatus,
  isAutoCreated: boolean = false
): Promise<any> {
  try {
    if (status !== AttendanceStatus.ABSENT) {
      return null;
    }

    const startOfMonth = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      1
    );
    startOfMonth.setHours(0, 0, 0, 0);

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

    console.log(
      `Absent counts for employee ${employeeId}: Month=${monthlyAbsentCount}`
    );

    let warningType = "";
    let severity = "";
    let reason = "";
    let actionPlan = "";

    if (monthlyAbsentCount === 1) {
      warningType = "Attendance";
      severity = "LOW";
      reason = `First absent day this month. Date: ${currentTime.toDateString()}`;
      if (isAutoCreated) {
        reason += " (Auto-detected: No check-in recorded)";
      }
      actionPlan =
        "Please ensure regular attendance. Absences should be properly requested as leave.";
    } else if (monthlyAbsentCount === 2) {
      warningType = "Attendance";
      severity = "MEDIUM";
      reason = `Second absent day this month. Total absent days: ${monthlyAbsentCount}`;
      if (isAutoCreated) {
        reason += " (Auto-detected: No check-in recorded)";
      }
      actionPlan =
        "This is concerning attendance pattern. Please discuss with your manager.";
    } else if (monthlyAbsentCount >= 3) {
      warningType = "Attendance";
      severity = "HIGH";
      reason = `Third absent day this month. Total absent days: ${monthlyAbsentCount}`;
      if (isAutoCreated) {
        reason += " (Auto-detected: No check-in recorded)";
      }
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

      console.log(
        `Created absent warning and notification for employee ${employeeId}: ${severity}`
      );
      return warning;
    }

    return null;
  } catch (error) {
    console.error("Error creating absent warning:", error);
    return null;
  }
}

async function checkAndCreateAbsentRecords(
  currentEmployeeWorkedPercentage: number
): Promise<boolean> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      const recordDayName = dayNames[recordDay.getDay()];
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(
      "Auto-attendance: Creating absent records for EMPLOYEES who didn't check in..."
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
        const todayDay = dayNames[today.getDay()];
        const workingDays = Array.isArray(employee.workingDays)
          ? employee.workingDays
          : employee.workingDays
            ? JSON.parse(employee.workingDays)
            : [];

        const isWorkingDay = workingDays.includes(todayDay);

        if (!isWorkingDay) {
          console.log(
            `Skipping ${employee.firstName} - not a working day (${todayDay})`
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
          `Auto-attendance: Created absent record for EMPLOYEE ${employee.firstName} ${employee.lastName} (${isWeekend ? "WEEKEND" : "WEEKDAY"})`
        );

        const warning = await checkAndCreateAbsentWarning(
          employee.id,
          today,
          AttendanceStatus.ABSENT,
          true
        );

        if (warning) {
          createdWarnings.push(warning);
          console.log(
            `Auto-attendance: Created warning for auto-created absent record for ${employee.firstName} ${employee.lastName}`
          );
        }
      } catch (error) {
        console.error(
          `Auto-attendance: Error processing employee ${employee.id}:`,
          error
        );
      }
    }

    console.log(
      `Auto-attendance: Completed. Created ${createdRecords.length} EMPLOYEE absent records and ${createdWarnings.length} warnings.`
    );
    return createdRecords.length > 0;
  } catch (error) {
    console.error("Auto-attendance for absent employees: Failed:", error);
    throw error;
  }
}
