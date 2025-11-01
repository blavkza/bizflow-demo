import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  CheckInMethod,
  AttendanceStatus,
  EmployeeStatus,
  LeaveStatus,
} from "@prisma/client";
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

    // Find employee with scheduled times and leave requests
    const employee = await db.employee.findUnique({
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

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = new Date();

    // Check if employee is on leave today
    const isOnLeave = await checkIfEmployeeOnLeave(employee, today);

    if (isOnLeave) {
      return NextResponse.json(
        {
          error: "Employee is on approved leave today",
          leaveType: isOnLeave.leaveType,
          reason: isOnLeave.reason,
        },
        { status: 400 }
      );
    }

    // Check if employee status is ON_LEAVE
    if (employee.status === EmployeeStatus.ON_LEAVE) {
      return NextResponse.json(
        { error: "Employee is currently on leave status" },
        { status: 400 }
      );
    }

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
    let isLate = false;

    if (employee.scheduledKnockIn) {
      // Parse the time string (e.g., "20:00") to compare with current time
      const scheduledTimeString = employee.scheduledKnockIn;
      const [scheduledHours, scheduledMinutes] = scheduledTimeString
        .split(":")
        .map(Number);

      const scheduledDateTime = new Date();
      scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);

      // If current time is more than 30 minutes after scheduled time, mark as late
      const lateThreshold = new Date(scheduledDateTime.getTime() + 30 * 60000);

      if (currentTime > lateThreshold) {
        status = AttendanceStatus.LATE;
        isLate = true;
      }
    }

    //  Check for late attendance warnings
    let warningCreated = null;
    if (isLate) {
      warningCreated = await checkAndCreateLateWarning(
        employee.id,
        currentTime
      );
    }

    // Prepare data for create/update
    const attendanceData: any = {
      checkIn: currentTime,
      checkInMethod: method as CheckInMethod,
      checkInAddress: location || address,
      checkInLat: lat ? parseFloat(lat) : null,
      checkInLng: lng ? parseFloat(lng) : null,
      status: status,
      notes: notes || null,
    };

    // Only include scheduled times as strings
    if (employee.scheduledKnockIn) {
      attendanceData.scheduledKnockIn = employee.scheduledKnockIn;
    }
    if (employee.scheduledKnockOut) {
      attendanceData.scheduledKnockOut = employee.scheduledKnockOut;
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

    // ALWAYS trigger auto-attendance for leave employees in the background
    console.log("Triggering auto-attendance for leave employees...");
    triggerAutoAttendanceForLeave().catch((error) => {
      console.error("Auto-attendance background task failed:", error);
    });

    return NextResponse.json({
      message: "Check-in recorded successfully",
      record: attendanceRecord,
      status: status.toLowerCase(),
      isLate: isLate,
      warning: warningCreated,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Check if employee is on leave today
async function checkIfEmployeeOnLeave(
  employee: any,
  today: Date
): Promise<{ leaveType: string; reason: string } | null> {
  try {
    // Check if employee has approved leave for today
    for (const leaveRequest of employee.leaveRequests) {
      const startDate = new Date(leaveRequest.startDate);
      const endDate = new Date(leaveRequest.endDate);

      // Normalize dates for comparison
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

    // Check if employee status is ON_LEAVE
    if (employee.status === EmployeeStatus.ON_LEAVE) {
      return {
        leaveType: "ON_LEAVE",
        reason: "Employee is on leave status",
      };
    }

    return null;
  } catch (error) {
    console.error("Error checking leave status:", error);
    return null;
  }
}

// Check and create late attendance warnings
async function checkAndCreateLateWarning(
  employeeId: string,
  currentTime: Date
): Promise<any> {
  try {
    // Get start of week (Monday)
    const startOfWeek = new Date(currentTime);
    startOfWeek.setDate(currentTime.getDate() - currentTime.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    // Get start of month
    const startOfMonth = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      1
    );
    startOfMonth.setHours(0, 0, 0, 0);

    // Count late attendances for the week (EXCLUDING today's record)
    const weeklyLateCount = await db.attendanceRecord.count({
      where: {
        employeeId: employeeId,
        status: AttendanceStatus.LATE,
        date: {
          gte: startOfWeek,
          lt: currentTime, // Use lt instead of lte to exclude today
        },
      },
    });

    // Count late attendances for the month (EXCLUDING today's record)
    const monthlyLateCount = await db.attendanceRecord.count({
      where: {
        employeeId: employeeId,
        status: AttendanceStatus.LATE,
        date: {
          gte: startOfMonth,
          lt: currentTime, // Use lt instead of lte to exclude today
        },
      },
    });

    console.log(
      `Late counts for employee ${employeeId}: Week=${weeklyLateCount} (before today), Month=${monthlyLateCount} (before today)`
    );

    let warningType = "";
    let severity = "";
    let reason = "";
    let actionPlan = "";

    // Check warning conditions
    // If employee was late once this week before today, and today is late = second time this week
    if (weeklyLateCount === 1) {
      warningType = "Attendance";
      severity = "MEDIUM";
      reason = `Second late attendance this week. You were late ${weeklyLateCount + 1} times this week and ${monthlyLateCount + 1} times this month.`;
      actionPlan =
        "Please ensure punctuality. Further late arrivals may result in disciplinary action.";
    }
    // If employee was late twice this month before today, and today is late = third time this month
    else if (monthlyLateCount === 2) {
      warningType = "Attendance";
      severity = "HIGH";
      reason = `Third late attendance this month. You were late ${weeklyLateCount + 1} times this week and ${monthlyLateCount + 1} times this month.`;
      actionPlan =
        "This is a formal warning regarding persistent late attendance. Immediate improvement is required.";
    }

    // Create warning if conditions met
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

      console.log(
        `Created attendance warning for employee ${employeeId}: ${severity} severity - ${reason}`
      );
      return warning;
    }

    return null;
  } catch (error) {
    console.error("Error creating late warning:", error);
    return null;
  }
}

// Background function to create auto-attendance records for leave employees
async function triggerAutoAttendanceForLeave() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log("Auto-attendance: Creating records for leave employees...");
    console.log("Today's date:", today.toDateString());

    // Get all employees who are on leave OR have approved leave requests
    const employees = await db.employee.findMany({
      where: {
        OR: [
          { status: EmployeeStatus.ON_LEAVE },
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

    console.log(
      `Auto-attendance: Found ${employees.length} employees on leave or with approved leave`
    );

    const createdRecords = [];

    for (const employee of employees) {
      try {
        // Skip if record already exists for today
        if (employee.AttendanceRecord.length > 0) {
          console.log(
            `Auto-attendance: Skipping ${employee.firstName} ${employee.lastName} - record already exists`
          );
          continue;
        }

        const shouldCreateRecord = await shouldCreateLeaveAttendanceRecord(
          employee,
          today
        );

        if (shouldCreateRecord.shouldCreate) {
          const attendanceRecord = await db.attendanceRecord.create({
            data: {
              employeeId: employee.id,
              date: today,
              status: shouldCreateRecord.status!,
              scheduledKnockIn: employee.scheduledKnockIn,
              scheduledKnockOut: employee.scheduledKnockOut,
              notes: shouldCreateRecord.notes,
            },
          });

          createdRecords.push({
            id: attendanceRecord.id,
            employee: `${employee.firstName} ${employee.lastName}`,
            status: attendanceRecord.status,
            notes: attendanceRecord.notes,
          });

          console.log(
            `Auto-attendance: Created leave record for ${employee.firstName} ${employee.lastName}: ${attendanceRecord.status}`
          );
        } else {
          console.log(
            `Auto-attendance: Skipping ${employee.firstName} ${employee.lastName} - shouldCreateRecord returned false`
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
      `Auto-attendance: Completed. Created ${createdRecords.length} leave records.`
    );
    return createdRecords;
  } catch (error) {
    console.error("Auto-attendance for leave employees: Failed:", error);
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
  // Check if employee has approved leave for today
  const approvedLeaveToday = employee.leaveRequests.find((leave: any) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);

    // Normalize dates for comparison
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);

    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999);

    console.log(
      `Checking leave: ${leave.leaveType} from ${normalizedStartDate.toDateString()} to ${normalizedEndDate.toDateString()} vs target: ${targetDate.toDateString()}`
    );
    console.log(`Is target >= start? ${targetDate >= normalizedStartDate}`);
    console.log(`Is target <= end? ${targetDate <= normalizedEndDate}`);

    return targetDate >= normalizedStartDate && targetDate <= normalizedEndDate;
  });

  // Employee has approved leave for today - create leave record
  if (approvedLeaveToday) {
    console.log(
      `Employee ${employee.firstName} ${employee.lastName} has approved leave for today: ${approvedLeaveToday.leaveType}`
    );
    return {
      shouldCreate: true,
      status: getLeaveAttendanceStatus(approvedLeaveToday.leaveType),
      notes: `Auto-created: ${getLeaveTypeDisplayName(approvedLeaveToday.leaveType)} - ${approvedLeaveToday.reason || "Approved Leave"}`,
    };
  }

  // Check if employee is on leave status (without specific approved leave request)
  if (employee.status === EmployeeStatus.ON_LEAVE) {
    console.log(
      `Employee ${employee.firstName} ${employee.lastName} has ON_LEAVE status`
    );
    return {
      shouldCreate: true,
      status: AttendanceStatus.ANNUAL_LEAVE,
      notes: "Auto-created: On Leave Status",
    };
  }

  console.log(
    `shouldCreateLeaveAttendanceRecord: No condition met for employee ${employee.firstName} ${employee.lastName}`
  );
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
