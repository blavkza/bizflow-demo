import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: "2024-01"

    if (!month) {
      return NextResponse.json(
        { error: "Month parameter is required" },
        { status: 400 }
      );
    }

    // Parse month and get date range
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of month

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
          },
        },
      },
    });

    console.log(
      `Found ${employees.length} employees with ${employees.reduce((acc, emp) => acc + emp.AttendanceRecord.length, 0)} attendance records`
    );

    // Calculate worked days and amounts for each employee
    const employeesWithCalculations = employees.map((employee) => {
      const monthlySalary = Number(employee.salary) || 0;

      // Use monthly salary as daily rate (as per your requirement)
      const dailyRate = monthlySalary;

      // Count paid days (exclude unpaid leave and absent)
      const paidDays = employee.AttendanceRecord.filter(
        (record) =>
          record.status !== AttendanceStatus.ABSENT &&
          record.status !== AttendanceStatus.UNPAID_LEAVE
      ).length;

      const calculatedAmount =
        parseFloat((dailyRate * paidDays).toFixed(2)) || 0;

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
        monthlySalary: monthlySalary,
        dailyRate: dailyRate,
        paidDays: paidDays,
        calculatedAmount: calculatedAmount,
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

    return NextResponse.json(employeesWithCalculations);
  } catch (error) {
    console.error("Failed to fetch payroll calculations:", error);
    return NextResponse.json(
      { message: "Failed to fetch payroll calculations", error },
      { status: 500 }
    );
  }
}
