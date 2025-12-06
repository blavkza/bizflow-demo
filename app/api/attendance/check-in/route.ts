import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { CheckInMethod, AttendanceStatus, LeaveStatus } from "@prisma/client";
import { sendPushNotification } from "@/lib/expo";

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
    // 1. GET SETTINGS (Grace Period)
    // ---------------------------------------------------------
    const hrSettings = await db.hRSettings.findFirst();
    // Default to 15 minutes if no settings found
    const gracePeriodMinutes = hrSettings?.lateThreshold || 15;

    if (!employeeId && !freelancerId) {
      return NextResponse.json(
        { error: "Employee ID or Freelancer ID is required" },
        { status: 400 }
      );
    }

    let person: any = null;
    let personType: "employee" | "freelancer" = "employee";

    // ---------------------------------------------------------
    // 2. FIND PERSON
    // ---------------------------------------------------------
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = new Date(); // Server Time (usually UTC)

    // ---------------------------------------------------------
    // 3. CHECK FOR ATTENDANCE BYPASS RULES
    // ---------------------------------------------------------
    const bypassResult = await checkAttendanceBypass(
      person.id,
      personType,
      currentTime
    );

    // ---------------------------------------------------------
    // 4. VALIDATION CHECKS (Leave, Working Days, Duplicates)
    // ---------------------------------------------------------

    // Check if employee is on leave today (unless bypassed)
    if (personType === "employee") {
      const isOnLeave = await checkIfEmployeeOnLeave(person, today);

      if (isOnLeave && !bypassResult.bypassCheckIn) {
        // Only block if not bypassed
        return NextResponse.json(
          {
            error: "Employee is on approved leave today",
            leaveType: isOnLeave.leaveType,
            reason: isOnLeave.reason,
          },
          { status: 400 }
        );
      }
    }

    // Check if today is a working day (unless bypassed)
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const todayDay = dayNames[currentTime.getDay()];

    if (
      person.workingDays &&
      person.workingDays.length > 0 &&
      !person.workingDays.includes(todayDay)
    ) {
      // Only block if bypass doesn't allow it
      if (!bypassResult.bypassCheckIn) {
        console.log(`Blocking: ${personType} ${person.id} - Not a working day`);
        return NextResponse.json(
          {
            error: "Today is not a scheduled working day",
          },
          { status: 400 }
        );
      }
      console.log(
        `Allowing check-in on non-working day due to bypass for ${personType} ${person.id}`
      );
    }

    // Check if already checked in today
    const existingRecord =
      personType === "employee"
        ? await db.attendanceRecord.findFirst({
            where: {
              employeeId: person.id,
              date: today,
              checkIn: {
                not: null,
              },
            },
          })
        : await db.attendanceRecord.findFirst({
            where: {
              freeLancerId: person.id,
              date: today,
              checkIn: {
                not: null,
              },
            },
          });

    if (existingRecord && existingRecord.checkIn) {
      return NextResponse.json(
        {
          error: `${personType === "employee" ? "Employee" : "Freelancer"} already checked in today`,
          existingRecordId: existingRecord.id,
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 5. DETERMINE IF WEEKDAY OR WEEKEND AND GET SCHEDULED TIME
    // ---------------------------------------------------------
    const isWeekend = todayDay === "SAT" || todayDay === "SUN";

    // Get the appropriate scheduled knock-in time
    let scheduledKnockInTime: string | null = null;

    if (isWeekend) {
      scheduledKnockInTime =
        person.scheduledWeekendKnockIn || person.scheduledKnockIn;
    } else {
      scheduledKnockInTime = person.scheduledKnockIn;
    }

    // Also get the appropriate scheduled knock-out time for the record
    let scheduledKnockOutTime: string | null = null;

    if (isWeekend) {
      scheduledKnockOutTime =
        person.scheduledWeekendKnockOut || person.scheduledKnockOut;
    } else {
      scheduledKnockOutTime = person.scheduledKnockOut;
    }

    // ---------------------------------------------------------
    // 6. STATUS CALCULATION WITH BYPASS SUPPORT
    // ---------------------------------------------------------
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    let isLate = false;
    let bypassApplied = false;
    let customCheckInTimeUsed: string | null = null;
    let checkInTimeToUse: Date = currentTime; // Default to current time
    let customCheckInDateTime: Date | null = null;

    // If bypass is enabled for check-in, skip time validation
    if (bypassResult.bypassCheckIn) {
      bypassApplied = true;

      // If custom check-in time is specified, use it
      if (
        bypassResult.customCheckInTime &&
        bypassResult.customCheckInTime !== "none"
      ) {
        customCheckInTimeUsed = bypassResult.customCheckInTime;

        // Parse custom time and create a new date with it
        const [hours, minutes] = customCheckInTimeUsed.split(":").map(Number);

        // Create a new date for check-in time using TODAY as the base date
        // This ensures the date is correct (not using currentTime which might be wrong date)
        checkInTimeToUse = new Date(today);
        checkInTimeToUse.setHours(hours, minutes, 0, 0);

        // Also create a DateTime object for storing in the database
        // This is what AttendanceRecord.customCheckInTime expects (DateTime?)
        customCheckInDateTime = new Date(checkInTimeToUse);

        console.log(`Custom check-in time set:`, {
          customTime: customCheckInTimeUsed,
          hours: hours,
          minutes: minutes,
          checkInTimeToUse: checkInTimeToUse.toISOString(),
          customCheckInDateTime: customCheckInDateTime.toISOString(),
          today: today.toISOString(),
        });
      } else {
        console.log(
          `Using current time for check-in with bypass: ${currentTime.toISOString()}`
        );
      }

      // With bypass, always set status to PRESENT (not LATE)
      status = AttendanceStatus.PRESENT;
      isLate = false;
      console.log(
        `Bypass applied: Status forced to PRESENT for ${personType} ${person.id}`
      );
    } else if (scheduledKnockInTime) {
      // Normal time validation (only if bypass is not enabled)
      const [scheduledHours, scheduledMinutes] = scheduledKnockInTime
        .split(":")
        .map(Number);

      // Create a date object based on current server time
      const scheduledDateTime = new Date(currentTime);

      // FIX: South Africa is UTC+2. The server is UTC.
      // If schedule is 09:00 SAST, that is 07:00 UTC.
      // We subtract 2 hours from the scheduled time to match server time.
      const SAST_OFFSET = 2;
      scheduledDateTime.setHours(
        scheduledHours - SAST_OFFSET,
        scheduledMinutes,
        0,
        0
      );

      // Add dynamic grace period from HR Settings (converted to milliseconds)
      const lateThreshold = new Date(
        scheduledDateTime.getTime() + gracePeriodMinutes * 60000
      );

      if (currentTime > lateThreshold) {
        status = AttendanceStatus.LATE;
        isLate = true;
        console.log(`Marked as LATE for ${personType} ${person.id}`);
      } else {
        console.log(
          `Marked as PRESENT (on time) for ${personType} ${person.id}`
        );
      }
    }

    // ---------------------------------------------------------
    // 7. WARNINGS (For Employees Only) - Skip if bypass applied
    // ---------------------------------------------------------
    let warningCreated = null;
    if (isLate && personType === "employee" && !bypassApplied) {
      warningCreated = await checkAndCreateLateWarning(person.id, currentTime);
    }

    // ---------------------------------------------------------
    // 8. SAVE RECORD
    // ---------------------------------------------------------
    const attendanceData: any = {
      checkIn: checkInTimeToUse, // Use the calculated check-in time
      checkInMethod: method as CheckInMethod,
      checkInAddress: location || address,
      checkInLat: lat ? parseFloat(lat) : null,
      checkInLng: lng ? parseFloat(lng) : null,
      status: status,
      notes: notes || null,
      scheduledKnockIn: scheduledKnockInTime,
      scheduledKnockOut: scheduledKnockOutTime,
      isWeekend: isWeekend,
      // Store bypass info for auditing
      bypassApplied: bypassApplied,
      bypassRuleId: bypassResult.rule?.id || null,
    };

    // Add customCheckInTime as DateTime (matching the Prisma schema)
    if (customCheckInDateTime) {
      attendanceData.customCheckInTime = customCheckInDateTime;
    }

    if (personType === "employee") {
      attendanceData.employeeId = person.id;
    } else {
      attendanceData.freeLancerId = person.id;
    }

    // DECLARE attendanceRecord variable here
    let attendanceRecord: any = null;

    try {
      if (!existingRecord) {
        // Create new attendance record
        attendanceRecord = await db.attendanceRecord.create({
          data: {
            ...attendanceData,
            date: today,
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
      } else {
        // Update existing record (if check-in was null)
        attendanceRecord = await db.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: attendanceData,
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
      }
    } catch (dbError: any) {
      console.error("Database error creating attendance:", dbError);
      console.error("Attempted data:", {
        attendanceData: {
          ...attendanceData,
          date: today,
          customCheckInTime: attendanceData.customCheckInTime?.toISOString?.(),
        },
      });
      return NextResponse.json(
        {
          error: "Failed to create attendance record",
          details: dbError.message,
          code: dbError.code,
        },
        { status: 500 }
      );
    }

    // Send notification for successful check-in
    if (personType === "employee" && person.expoPushToken) {
      try {
        const checkInStatus = bypassApplied
          ? customCheckInTimeUsed
            ? `with custom time ${customCheckInTimeUsed}`
            : "with time restrictions bypassed"
          : isLate
            ? "marked as LATE"
            : "successful";

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
    // We don't await this so the UI response is fast
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
      customCheckInTime: customCheckInTimeUsed, // Return the string for display
      actualCheckInTime: checkInTimeToUse.toISOString(),
    });
  } catch (error: any) {
    console.error("Check-in error:", error);
    console.error("Error stack:", error.stack);
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
// ATTENDANCE BYPASS CHECK FUNCTION
// ---------------------------------------------------------
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
    // Build the where clause based on assignee type
    const where: any = {
      AND: [{ startDate: { lte: date } }, { endDate: { gte: date } }],
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

// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------

async function checkIfEmployeeOnLeave(
  employee: any,
  today: Date
): Promise<{ leaveType: string; reason: string } | null> {
  try {
    for (const leaveRequest of employee.leaveRequests) {
      const startDate = new Date(leaveRequest.startDate);
      const endDate = new Date(leaveRequest.endDate);

      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);

      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(23, 59, 59, 999);

      if (today >= normalizedStartDate && today <= normalizedEndDate) {
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
    startOfWeek.setDate(currentTime.getDate() - currentTime.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      1
    );
    startOfMonth.setHours(0, 0, 0, 0);

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

    // --- LOGIC ---
    if (warningType) {
      // 1. Create the Warning
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

      // 2. Create the Notification
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

      // 3. Return the warning
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
          // Determine if it's weekend for auto-attendance as well
          const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
          const todayDay = dayNames[today.getDay()];
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
    normalizedStartDate.setHours(0, 0, 0, 0);

    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999);

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
