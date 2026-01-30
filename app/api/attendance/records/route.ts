import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import {
  AttendanceStatus,
  EmployeeStatus,
  FreeLancerStatus,
  UserRole,
} from "@prisma/client";

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

    // Helper function to determine if a date is weekend
    const isWeekend = (date: Date): boolean => {
      const day = date.getDay();
      return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
    };

    // Helper function to get appropriate scheduled times
    const getScheduledTimes = (person: any, date: Date) => {
      const weekend = isWeekend(date);

      if (weekend) {
        return {
          knockIn:
            person.scheduledWeekendKnockIn ?? person.scheduledKnockIn ?? null,
          knockOut:
            person.scheduledWeekendKnockOut ?? person.scheduledKnockOut ?? null,
          isWeekend: true,
        };
      } else {
        return {
          knockIn: person.scheduledKnockIn ?? null,
          knockOut: person.scheduledKnockOut ?? null,
          isWeekend: false,
        };
      }
    };

    const user = await db.user.findUnique({
      where: { userId },
      include: { employee: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine if user has full access
    const hasFullAccess =
      user.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
      user.role === UserRole.ADMIN_MANAGER;

    // Build where clause for active employees and freelancers
    const activeEmployeesWhere: any = {
      status: EmployeeStatus.ACTIVE,
    };

    const activeFreelancersWhere: any = {
      status: FreeLancerStatus.ACTIVE,
    };

    // Apply department filter if not full access
    if (!hasFullAccess && user.employee?.departmentId) {
      activeEmployeesWhere.departmentId = user.employee.departmentId;
      activeFreelancersWhere.departmentId = user.employee.departmentId;
    }

    // Further filter by requested department if specified and allowed
    if (department && department !== "All Departments") {
      activeEmployeesWhere.department = { name: department };
      activeFreelancersWhere.department = { name: department };
    }

    // Get all active employees with their scheduled times
    const activeEmployees = await db.employee.findMany({
      where: activeEmployeesWhere,
      include: {
        department: true,
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

    // Get all active freelancers with their scheduled times
    const activeFreelancers = await db.freeLancer.findMany({
      where: activeFreelancersWhere,
      include: {
        department: true,
        attendanceRecords: {
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

    const currentTime = new Date();

    // Transform employee data
    const employeeRecords = activeEmployees.map((employee) => {
      const todayRecord = employee.AttendanceRecord[0];
      const {
        knockIn: scheduledKnockIn,
        knockOut: scheduledKnockOut,
        isWeekend,
      } = getScheduledTimes(employee, targetDate);

      let status: AttendanceStatus;
      let displayStatus: string;

      if (todayRecord) {
        status = todayRecord.status;
        displayStatus = getStatusDisplayName(todayRecord.status);
      } else {
        const calculatedStatus = calculateAttendanceStatus(
          employee,
          currentTime,
          targetDate,
          "employee",
          scheduledKnockIn,
          scheduledKnockOut,
          isWeekend
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
          scheduledKnockIn: scheduledKnockIn,
          scheduledKnockOut: scheduledKnockOut,
          scheduledWeekendKnockIn: employee.scheduledWeekendKnockIn,
          scheduledWeekendKnockOut: employee.scheduledWeekendKnockOut,
          workingDays: employee.workingDays,
          overtimeHourRate: employee.overtimeHourRate,
        },
        freeLancer: null,
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
        isWeekend: isWeekend,
        personType: "employee" as const,
        createdAt: todayRecord?.createdAt,
        updatedAt: todayRecord?.updatedAt,
      };
    });

    // Transform freelancer data
    const freelancerRecords = activeFreelancers.map((freelancer) => {
      const todayRecord = freelancer.attendanceRecords[0];
      const {
        knockIn: scheduledKnockIn,
        knockOut: scheduledKnockOut,
        isWeekend,
      } = getScheduledTimes(freelancer, targetDate);

      let status: AttendanceStatus;
      let displayStatus: string;

      if (todayRecord) {
        status = todayRecord.status;
        displayStatus = getStatusDisplayName(todayRecord.status);
      } else {
        const calculatedStatus = calculateAttendanceStatus(
          freelancer,
          currentTime,
          targetDate,
          "freelancer",
          scheduledKnockIn,
          scheduledKnockOut,
          isWeekend
        );
        status = calculatedStatus.status;
        displayStatus = calculatedStatus.displayStatus;
      }

      return {
        id: todayRecord?.id || `virtual-${freelancer.id}`,
        freeLancerId: freelancer.id,
        freeLancer: {
          id: freelancer.id,
          firstName: freelancer.firstName,
          lastName: freelancer.lastName,
          freeLancerNumber: freelancer.freeLancerNumber,
          avatar: freelancer.avatar,
          position: freelancer.position,
          department: freelancer.department,
          scheduledKnockIn: scheduledKnockIn,
          scheduledKnockOut: scheduledKnockOut,
          scheduledWeekendKnockIn: freelancer.scheduledWeekendKnockIn,
          scheduledWeekendKnockOut: freelancer.scheduledWeekendKnockOut,
          workingDays: freelancer.workingDays,
          overtimeHourRate: freelancer.overtimeHourRate,
        },
        employee: null,
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
        isWeekend: isWeekend,
        personType: "freelancer" as const,
        createdAt: todayRecord?.createdAt,
        updatedAt: todayRecord?.updatedAt,
      };
    });

    // Combine both employee and freelancer records
    const allRecords = [...employeeRecords, ...freelancerRecords];

    // Filter by status if specified
    let filteredRecords = allRecords;
    if (status && status !== "All Status") {
      const statusMap: { [key: string]: AttendanceStatus } = {
        Present: AttendanceStatus.PRESENT,
        Late: AttendanceStatus.LATE,
        Absent: AttendanceStatus.ABSENT,
        "Annual Leave": AttendanceStatus.ANNUAL_LEAVE,
        "Sick Leave": AttendanceStatus.SICK_LEAVE,
        "Half Day": AttendanceStatus.HALF_DAY,
      };

      const targetStatus = statusMap[status];
      if (targetStatus) {
        filteredRecords = allRecords.filter(
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
  person: any,
  currentTime: Date,
  targetDate: Date,
  personType: "employee" | "freelancer",
  scheduledKnockIn: string | null,
  scheduledKnockOut: string | null,
  isWeekend: boolean
) {
  const today = new Date().toDateString();
  const targetDay = targetDate.toDateString();
  const isToday = today === targetDay;

  // Check if today is a working day for this person
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const todayDay = dayNames[currentTime.getDay()];
  const workingDays = Array.isArray(person.workingDays)
    ? person.workingDays
    : person.workingDays
      ? JSON.parse(person.workingDays)
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

  // For today - calculate based on person's scheduled times
  if (!scheduledKnockIn || !scheduledKnockOut) {
    return {
      status: AttendanceStatus.ABSENT,
      displayStatus: "No Schedule",
    };
  }

  // Get scheduled times from person record
  const scheduledTimeIn = new Date(`1970-01-01T${scheduledKnockIn}`);
  const scheduledTimeOut = new Date(`1970-01-01T${scheduledKnockOut}`);

  // Set scheduled times to today for comparison
  const scheduledInToday = new Date(currentTime);
  scheduledInToday.setHours(
    scheduledTimeIn.getHours(),
    scheduledTimeIn.getMinutes(),
    0,
    0
  );

  const scheduledOutToday = new Date(currentTime);
  scheduledOutToday.setHours(
    scheduledTimeOut.getHours(),
    scheduledTimeOut.getMinutes(),
    0,
    0
  );

  const lateThreshold = new Date(scheduledInToday.getTime() + 30 * 60000); // 30 minutes grace period

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
    case AttendanceStatus.MATERNITY_LEAVE:
      return "Maternity Leave";
    case AttendanceStatus.PATERNITY_LEAVE:
      return "Paternity Leave";
    case AttendanceStatus.STUDY_LEAVE:
      return "Study Leave";
    default:
      return status;
  }
}
