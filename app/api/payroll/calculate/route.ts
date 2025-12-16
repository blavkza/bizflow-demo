import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";
import { calculatePayroll } from "@/lib/payroll-calculations";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const workerType = searchParams.get("workerType") || "all";

    if (!month) {
      return NextResponse.json(
        { error: "Month parameter is required" },
        { status: 400 }
      );
    }

    // Get HR settings
    const hrSettings = await db.hRSettings.findFirst();
    if (!hrSettings) {
      return NextResponse.json(
        { error: "HR settings not configured" },
        { status: 400 }
      );
    }

    // Parse month and get date range
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of the month

    // Calculate working days in month
    const workingDaysInMonth = getWorkingDaysInMonth(year, monthNum);

    // --- STEP 1: Identify workers who are ALREADY PAID for this month ---
    const existingPayments = await db.payment.findMany({
      where: {
        Payroll: {
          month: month,
        },
      },
      select: {
        employeeId: true,
        freeLancerId: true,
      },
    });

    const paidWorkerIds = new Set(
      existingPayments
        .flatMap((p) => [p.employeeId, p.freeLancerId])
        .filter(Boolean) as string[]
    );

    // --- STEP 2: Fetch and Filter Workers ---
    let employees: any[] = [];
    let freelancers: any[] = [];

    if (workerType === "all" || workerType === "employees") {
      const allEmployees = await db.employee.findMany({
        where: {
          status: "ACTIVE",
          // Ensure hire date is before or during this month
          hireDate: {
            lte: endDate,
          },
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

      // Filter out those who are already paid
      employees = allEmployees.filter((emp) => !paidWorkerIds.has(emp.id));
    }

    if (workerType === "all" || workerType === "freelancers") {
      const allFreelancers = await db.freeLancer.findMany({
        where: {
          status: "ACTIVE",
          // Ensure hire date is before or during this month
          hireDate: {
            lte: endDate,
          },
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
          attendanceRecords: {
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

      // Filter out those who are already paid
      freelancers = allFreelancers.filter(
        (free) => !paidWorkerIds.has(free.id)
      );
    }

    // --- STEP 3: Process only the remaining (unpaid) workers ---

    // Process employees
    const employeeCalculations = await Promise.all(
      employees.map(async (employee) => {
        return calculateWorkerPayroll(
          employee,
          false,
          workingDaysInMonth,
          hrSettings
        );
      })
    );

    // Process freelancers
    const freelancerCalculations = await Promise.all(
      freelancers.map((freelancer) => {
        return calculateWorkerPayroll(
          freelancer,
          true,
          workingDaysInMonth,
          hrSettings
        );
      })
    );

    const allCalculations = [
      ...employeeCalculations,
      ...freelancerCalculations,
    ];

    return NextResponse.json(allCalculations);
  } catch (error) {
    console.error("Failed to fetch payroll calculations:", error);
    return NextResponse.json(
      { message: "Failed to fetch payroll calculations", error },
      { status: 500 }
    );
  }
}

async function calculateWorkerPayroll(
  worker: any,
  isFreelancer: boolean,
  workingDaysInMonth: number,
  hrSettings: any
) {
  const attendanceRecords = isFreelancer
    ? worker.attendanceRecords
    : worker.AttendanceRecord;
  const salaryType = isFreelancer ? "DAILY" : worker.salaryType || "MONTHLY";

  // Use worker's individual overtime rate
  const overtimeHourRate =
    worker.overtimeHourRate || hrSettings.overtimeHourRate || 50.0;

  // Get the correct salary fields based on worker type
  let dailyRate = 0;
  let monthlySalary = 0;

  if (isFreelancer) {
    // Freelancers: use salary field as daily rate
    dailyRate = Number(worker.salary) || 0;
    monthlySalary = dailyRate * workingDaysInMonth;
  } else {
    // Employees: use the correct salary fields from the database
    if (salaryType === "DAILY") {
      // Daily employees: use dailySalary field
      dailyRate = Number(worker.dailySalary) || 0;
      monthlySalary = dailyRate * workingDaysInMonth;
    } else {
      // Monthly employees: use monthlySalary field
      monthlySalary = Number(worker.monthlySalary) || 0;
      dailyRate = monthlySalary / workingDaysInMonth;
    }
  }

  // Count attendance records and calculate overtime
  let totalRegularHours = 0;
  let totalOvertimeHours = 0;
  let totalOvertimeAmount = 0;

  const paidDays = attendanceRecords.filter((record: any) => {
    const isPaidDay =
      record.status !== AttendanceStatus.ABSENT &&
      record.status !== AttendanceStatus.UNPAID_LEAVE;

    if (isPaidDay && record.overtimeHours) {
      const overtimeHours = Number(record.overtimeHours);
      totalOvertimeHours += overtimeHours;

      // Calculate overtime amount at individual rate
      const overtimeAmount = overtimeHours * overtimeHourRate;
      totalOvertimeAmount += overtimeAmount;
    }

    if (isPaidDay && record.regularHours) {
      totalRegularHours += Number(record.regularHours);
    }

    return isPaidDay;
  }).length;

  // Calculate base amount based on salary type
  let baseAmount = 0;

  if (isFreelancer || salaryType === "DAILY") {
    // Freelancers and daily employees: daily rate × paid days
    baseAmount = parseFloat((dailyRate * paidDays).toFixed(2));
  } else {
    // Monthly employees: full monthly salary minus unpaid leave deduction only
    const unpaidLeaveDays = attendanceRecords.filter(
      (record: any) => record.status === AttendanceStatus.UNPAID_LEAVE
    ).length;

    // Only deduct for unpaid leave days
    const unpaidDeduction = dailyRate * unpaidLeaveDays;
    baseAmount = parseFloat((monthlySalary - unpaidDeduction).toFixed(2));
  }

  // Calculate attendance breakdown
  const attendanceBreakdown = calculateAttendanceBreakdown(attendanceRecords);

  // --- DERIVE PERFORMANCE METRICS ---

  // 1. Attendance Score: (Present Days / Total Days) * 100
  const totalDays = attendanceBreakdown.totalDays || workingDaysInMonth;
  const presentDays = attendanceBreakdown.presentDays || 0;
  const attendanceScore = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // 2. Mock Other Metrics (For now, until you have a Performance Review module)
  // These placeholders ensure your calculation logic has data to work with.
  const mockQuality = 96;
  const mockProductivity = 90;
  const mockTeamwork = 95;

  const performanceMetrics: any = {
    attendance: attendanceScore,
    quality: mockQuality,
    productivity: mockProductivity,
    teamwork: mockTeamwork,
  };

  // Calculate bonuses and deductions
  const payrollCalculation = calculatePayroll(
    baseAmount,
    totalOvertimeAmount,
    hrSettings,
    isFreelancer ? "FREELANCER" : "EMPLOYEE",
    performanceMetrics, // Pass metrics to the engine
    attendanceBreakdown,
    0 // existingLoans placeholder
  );

  return {
    id: worker.id,
    firstName: worker.firstName,
    lastName: worker.lastName,
    email: worker.email,
    salaryType,
    monthlySalary,
    dailySalary: dailyRate,
    overtimeHourRate,
    department: worker.department,
    paidDays,
    baseAmount,
    overtimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
    overtimeAmount: parseFloat(totalOvertimeAmount.toFixed(2)),
    bonusAmount: payrollCalculation.bonusAmount,
    deductionAmount: payrollCalculation.deductionAmount,
    amount: payrollCalculation.grossAmount,
    netAmount: payrollCalculation.netAmount,
    totalAmount: payrollCalculation.grossAmount,
    regularHours: parseFloat(totalRegularHours.toFixed(2)),
    isFreelancer,
    employeeType: isFreelancer ? "FREELANCER" : "EMPLOYEE",
    attendanceBreakdown,
    dailyRate,
    overtimeFixedRate: overtimeHourRate,
    bonuses: payrollCalculation.bonuses,
    deductions: payrollCalculation.deductions,
    performanceScore: payrollCalculation.performanceScore,
  };
}

function getWorkingDaysInMonth(year: number, month: number): number {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  let workingDays = 0;

  for (
    let day = new Date(startDate);
    day <= endDate;
    day.setDate(day.getDate() + 1)
  ) {
    const dayOfWeek = day.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return workingDays;
}

function calculateAttendanceBreakdown(records: any[]) {
  const presentDays = records.filter(
    (record) =>
      record.status === AttendanceStatus.PRESENT ||
      record.status === AttendanceStatus.LATE
  ).length;

  const halfDays = records.filter(
    (record) => record.status === AttendanceStatus.HALF_DAY
  ).length;

  const leaveDays = records.filter(
    (record) =>
      record.status === AttendanceStatus.ANNUAL_LEAVE ||
      record.status === AttendanceStatus.SICK_LEAVE
  ).length;

  const absentDays = records.filter(
    (record) => record.status === AttendanceStatus.ABSENT
  ).length;

  const unpaidLeaveDays = records.filter(
    (record) => record.status === AttendanceStatus.UNPAID_LEAVE
  ).length;

  return {
    presentDays,
    halfDays,
    leaveDays,
    absentDays,
    unpaidLeaveDays,
    totalDays: records.length,
  };
}
