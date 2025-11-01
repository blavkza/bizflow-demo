import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";
import { calculateOvertime } from "@/lib/overtime-calculations";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    if (!month) {
      return NextResponse.json(
        { error: "Month parameter is required" },
        { status: 400 }
      );
    }

    // Get HR settings for overtime calculation
    const hrSettings = await db.hRSettings.findFirst();
    if (!hrSettings) {
      return NextResponse.json(
        { error: "HR settings not found" },
        { status: 400 }
      );
    }

    // Parse month and get date range
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    console.log(
      `Fetching payroll data for ${month}: ${startDate} to ${endDate}`
    );

    const employees = await db.employee.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        department: {
          include: {
            manager: {
              select: {
                name: true,
              },
            },
          },
        },
        payments: {
          where: {
            payDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            amount: true,
            payDate: true,
          },
        },
        // Get attendance records for the month
        AttendanceRecord: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            id: true,
            date: true,
            status: true,
            regularHours: true,
            overtimeHours: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
    });

    console.log(
      `Found ${employees.length} employees with ${employees.reduce((acc, emp) => acc + emp.AttendanceRecord.length, 0)} attendance records`
    );

    // Calculate worked days and amounts for each employee with overtime
    const employeesWithCalculations = employees.map((employee) => {
      const dailySalary = Number(employee.salary) || 0; // This is DAILY rate
      const dailyRate = dailySalary;

      // Count paid days and calculate overtime
      let totalRegularHours = 0;
      let totalOvertimeHours = 0;
      let totalOvertimeAmount = 0;

      const paidDays = employee.AttendanceRecord.filter((record) => {
        const isPaidDay =
          record.status !== AttendanceStatus.ABSENT &&
          record.status !== AttendanceStatus.UNPAID_LEAVE;

        if (isPaidDay && record.overtimeHours) {
          totalOvertimeHours += Number(record.overtimeHours);

          // Calculate overtime amount using FIXED RATE with DAILY salary
          const overtimeCalc = calculateOvertime(
            record.regularHours,
            record.overtimeHours,
            dailySalary, // Pass daily salary instead of monthly
            hrSettings.overtimeHourRate // Fixed amount (e.g., 50)
          );

          totalOvertimeAmount += overtimeCalc.overtimeAmount;
        }

        if (isPaidDay && record.regularHours) {
          totalRegularHours += Number(record.regularHours);
        }

        return isPaidDay;
      }).length;

      // Calculate base amount (daily rate * paid days)
      const baseAmount = parseFloat((dailyRate * paidDays).toFixed(2)) || 0;

      // Total amount including overtime - THIS IS THE KEY CALCULATION
      const totalAmount = parseFloat(
        (baseAmount + totalOvertimeAmount).toFixed(2)
      );

      console.log(`Employee ${employee.firstName} ${employee.lastName}:`, {
        dailySalary,
        paidDays,
        baseAmount,
        overtimeHours: totalOvertimeHours,
        overtimeAmount: totalOvertimeAmount,
        totalAmount,
      });

      // Calculate attendance breakdown
      const presentDays = employee.AttendanceRecord.filter(
        (record) =>
          record.status === AttendanceStatus.PRESENT ||
          record.status === AttendanceStatus.LATE
      ).length;

      const halfDays = employee.AttendanceRecord.filter(
        (record) => record.status === AttendanceStatus.HALF_DAY
      ).length;

      const leaveDays = employee.AttendanceRecord.filter(
        (record) =>
          record.status === AttendanceStatus.ANNUAL_LEAVE ||
          record.status === AttendanceStatus.SICK_LEAVE
      ).length;

      const absentDays = employee.AttendanceRecord.filter(
        (record) => record.status === AttendanceStatus.ABSENT
      ).length;

      const unpaidLeaveDays = employee.AttendanceRecord.filter(
        (record) => record.status === AttendanceStatus.UNPAID_LEAVE
      ).length;

      return {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        salary: employee.salary,
        department: employee.department,
        dailySalary: dailySalary,
        dailyRate: dailyRate,
        paidDays: paidDays,
        baseAmount: baseAmount,
        overtimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
        overtimeAmount: parseFloat(totalOvertimeAmount.toFixed(2)),
        amount: totalAmount, // THIS MUST BE SET CORRECTLY
        totalAmount: totalAmount, // Added for clarity
        regularHours: parseFloat(totalRegularHours.toFixed(2)),
        overtimeFixedRate: hrSettings.overtimeHourRate,
        attendanceRecords: employee.AttendanceRecord.length,
        attendanceBreakdown: {
          presentDays: presentDays,
          halfDays: halfDays,
          leaveDays: leaveDays,
          absentDays: absentDays,
          unpaidLeaveDays: unpaidLeaveDays,
          totalDays: employee.AttendanceRecord.length,
        },
      };
    });

    // Debug: Check final amounts
    const totalCalculated = employeesWithCalculations.reduce(
      (sum, emp) => sum + emp.amount,
      0
    );
    console.log("Total calculated payroll:", totalCalculated);
    console.log("Employees with calculations:", employeesWithCalculations);

    return NextResponse.json(employeesWithCalculations);
  } catch (error) {
    console.error("Failed to fetch payroll calculations:", error);
    return NextResponse.json(
      { message: "Failed to fetch payroll calculations", error },
      { status: 500 }
    );
  }
}
