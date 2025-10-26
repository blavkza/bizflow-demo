import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params;

    // Find employee by employeeId
    const employee = await db.employee.findFirst({
      where: { employeeNumber: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Get current year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1); // January 1st of current year
    const endOfYear = new Date(currentYear, 11, 31); // December 31st of current year

    // Get approved leave requests for this employee in the current year
    const approvedLeaves = await db.leaveRequest.findMany({
      where: {
        employeeId: employee.id,
        status: "APPROVED",
        OR: [
          {
            // Leaves that start in the current year
            startDate: {
              gte: startOfYear,
              lte: endOfYear,
            },
          },
          {
            // Leaves that end in the current year
            endDate: {
              gte: startOfYear,
              lte: endOfYear,
            },
          },
          {
            // Leaves that span across the current year
            startDate: { lte: startOfYear },
            endDate: { gte: endOfYear },
          },
        ],
      },
      select: {
        leaveType: true,
        startDate: true,
        endDate: true,
        days: true,
      },
    });

    // Calculate used days per leave type for current year only
    const usedDays = {
      ANNUAL: 0,
      SICK: 0,
      STUDY: 0,
      MATERNITY: 0,
      PATERNITY: 0,
      UNPAID: 0,
      COMPASSIONATE: 0,
    };

    approvedLeaves.forEach((leave) => {
      if (usedDays.hasOwnProperty(leave.leaveType)) {
        // For leaves that span multiple years, calculate only the days in current year
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);

        // Calculate actual days in current year
        const effectiveStart =
          leaveStart < startOfYear ? startOfYear : leaveStart;
        const effectiveEnd = leaveEnd > endOfYear ? endOfYear : leaveEnd;

        // Calculate days in current year
        const timeDiff = effectiveEnd.getTime() - effectiveStart.getTime();
        const daysInCurrentYear = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

        usedDays[leave.leaveType as keyof typeof usedDays] += daysInCurrentYear;
      }
    });

    // Calculate remaining days for current year
    const remainingDays = {
      ANNUAL: Math.max(0, employee.annualLeaveDays - usedDays.ANNUAL),
      SICK: Math.max(0, employee.sickLeaveDays - usedDays.SICK),
      STUDY: Math.max(0, employee.studyLeaveDays - usedDays.STUDY),
      MATERNITY: Math.max(0, employee.maternityLeaveDays - usedDays.MATERNITY),
      PATERNITY: Math.max(0, employee.paternityLeaveDays - usedDays.PATERNITY),
      UNPAID: Infinity, // Unlimited unpaid leave
      COMPASSIONATE: Math.max(0, 5 - usedDays.COMPASSIONATE), // Default 5 days compassionate leave
    };

    return NextResponse.json({
      usedDays,
      remainingDays,
      allocation: {
        ANNUAL: employee.annualLeaveDays,
        SICK: employee.sickLeaveDays,
        STUDY: employee.studyLeaveDays,
        MATERNITY: employee.maternityLeaveDays,
        PATERNITY: employee.paternityLeaveDays,
        UNPAID: employee.unpaidLeaveDays,
        COMPASSIONATE: 5, // Default
      },
      currentYear,
    });
  } catch (error) {
    console.error("Error fetching employee leave usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee leave usage" },
      { status: 500 }
    );
  }
}
