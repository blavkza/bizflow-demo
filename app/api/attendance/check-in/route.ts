import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { CheckInMethod, AttendanceStatus, LeaveStatus } from "@prisma/client";
import { sendPushNotification } from "@/lib/expo";

// SIMPLIFIED TIMEZONE FUNCTION
function getCurrentSASTAsUTC() {
  const now = new Date();

  // Get SAST date components (Africa/Johannesburg is UTC+2)
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

  // SAST is UTC+2, so subtract 2 hours to get UTC
  const utcDate = new Date(
    Date.UTC(year, month, day, hour - 2, minute, second)
  );

  return {
    utcDate,
    sastDate: new Date(Date.UTC(year, month, day)), // SAST date at midnight UTC
    sastHour: hour,
    sastMinute: minute,
    sastYear: year,
    sastMonth: month,
    sastDay: day,
  };
}

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

    // ---------------------------------------------------------
    // 1. GET HR SETTINGS
    // ---------------------------------------------------------
    const hrSettings = await db.hRSettings.findFirst();
    const gracePeriodMinutes = hrSettings?.lateThreshold || 15;
    const overtimeThreshold = hrSettings?.overtimeThreshold || 8.0;
    const halfDayThreshold = hrSettings?.halfDayThreshold || 4.0;
    const workingHoursPerDay = hrSettings?.workingHoursPerDay || 8;

    if (!employeeId && !freelancerId) {
      return NextResponse.json(
        { error: "Employee ID or Freelancer ID is required" },
        { status: 400 }
      );
    }

    let person: any = null;
    let personType: "employee" | "freelancer" = "employee";

    if (employeeId) {
      person = await db.employee.findUnique({
        where: { employeeNumber: employeeId },
        include: {
          department: true,
          leaveRequests: {
            where: {
              status: LeaveStatus.APPROVED,
            },
          },
        },
      });
      personType = "employee";
    } else {
      person = await db.freeLancer.findUnique({
        where: { freeLancerNumber: freelancerId },
        include: {
          department: true,
        },
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

    // ---------------------------------------------------------
    // 2. TIMEZONE CALCULATION
    // ---------------------------------------------------------
    const { utcDate: currentTimeUTC, sastDate: today } = getCurrentSASTAsUTC();

    console.log(`=== TIME CONVERSION DEBUG ===`);
    console.log(`Server Time: ${new Date().toISOString()}`);
    console.log(`Current UTC (from SAST): ${currentTimeUTC.toISOString()}`);
    console.log(`Today SAST (as UTC): ${today.toISOString()}`);

    // ---------------------------------------------------------
    // 3. CHECK FOR ATTENDANCE BYPASS RULES
    // ---------------------------------------------------------
    const bypassResult = await checkAttendanceBypassSimple(
      person.id,
      personType,
      today
    );

    // ---------------------------------------------------------
    // 4. ATTENDANCE DATE (NO NIGHT SHIFT LOGIC)
    // ---------------------------------------------------------
    const attendanceDate = today; // Always use today's date
    let customCheckInTimeUsed: string | null = null;

    // Just record if bypass has custom time
    if (
      bypassResult.bypassCheckIn &&
      bypassResult.customCheckInTime &&
      bypassResult.customCheckInTime !== "none"
    ) {
      customCheckInTimeUsed = bypassResult.customCheckInTime;
    }

    // ---------------------------------------------------------
    // 5. VALIDATION CHECKS
    // ---------------------------------------------------------

    // Check if employee is on leave
    if (personType === "employee") {
      const isOnLeave = await checkIfEmployeeOnLeave(person, attendanceDate);

      if (isOnLeave && !bypassResult.bypassCheckIn) {
        return NextResponse.json(
          {
            error: "Employee is on approved leave for this shift",
            leaveType: isOnLeave.leaveType,
            reason: isOnLeave.reason,
          },
          { status: 400 }
        );
      }
    }

    // Check if it's a working day
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const attendanceDay = dayNames[today.getUTCDay()];

    if (
      person.workingDays &&
      person.workingDays.length > 0 &&
      !person.workingDays.includes(attendanceDay)
    ) {
      if (!bypassResult.bypassCheckIn) {
        return NextResponse.json(
          {
            error: "Not a scheduled working day for this shift",
          },
          { status: 400 }
        );
      }
      console.log(
        `Bypass allowed check-in on non-working day (${attendanceDay})`
      );
    }

    // Check if already checked in
    const existingRecord =
      personType === "employee"
        ? await db.attendanceRecord.findFirst({
            where: {
              employeeId: person.id,
              date: attendanceDate,
              checkIn: { not: null },
            },
          })
        : await db.attendanceRecord.findFirst({
            where: {
              freeLancerId: person.id,
              date: attendanceDate,
              checkIn: { not: null },
            },
          });

    if (existingRecord && existingRecord.checkIn) {
      return NextResponse.json(
        {
          error: `${personType === "employee" ? "Employee" : "Freelancer"} already checked in for this shift`,
          existingRecordId: existingRecord.id,
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 6. DETERMINE SCHEDULE (PRIORITY: BYPASS > WEEKEND > NORMAL)
    // ---------------------------------------------------------
    const isWeekend = attendanceDay === "SAT" || attendanceDay === "SUN";
    let scheduledKnockInTime: string | null = null;
    let scheduledKnockOutTime: string | null = null;

    // A. PRIORITY 1: BYPASS TIME (Schedule Override)
    if (
      bypassResult.bypassCheckIn &&
      bypassResult.customCheckInTime &&
      bypassResult.customCheckInTime !== "none"
    ) {
      scheduledKnockInTime = bypassResult.customCheckInTime;
      scheduledKnockOutTime = isWeekend
        ? person.scheduledWeekendKnockOut || person.scheduledKnockOut
        : person.scheduledKnockOut;

      console.log(
        `Schedule Override: Using Bypass Time ${scheduledKnockInTime} as Knock-In Schedule`
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
    // 7. STATUS CALCULATION (ALL TIMES IN UTC)
    // ---------------------------------------------------------
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    let isLate = false;
    let bypassApplied = false;
    let checkInTimeToUse: Date = currentTimeUTC;

    // If bypass has a custom check-in time, check lateness relative to THAT time
    if (
      bypassResult.bypassCheckIn &&
      bypassResult.customCheckInTime &&
      bypassResult.customCheckInTime !== "none"
    ) {
      bypassApplied = true;

      const [bypassHours, bypassMinutes] = bypassResult.customCheckInTime
        .split(":")
        .map(Number);

      // Create bypass schedule time in UTC
      const bypassScheduleUTC = new Date(attendanceDate);
      bypassScheduleUTC.setUTCHours(bypassHours - 2, bypassMinutes, 0, 0);

      // Calculate late threshold
      const bypassLateThreshold = new Date(
        bypassScheduleUTC.getTime() + gracePeriodMinutes * 60000
      );

      if (currentTimeUTC > bypassLateThreshold) {
        status = AttendanceStatus.LATE;
        isLate = true;
        console.log(
          `✓ MARKED AS LATE for bypass schedule ${bypassResult.customCheckInTime}`
        );
      } else {
        status = AttendanceStatus.PRESENT;
        isLate = false;
        console.log(
          `✓ On time for bypass schedule ${bypassResult.customCheckInTime}`
        );
      }
    }
    // Generic bypass (no custom time) - force present
    else if (bypassResult.bypassCheckIn) {
      bypassApplied = true;
      status = AttendanceStatus.PRESENT;
      isLate = false;
      console.log("✓ Generic Bypass: Forcing PRESENT status");
    }
    // Standard schedule check (no bypass)
    else if (scheduledKnockInTime) {
      const [scheduledHours, scheduledMinutes] = scheduledKnockInTime
        .split(":")
        .map(Number);

      console.log(`Standard Schedule: ${scheduledHours}:${scheduledMinutes}`);

      // Create scheduled time in UTC
      const scheduledScheduleUTC = new Date(attendanceDate);
      scheduledScheduleUTC.setUTCHours(
        scheduledHours - 2,
        scheduledMinutes,
        0,
        0
      );

      const lateThreshold = new Date(
        scheduledScheduleUTC.getTime() + gracePeriodMinutes * 60000
      );

      if (currentTimeUTC > lateThreshold) {
        status = AttendanceStatus.LATE;
        isLate = true;
        console.log(
          `✓ MARKED AS LATE for standard schedule ${scheduledKnockInTime}`
        );
      } else {
        status = AttendanceStatus.PRESENT;
        isLate = false;
        console.log(`✓ On time for standard schedule ${scheduledKnockInTime}`);
      }
    }

    // ---------------------------------------------------------
    // 8. WARNINGS (For Employees Only)
    // ---------------------------------------------------------
    let warningCreated = null;

    if (isLate && personType === "employee") {
      warningCreated = await checkAndCreateLateWarning(
        person.id,
        currentTimeUTC
      );
    }

    // ---------------------------------------------------------
    // 9. SAVE RECORD
    // ---------------------------------------------------------
    const attendanceData: any = {
      checkIn: checkInTimeToUse,
      checkInMethod: method as CheckInMethod,
      checkInAddress: location || address,
      checkInLat: lat ? parseFloat(lat) : null,
      checkInLng: lng ? parseFloat(lng) : null,
      status: status,
      notes: notes || null,
      scheduledKnockIn: scheduledKnockInTime,
      scheduledKnockOut: scheduledKnockOutTime,
      isWeekend: isWeekend,
      bypassApplied: bypassApplied,
      bypassRuleId: bypassResult.rule?.id || null,
    };

    // Add note about bypass schedule change
    if (
      bypassApplied &&
      scheduledKnockInTime === bypassResult.customCheckInTime
    ) {
      attendanceData.notes =
        (attendanceData.notes ? attendanceData.notes + " | " : "") +
        `Schedule changed to ${scheduledKnockInTime} by Bypass`;
    }

    if (personType === "employee") {
      attendanceData.employeeId = person.id;
    } else {
      attendanceData.freeLancerId = person.id;
    }

    const attendanceDateUTC = attendanceDate;

    console.log(`Creating attendance record:`, {
      personType,
      personId: person.id,
      attendanceDate: attendanceDate.toISOString().split("T")[0],
      checkInTime: checkInTimeToUse.toISOString(),
      status: status,
      bypassApplied: bypassApplied,
      isLate: isLate,
    });

    let attendanceRecord: any = null;

    try {
      if (!existingRecord) {
        attendanceRecord = await db.attendanceRecord.create({
          data: {
            ...attendanceData,
            date: attendanceDateUTC,
          },
          include: {
            employee:
              personType === "employee"
                ? {
                    include: { department: true },
                  }
                : false,
            freeLancer:
              personType === "freelancer"
                ? {
                    include: { department: true },
                  }
                : false,
          },
        });
      } else {
        attendanceRecord = await db.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: attendanceData,
          include: {
            employee:
              personType === "employee"
                ? {
                    include: { department: true },
                  }
                : false,
            freeLancer:
              personType === "freelancer"
                ? {
                    include: { department: true },
                  }
                : false,
          },
        });
      }

      console.log(`Attendance record created successfully:`, {
        recordId: attendanceRecord.id,
        checkIn: attendanceRecord.checkIn,
        status: attendanceRecord.status,
        isLate: isLate,
      });

      // Send notification
      if (personType === "employee" && person.expoPushToken) {
        try {
          const checkInStatus = isLate ? "marked as LATE" : "successful";

          await sendPushNotification({
            employeeId: person.id,
            title: "Check-in Recorded",
            body: `Your check-in was ${checkInStatus}`,
            data: { attendanceId: attendanceRecord.id },
          });
        } catch (error) {
          console.error("Failed to send push notification:", error);
        }
      }

      // Trigger auto-attendance for leave employees
      triggerAutoAttendanceForLeave().catch((error) => {
        console.error("Auto-attendance background task failed:", error);
      });

      return NextResponse.json({
        message: "Check-in recorded successfully",
        record: attendanceRecord,
        status: status.toLowerCase(),
        isLate: isLate,
        warning: warningCreated,
        personType,
        isWeekend,
        scheduledTimeUsed: scheduledKnockInTime,
        bypassApplied: bypassApplied,
        customCheckInTime: customCheckInTimeUsed,
        actualCheckInTime: checkInTimeToUse.toISOString(),
        attendanceDate: attendanceDate.toISOString().split("T")[0],
      });
    } catch (dbError: any) {
      console.error("Database error creating attendance:", dbError);
      return NextResponse.json(
        {
          error: "Failed to create attendance record",
          details: dbError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------
// SIMPLIFIED BYPASS CHECK FUNCTION
// ---------------------------------------------------------
async function checkAttendanceBypassSimple(
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
    console.log(`\n=== BYPASS CHECK WITH FLEXIBLE DATE RANGE ===`);

    // Convert date to YYYY-MM-DD format for comparison
    const dateStr = date.toISOString().split("T")[0];
    const checkDate = new Date(dateStr);
    checkDate.setUTCHours(0, 0, 0, 0);

    // Create a wider range to account for timezone issues
    const threeDaysAgo = new Date(checkDate);
    threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);

    const threeDaysLater = new Date(checkDate);
    threeDaysLater.setUTCDate(threeDaysLater.getUTCDate() + 3);
    threeDaysLater.setUTCHours(23, 59, 59, 999);

    console.log(`Check Date: ${checkDate.toISOString()}`);
    console.log(
      `Search Range: ${threeDaysAgo.toISOString()} to ${threeDaysLater.toISOString()}`
    );

    // Build query with wider range
    const where: any = {
      AND: [
        { startDate: { lte: threeDaysLater } }, // Rule starts before 3 days after today
        { endDate: { gte: threeDaysAgo } }, // Rule ends after 3 days before today
        { bypassCheckIn: true },
      ],
    };

    // Add employee/freelancer filter
    if (assigneeType === "employee") {
      where.employees = {
        some: { id: assigneeId },
      };
    } else {
      where.freelancers = {
        some: { id: assigneeId },
      };
    }

    console.log(`Query WHERE:`, JSON.stringify(where, null, 2));

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
                },
              }
            : false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (bypassRule) {
      console.log(`\n✓ FOUND BYPASS RULE!`);
      console.log(`Start: ${bypassRule.startDate}`);
      console.log(`End: ${bypassRule.endDate}`);
      console.log(`Custom Time: ${bypassRule.customCheckInTime}`);

      // Check if this rule actually applies to today
      const ruleStart = new Date(bypassRule.startDate);
      const ruleEnd = new Date(bypassRule.endDate);

      // Check if today is within the rule's actual range
      const today = new Date(date);
      const isWithinRule = today >= ruleStart && today <= ruleEnd;

      console.log(`Today: ${today.toISOString()}`);
      console.log(`Is within actual rule range? ${isWithinRule}`);

      if (!isWithinRule) {
        console.log(`⚠️ Rule found but doesn't actually apply to today!`);
        console.log(`Returning no bypass...`);
        return {
          hasBypass: false,
          bypassCheckIn: false,
          bypassCheckOut: false,
        };
      }

      return {
        hasBypass: true,
        bypassCheckIn: bypassRule.bypassCheckIn,
        bypassCheckOut: bypassRule.bypassCheckOut || false,
        customCheckInTime: bypassRule.customCheckInTime,
        customCheckOutTime: bypassRule.customCheckOutTime,
        rule: bypassRule,
      };
    }

    console.log(`\n✗ No bypass rule found in database`);
    return {
      hasBypass: false,
      bypassCheckIn: false,
      bypassCheckOut: false,
    };
  } catch (error: any) {
    console.error("Error in simple bypass check:", error.message);
    return {
      hasBypass: false,
      bypassCheckIn: false,
      bypassCheckOut: false,
    };
  }
}

// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------

async function checkIfEmployeeOnLeave(
  employee: any,
  date: Date
): Promise<{ leaveType: string; reason: string } | null> {
  try {
    for (const leaveRequest of employee.leaveRequests) {
      const startDate = new Date(leaveRequest.startDate);
      const endDate = new Date(leaveRequest.endDate);

      // Normalize to UTC Midnight
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);

      if (date >= startDate && date <= endDate) {
        return {
          leaveType: leaveRequest.leaveType,
          reason: leaveRequest.reason || "Approved Leave",
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error checking leave status:", error);
    return null;
  }
}

async function checkAndCreateLateWarning(
  employeeId: string,
  currentTime: Date
): Promise<any> {
  try {
    const startOfWeek = new Date(currentTime);
    startOfWeek.setUTCDate(
      currentTime.getUTCDate() - currentTime.getUTCDay() + 1
    );
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const startOfMonth = new Date(
      Date.UTC(currentTime.getUTCFullYear(), currentTime.getUTCMonth(), 1)
    );

    const weeklyLateCount = await db.attendanceRecord.count({
      where: {
        employeeId: employeeId,
        status: AttendanceStatus.LATE,
        date: {
          gte: startOfWeek,
          lt: currentTime,
        },
      },
    });

    const monthlyLateCount = await db.attendanceRecord.count({
      where: {
        employeeId: employeeId,
        status: AttendanceStatus.LATE,
        date: {
          gte: startOfMonth,
          lt: currentTime,
        },
      },
    });

    console.log(
      `Late counts for employee ${employeeId}: Week=${weeklyLateCount}, Month=${monthlyLateCount}`
    );

    let warningType = "";
    let severity = "";
    let reason = "";
    let actionPlan = "";

    if (weeklyLateCount === 1) {
      warningType = "Attendance";
      severity = "MEDIUM";
      reason = `Second late attendance this week. Total late this week: ${weeklyLateCount + 1}`;
      actionPlan = "Please ensure punctuality.";
    } else if (monthlyLateCount === 2) {
      warningType = "Attendance";
      severity = "HIGH";
      reason = `Third late attendance this month. Total late this month: ${monthlyLateCount + 1}`;
      actionPlan = "Formal warning regarding persistent late attendance.";
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
          title: "New Warning Created",
          message: `${reason} (Severity: ${severity})`,
          type: "WARNING",
          isRead: false,
        },
      });

      await sendPushNotification({
        employeeId: employeeId,
        title: "New Warning Created",
        body: `${reason} (Severity: ${severity})`,
        data: { warningId: warning.id },
      });

      return warning;
    }

    return null;
  } catch (error) {
    console.error("Error creating late warning:", error);
    return null;
  }
}

async function triggerAutoAttendanceForLeave() {
  try {
    // Get current SAST time
    const { sastDate: today } = getCurrentSASTAsUTC();

    const employees = await db.employee.findMany({
      where: {
        OR: [
          {
            leaveRequests: {
              some: {
                status: LeaveStatus.APPROVED,
              },
            },
          },
        ],
      },
      include: {
        department: true,
        AttendanceRecord: {
          where: {
            date: today,
          },
        },
        leaveRequests: {
          where: {
            status: LeaveStatus.APPROVED,
          },
        },
      },
    });

    const createdRecords = [];

    for (const employee of employees) {
      try {
        if (employee.AttendanceRecord.length > 0) continue;

        const shouldCreateRecord = await shouldCreateLeaveAttendanceRecord(
          employee,
          today
        );

        if (shouldCreateRecord.shouldCreate) {
          const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
          const todayDay = dayNames[today.getUTCDay()];
          const isWeekend = todayDay === "SAT" || todayDay === "SUN";

          let scheduledKnockInTime: string | null = null;
          let scheduledKnockOutTime: string | null = null;

          if (isWeekend) {
            scheduledKnockInTime =
              employee.scheduledWeekendKnockIn || employee.scheduledKnockIn;
            scheduledKnockOutTime =
              employee.scheduledWeekendKnockOut || employee.scheduledKnockOut;
          } else {
            scheduledKnockInTime = employee.scheduledKnockIn;
            scheduledKnockOutTime = employee.scheduledKnockOut;
          }

          const attendanceRecord = await db.attendanceRecord.create({
            data: {
              employeeId: employee.id,
              date: today,
              status: shouldCreateRecord.status!,
              scheduledKnockIn: scheduledKnockInTime,
              scheduledKnockOut: scheduledKnockOutTime,
              notes: shouldCreateRecord.notes,
              isWeekend: isWeekend,
            },
          });
          createdRecords.push(attendanceRecord);
        }

        if (employee.AttendanceRecord.length > 0) {
          await db.employeeNotification.create({
            data: {
              employeeId: employee.id,
              title: "Leave Attendance Recorded",
              message: `Your attendance for today was recorded as leave`,
              type: "ATTENDANCE",
              isRead: false,
            },
          });

          await sendPushNotification({
            employeeId: employee.id,
            title: "Leave Attendance Recorded",
            body: `Your attendance for today was recorded as leave`,
            data: { employeeId: employee.id },
          });
        }
      } catch (error) {
        console.error(`Auto-attendance error for ${employee.id}:`, error);
      }
    }
    return createdRecords;
  } catch (error) {
    console.error("Auto-attendance failed:", error);
    throw error;
  }
}

async function shouldCreateLeaveAttendanceRecord(
  employee: any,
  targetDate: Date
): Promise<{
  shouldCreate: boolean;
  status?: AttendanceStatus;
  notes?: string;
}> {
  const approvedLeaveToday = employee.leaveRequests.find((leave: any) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);

    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setUTCHours(0, 0, 0, 0);

    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setUTCHours(23, 59, 59, 999);

    return targetDate >= normalizedStartDate && targetDate <= normalizedEndDate;
  });

  if (approvedLeaveToday) {
    return {
      shouldCreate: true,
      status: getLeaveAttendanceStatus(approvedLeaveToday.leaveType),
      notes: `Auto-created: ${getLeaveTypeDisplayName(approvedLeaveToday.leaveType)} - ${approvedLeaveToday.reason}`,
    };
  }

  return { shouldCreate: false };
}

function getLeaveAttendanceStatus(leaveType: string): AttendanceStatus {
  switch (leaveType) {
    case "SICK":
      return AttendanceStatus.SICK_LEAVE;
    case "UNPAID":
      return AttendanceStatus.UNPAID_LEAVE;
    case "ANNUAL":
      return AttendanceStatus.ANNUAL_LEAVE;
    case "MATERNITY":
      return AttendanceStatus.MATERNITY_LEAVE;
    case "PATERNITY":
      return AttendanceStatus.PATERNITY_LEAVE;
    case "STUDY":
      return AttendanceStatus.STUDY_LEAVE;
    default:
      return AttendanceStatus.ANNUAL_LEAVE;
  }
}

function getLeaveTypeDisplayName(leaveType: string): string {
  switch (leaveType) {
    case "ANNUAL":
      return "Annual Leave";
    case "SICK":
      return "Sick Leave";
    case "UNPAID":
      return "Unpaid Leave";
    case "MATERNITY":
      return "Maternity Leave";
    case "PATERNITY":
      return "Paternity Leave";
    case "STUDY":
      return "Study Leave";
    default:
      return "Leave";
  }
}
