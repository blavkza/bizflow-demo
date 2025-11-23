import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = new Date(); // Server Time (UTC)

    // Find today's attendance record
    const uniqueConstraint =
      personType === "employee"
        ? { employeeId_date: { employeeId: person.id, date: today } }
        : { freeLancerId_date: { freeLancerId: person.id, date: today } };

    let attendanceRecord = await db.attendanceRecord.findUnique({
      where: uniqueConstraint,
    });

    if (!attendanceRecord) {
      return NextResponse.json(
        { error: "No check-in found for today" },
        { status: 400 }
      );
    }

    if (attendanceRecord.checkOut) {
      return NextResponse.json(
        {
          error: `${personType === "employee" ? "Employee" : "Freelancer"} already checked out today`,
        },
        { status: 400 }
      );
    }

    const checkInTime = attendanceRecord.checkIn!;

    // Calculate hours and determine new status
    const { regularHours, overtimeHours, newStatus, workedPercentage } =
      await calculateHoursAndStatus(
        person,
        checkInTime,
        currentTime,
        attendanceRecord.status
      );

    // Update status based on worked percentage
    let finalStatus = newStatus;
    let statusNotes = notes || attendanceRecord.notes || "";

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
      statusNotes += (statusNotes ? " | " : "") + `Overtime: ${overtimeHours}h`;
    }

    // Check for absent warnings (only for employees, not freelancers)
    let warningCreated = null;
    if (finalStatus === AttendanceStatus.ABSENT && personType === "employee") {
      warningCreated = await checkAndCreateAbsentWarning(
        person.id,
        currentTime,
        finalStatus,
        false // isAutoCreated = false (manual absence from check-out)
      );
    }

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
        status: finalStatus,
        notes: statusNotes,
      },
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
    if (personType === "employee") {
      shouldCreateAbsentRecords =
        await checkAndCreateAbsentRecords(workedPercentage);
    }

    return NextResponse.json({
      message: "Check-out recorded successfully",
      record: attendanceRecord,
      regularHours,
      overtimeHours,
      status: finalStatus,
      workedPercentage: Math.round(workedPercentage),
      hasOvertime: overtimeHours > 0,
      warning: warningCreated,
      triggeredAbsentCreation: shouldCreateAbsentRecords,
      personType,
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
// FIXED CALCULATE FUNCTION (Handles SAST Timezone)
// ------------------------------------------------------------------
async function calculateHoursAndStatus(
  person: any,
  checkInTime: Date,
  checkOutTime: Date,
  currentStatus: AttendanceStatus
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

  // Calculate actual hours worked (Based on UTC timestamps, so this is always correct)
  const actualHoursWorked =
    (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

  if (person.scheduledKnockIn && person.scheduledKnockOut) {
    // Parse time strings (e.g., "09:00" and "17:00")
    const [startHours, startMinutes] = person.scheduledKnockIn
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = person.scheduledKnockOut
      .split(":")
      .map(Number);

    // --- FIX: ADJUST FOR SOUTH AFRICA TIMEZONE (UTC+2) ---
    // If schedule is 09:00 SAST, Server sees 07:00 UTC.
    // We must subtract 2 hours from the scheduled hours so it matches the DB timestamps.
    const SAST_OFFSET = 2;

    // Create scheduled times based on check-in date
    const scheduledStartTime = new Date(checkInTime);
    scheduledStartTime.setHours(startHours - SAST_OFFSET, startMinutes, 0, 0);

    const scheduledEndTime = new Date(checkInTime);
    scheduledEndTime.setHours(endHours - SAST_OFFSET, endMinutes, 0, 0);

    // Handle overnight shifts (if end time is earlier than start time, add 1 day)
    if (scheduledEndTime <= scheduledStartTime) {
      scheduledEndTime.setDate(scheduledEndTime.getDate() + 1);
    }

    // Calculate scheduled hours
    const scheduledHours =
      (scheduledEndTime.getTime() - scheduledStartTime.getTime()) /
      (1000 * 60 * 60);

    // OVERTIME CALCULATION - ONLY if worked beyond scheduled end time
    if (checkOutTime > scheduledEndTime) {
      // Person worked overtime
      regularHours = scheduledHours; // Full scheduled hours as regular
      overtimeHours =
        (checkOutTime.getTime() - scheduledEndTime.getTime()) /
        (1000 * 60 * 60);
      overtimeHours = Math.max(overtimeHours, 0);

      // Status remains PRESENT/LATE (worked full schedule + overtime)
      newStatus = currentStatus;
      workedPercentage = 100; // Worked 100% of scheduled time + overtime

      console.log(
        `Overtime Scenario: Scheduled=${scheduledHours.toFixed(2)}h, Regular=${regularHours.toFixed(2)}h, Overtime=${overtimeHours.toFixed(2)}h, Status=${newStatus}`
      );
    } else {
      // Person checked out BEFORE or AT scheduled end time - NO OVERTIME
      overtimeHours = 0;

      // Calculate worked percentage based on actual hours vs scheduled hours
      workedPercentage = (actualHoursWorked / scheduledHours) * 100;

      // Smart status change logic (only for persons who didn't work overtime)
      if (workedPercentage >= 50 && workedPercentage < 90) {
        // Worked 50% to 90% → Change to HALF_DAY
        newStatus = AttendanceStatus.HALF_DAY;
        regularHours = actualHoursWorked;
      } else if (workedPercentage < 50) {
        // Worked less than 50% → Change to ABSENT
        newStatus = AttendanceStatus.ABSENT;
        regularHours = actualHoursWorked;
      } else {
        // Worked 90% to 100% → Keep original status (PRESENT/LATE)
        newStatus = currentStatus;
        regularHours = actualHoursWorked;
      }

      console.log(
        `Regular Scenario: Scheduled=${scheduledHours.toFixed(2)}h, Worked=${actualHoursWorked.toFixed(2)}h, Percentage=${workedPercentage.toFixed(1)}%, Regular=${regularHours.toFixed(2)}h, Status=${newStatus}`
      );
    }
  } else {
    // Fallback: calculate based on 8-hour workday
    const defaultScheduledHours = 8;
    workedPercentage = (actualHoursWorked / defaultScheduledHours) * 100;

    // NO OVERTIME in default calculation
    overtimeHours = 0;

    // Apply the same logic for default schedule
    if (workedPercentage >= 50 && workedPercentage < 90) {
      newStatus = AttendanceStatus.HALF_DAY;
      regularHours = actualHoursWorked;
    } else if (workedPercentage < 50) {
      newStatus = AttendanceStatus.ABSENT;
      regularHours = actualHoursWorked;
    } else {
      newStatus = currentStatus;
      regularHours = actualHoursWorked;
    }

    console.log(
      `Default Schedule: Worked=${actualHoursWorked.toFixed(2)}h, Percentage=${workedPercentage.toFixed(1)}%, Regular=${regularHours.toFixed(2)}h, Status=${newStatus}`
    );
  }

  // Round hours to 2 decimal places
  regularHours = Math.round(regularHours * 100) / 100;
  overtimeHours = Math.round(overtimeHours * 100) / 100;

  return { regularHours, overtimeHours, newStatus, workedPercentage };
}

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

// Add this helper function to your file (updating the existing one)
async function checkAndCreateAbsentWarning(
  employeeId: string,
  currentTime: Date,
  status: AttendanceStatus,
  isAutoCreated: boolean = false
): Promise<any> {
  try {
    // Only create warnings for ABSENT status
    if (status !== AttendanceStatus.ABSENT) {
      return null;
    }

    // Get start of month
    const startOfMonth = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      1
    );
    startOfMonth.setHours(0, 0, 0, 0);

    // Count ALL absent days for the month (including auto-created)
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

    // Check warning conditions for absences
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

    // Create warning AND Notification if conditions met
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

      // --- ADDED NOTIFICATION HERE ---
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

    // Check if any employee has already worked more than 50% today
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
          },
        },
      },
    });

    let someoneWorkedOver50 = false;

    // Check if any employee worked more than 50%
    for (const record of employeesWorkedOver50) {
      if (
        record.employee?.scheduledKnockIn &&
        record.employee?.scheduledKnockOut
      ) {
        const [startHours, startMinutes] = record.employee.scheduledKnockIn
          .split(":")
          .map(Number);
        const [endHours, endMinutes] = record.employee.scheduledKnockOut
          .split(":")
          .map(Number);

        // --- FIX: ADJUST FOR SAST TIMEZONE HERE TOO ---
        const SAST_OFFSET = 2;

        const scheduledStartTime = new Date(record.checkIn!);
        scheduledStartTime.setHours(
          startHours - SAST_OFFSET,
          startMinutes,
          0,
          0
        );

        const scheduledEndTime = new Date(record.checkIn!);
        scheduledEndTime.setHours(endHours - SAST_OFFSET, endMinutes, 0, 0);

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

        const attendanceRecord = await db.attendanceRecord.create({
          data: {
            employeeId: employee.id,
            date: today,
            status: AttendanceStatus.ABSENT,
            scheduledKnockIn: employee.scheduledKnockIn,
            scheduledKnockOut: employee.scheduledKnockOut,
            notes: "Auto-created: Absent - No check-in recorded",
          },
        });

        createdRecords.push({
          id: attendanceRecord.id,
          employee: `${employee.firstName} ${employee.lastName}`,
          status: attendanceRecord.status,
        });

        console.log(
          `Auto-attendance: Created absent record for EMPLOYEE ${employee.firstName} ${employee.lastName}`
        );

        const warning = await checkAndCreateAbsentWarning(
          employee.id,
          today,
          AttendanceStatus.ABSENT,
          true // isAutoCreated = true
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
