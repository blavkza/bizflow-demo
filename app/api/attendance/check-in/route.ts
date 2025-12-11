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
    // 2. ROBUST TIMEZONE CALCULATION (FIXED)
    // ---------------------------------------------------------
    // This method ensures we get SAST time regardless of server timezone (Localhost vs Cloud)
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

    const parts = sastFormatter.formatToParts(now);
    const getDatePart = (type: string) =>
      parts.find((p) => p.type === type)?.value;

    const year = getDatePart("year");
    const month = getDatePart("month");
    const day = getDatePart("day");
    const hour = getDatePart("hour");
    const minute = getDatePart("minute");
    const second = getDatePart("second");

    // Create Date objects representing SAST wall-clock time
    const currentTimeString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    const todayString = `${year}-${month}-${day}T00:00:00`;

    const currentTime = new Date(currentTimeString);
    const today = new Date(todayString); // This represents 00:00:00 SAST

    // ---------------------------------------------------------
    // 3. CHECK FOR ATTENDANCE BYPASS RULES
    // ---------------------------------------------------------
    const bypassResult = await checkAttendanceBypass(
      person.id,
      personType,
      currentTime
    );

    console.log(`=== CHECK-IN BYPASS DEBUG ===`);
    console.log(`Person: ${personType} ${person.id}`);
    console.log(`Current time SAST: ${currentTime.toISOString()}`);
    console.log(`Today SAST: ${today.toISOString()}`);
    console.log(`Bypass result:`, bypassResult);
    console.log(`HR Settings:`, {
      gracePeriodMinutes,
      overtimeThreshold,
      halfDayThreshold,
      workingHoursPerDay,
    });

    // ---------------------------------------------------------
    // 4. DETERMINE ATTENDANCE DATE (HANDLE NIGHT SHIFTS)
    // ---------------------------------------------------------
    let attendanceDate = today; // Default to today
    let isNightShift = false;
    let customCheckInTimeUsed: string | null = null;

    if (
      bypassResult.bypassCheckIn &&
      bypassResult.customCheckInTime &&
      bypassResult.customCheckInTime !== "none"
    ) {
      customCheckInTimeUsed = bypassResult.customCheckInTime;
      const [hours] = customCheckInTimeUsed.split(":").map(Number);

      // Night shift logic
      if (hours >= 18 || hours < 6) {
        isNightShift = true;
        if (hours < 6) {
          // Check-in before 6 AM belongs to previous day's shift
          attendanceDate = new Date(today);
          attendanceDate.setDate(attendanceDate.getDate() - 1);
          console.log(
            `Night shift: Check-in at ${customCheckInTimeUsed} recorded for previous day: ${attendanceDate.toDateString()}`
          );
        } else {
          // Check-in after 6 PM belongs to current day's night shift
          console.log(
            `Night shift: Check-in at ${customCheckInTimeUsed} recorded for current day`
          );
        }
      }
    }

    // ---------------------------------------------------------
    // 5. VALIDATION CHECKS
    // ---------------------------------------------------------

    // Check if employee is on leave for the attendance date
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

    // Check if it's a working day for the attendance date
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const attendanceDay = dayNames[attendanceDate.getDay()];

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
        `Allowing check-in on non-working day due to bypass for ${personType} ${person.id}`
      );
    }

    // Check if already checked in for this attendance date
    const existingRecord =
      personType === "employee"
        ? await db.attendanceRecord.findFirst({
            where: {
              employeeId: person.id,
              date: attendanceDate, // Matches exact date object
              checkIn: {
                not: null,
              },
            },
          })
        : await db.attendanceRecord.findFirst({
            where: {
              freeLancerId: person.id,
              date: attendanceDate, // Matches exact date object
              checkIn: {
                not: null,
              },
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
    // 6. DETERMINE IF WEEKDAY OR WEEKEND
    // ---------------------------------------------------------
    const isWeekend = attendanceDay === "SAT" || attendanceDay === "SUN";

    // Get scheduled times
    let scheduledKnockInTime: string | null = null;
    let scheduledKnockOutTime: string | null = null;

    if (isWeekend) {
      scheduledKnockInTime =
        person.scheduledWeekendKnockIn || person.scheduledKnockIn;
      scheduledKnockOutTime =
        person.scheduledWeekendKnockOut || person.scheduledKnockOut;
    } else {
      scheduledKnockInTime = person.scheduledKnockIn;
      scheduledKnockOutTime = person.scheduledKnockOut;
    }

    // ---------------------------------------------------------
    // 7. STATUS CALCULATION WITH BYPASS & NIGHT SHIFT SUPPORT
    // ---------------------------------------------------------
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    let isLate = false;
    let bypassApplied = false;
    let checkInTimeToUse: Date = currentTime;
    let customCheckInDateTime: Date | null = null;

    if (bypassResult.bypassCheckIn) {
      bypassApplied = true;

      if (customCheckInTimeUsed) {
        const [hours, minutes] = customCheckInTimeUsed.split(":").map(Number);

        // Create check-in time based on attendance date
        checkInTimeToUse = new Date(attendanceDate);

        // Handle night shift date adjustments
        if (hours >= 18) {
          // If check-in time is after 6 PM, keep it on the attendance date
          checkInTimeToUse.setHours(hours, minutes, 0, 0);
        } else if (hours < 6 && !isNightShift) {
          // Early morning check-in for current day (not night shift)
          checkInTimeToUse.setHours(hours, minutes, 0, 0);
        } else {
          // Normal day shift or adjusted night shift
          checkInTimeToUse.setHours(hours, minutes, 0, 0);
        }

        customCheckInDateTime = new Date(checkInTimeToUse);

        console.log(`Check-in time set:`, {
          customTime: customCheckInTimeUsed,
          attendanceDate: attendanceDate.toDateString(),
          checkInTime: checkInTimeToUse.toISOString(),
          isNightShift: isNightShift,
          hours: hours,
        });
      }

      status = AttendanceStatus.PRESENT;
      isLate = false;
      console.log(
        `Bypass applied: Status forced to PRESENT for ${personType} ${person.id}`
      );
    } else if (scheduledKnockInTime) {
      // Handle scheduled time validation
      const [scheduledHours, scheduledMinutes] = scheduledKnockInTime
        .split(":")
        .map(Number);

      const scheduledDateTime = new Date(attendanceDate);
      scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);

      // Adjust for night shifts (scheduled time after 6 PM)
      if (scheduledHours >= 18) {
        scheduledDateTime.setDate(scheduledDateTime.getDate() + 1);
      }

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
    // 8. WARNINGS (For Employees Only) - Skip if bypass applied
    // ---------------------------------------------------------
    let warningCreated = null;
    if (isLate && personType === "employee" && !bypassApplied) {
      warningCreated = await checkAndCreateLateWarning(person.id, currentTime);
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

    if (customCheckInDateTime) {
      attendanceData.customCheckInTime = customCheckInDateTime;
    }

    if (personType === "employee") {
      attendanceData.employeeId = person.id;
    } else {
      attendanceData.freeLancerId = person.id;
    }

    // (FIXED) USE ATTENDANCE DATE DIRECTLY
    // We removed the double subtraction logic.
    // attendanceDate represents SAST Midnight. Prisma handles the storage.
    const attendanceDateUTC = attendanceDate;

    console.log(`Creating attendance record:`, {
      personType,
      personId: person.id,
      attendanceDate: attendanceDate.toISOString().split("T")[0],
      checkInTime: checkInTimeToUse.toISOString(),
      status: status,
      bypassApplied: bypassApplied,
      isNightShift: isNightShift,
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
      });

      // Send notification
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
        isNightShift: isNightShift,
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

      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);

      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(23, 59, 59, 999);

      if (date >= normalizedStartDate && date <= normalizedEndDate) {
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
