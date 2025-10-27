import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { AttendanceStatus, EmployeeStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Build where clause for active employees
    const activeEmployeesWhere: any = {
      status: EmployeeStatus.ACTIVE,
    };

    if (department && department !== "All Departments") {
      activeEmployeesWhere.department = {
        name: department,
      };
    }

    // Get all active employees with their scheduled times
    const activeEmployees = await db.employee.findMany({
      where: activeEmployeesWhere,
      include: {
        department: true,
        // Get today's attendance record if it exists
        AttendanceRecord: {
          where: {
            date: targetDate,
          },
          take: 1,
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    // Transform data to include calculated status
    const records = activeEmployees.map((employee) => {
      const todayRecord = employee.AttendanceRecord[0];
      const currentTime = new Date();

      // Calculate status based on current time and employee's scheduled times
      let status: AttendanceStatus;
      let displayStatus: string;

      if (todayRecord) {
        // Employee has an attendance record for today
        status = todayRecord.status;
        displayStatus = getStatusDisplayName(todayRecord.status);
      } else {
        // No attendance record - calculate based on current time and employee's scheduled times
        const calculatedStatus = calculateAttendanceStatus(
          employee,
          currentTime,
          targetDate
        );
        status = calculatedStatus.status;
        displayStatus = calculatedStatus.displayStatus;
      }

      return {
        id: todayRecord?.id || `virtual-${employee.id}`,
        employeeId: employee.id,
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeNumber: employee.employeeNumber,
          avatar: employee.avatar,
          position: employee.position,
          department: employee.department,
          scheduledKnockIn: employee.scheduledKnockIn, // From employee record
          scheduledKnockOut: employee.scheduledKnockOut, // From employee record
          workingDays: employee.workingDays, // From employee record
        },
        date: targetDate.toISOString(),
        checkIn: todayRecord?.checkIn,
        checkOut: todayRecord?.checkOut,
        checkInMethod: todayRecord?.checkInMethod,
        checkInAddress: todayRecord?.checkInAddress,
        checkInLat: todayRecord?.checkInLat,
        checkInLng: todayRecord?.checkInLng,
        regularHours: todayRecord?.regularHours,
        overtimeHours: todayRecord?.overtimeHours,
        notes: todayRecord?.notes,
        status,
        displayStatus,
        isVirtualRecord: !todayRecord,
        createdAt: todayRecord?.createdAt,
        updatedAt: todayRecord?.updatedAt,
      };
    });

    // Filter by status if specified
    let filteredRecords = records;
    if (status && status !== "All Status") {
      const statusMap: { [key: string]: AttendanceStatus } = {
        Present: AttendanceStatus.PRESENT,
        Late: AttendanceStatus.LATE,
        Absent: AttendanceStatus.ABSENT,
        "Annual Leave": AttendanceStatus.ANNUAL_LEAVE,
        "Sick Leave": AttendanceStatus.SICK_LEAVE,
      };

      const targetStatus = statusMap[status];
      if (targetStatus) {
        filteredRecords = records.filter(
          (record) => record.status === targetStatus
        );
      }
    }

    return NextResponse.json({ records: filteredRecords });
  } catch (error) {
    console.error("Fetch attendance records error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateAttendanceStatus(
  employee: any,
  currentTime: Date,
  targetDate: Date
) {
  const today = new Date().toDateString();
  const targetDay = targetDate.toDateString();
  const isToday = today === targetDay;

  // Check if employee is on leave
  const isOnLeave = employee.status === EmployeeStatus.ON_LEAVE;
  if (isOnLeave) {
    return {
      status: AttendanceStatus.ANNUAL_LEAVE,
      displayStatus: "On Leave",
    };
  }

  // Check if today is a working day for this employee
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const todayDay = dayNames[currentTime.getDay()];
  const workingDays = Array.isArray(employee.workingDays)
    ? employee.workingDays
    : employee.workingDays
      ? JSON.parse(employee.workingDays)
      : [];

  const isWorkingDay = workingDays.includes(todayDay);

  if (!isWorkingDay) {
    return {
      status: AttendanceStatus.ABSENT,
      displayStatus: "Day Off",
    };
  }

  if (!isToday) {
    // For past dates without record, mark as absent
    return {
      status: AttendanceStatus.ABSENT,
      displayStatus: "Absent",
    };
  }

  // For today - calculate based on employee's scheduled times
  if (!employee.scheduledKnockIn || !employee.scheduledKnockOut) {
    return {
      status: AttendanceStatus.ABSENT,
      displayStatus: "No Schedule",
    };
  }

  // Get scheduled times from employee record
  const scheduledKnockIn = new Date(employee.scheduledKnockIn);
  const scheduledKnockOut = new Date(employee.scheduledKnockOut);

  // Set scheduled times to today for comparison
  const scheduledInToday = new Date(currentTime);
  scheduledInToday.setHours(
    scheduledKnockIn.getHours(),
    scheduledKnockIn.getMinutes(),
    0,
    0
  );

  const scheduledOutToday = new Date(currentTime);
  scheduledOutToday.setHours(
    scheduledKnockOut.getHours(),
    scheduledKnockOut.getMinutes(),
    0,
    0
  );

  const lateThreshold = new Date(scheduledInToday.getTime() + 30 * 60000); // 15 minutes grace period

  if (currentTime < scheduledInToday) {
    // Before scheduled knock-in time - show as ABSENT but "Not Checked In"
    return {
      status: AttendanceStatus.ABSENT,
      displayStatus: "Not Checked In",
    };
  } else if (currentTime >= scheduledInToday && currentTime <= lateThreshold) {
    // Within grace period - show as ABSENT but "Not Checked In"
    return {
      status: AttendanceStatus.ABSENT,
      displayStatus: "Not Checked In",
    };
  } else if (currentTime > lateThreshold && currentTime <= scheduledOutToday) {
    // After grace period but before knock-out - show as ABSENT but "Not Checked In - Late"
    return {
      status: AttendanceStatus.ABSENT,
      displayStatus: "Not Checked In - Late",
    };
  } else if (currentTime > scheduledOutToday) {
    // After scheduled knock-out time without checking in - show as ABSENT
    return {
      status: AttendanceStatus.ABSENT,
      displayStatus: "Absent",
    };
  }

  // Default fallback
  return {
    status: AttendanceStatus.ABSENT,
    displayStatus: "Not Checked In",
  };
}

function getStatusDisplayName(status: AttendanceStatus): string {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return "Present";
    case AttendanceStatus.LATE:
      return "Late";
    case AttendanceStatus.ABSENT:
      return "Absent";
    case AttendanceStatus.ANNUAL_LEAVE:
      return "Annual Leave";
    case AttendanceStatus.SICK_LEAVE:
      return "Sick Leave";
    case AttendanceStatus.UNPAID_LEAVE:
      return "Unpaid Leave";
    case AttendanceStatus.HALF_DAY:
      return "Half Day";
    default:
      return status;
  }
}
