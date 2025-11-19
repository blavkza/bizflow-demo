import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { AttendanceStatus, SalaryType } from "@prisma/client";
import { calculateOvertime } from "@/lib/overtime-calculations";

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

    // Parse month and get date range
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    console.log(
      `Fetching payroll data for ${month}, workerType: ${workerType}`
    );

    // Calculate working days in month
    const workingDaysInMonth = getWorkingDaysInMonth(year, monthNum);

    // Fetch data based on worker type
    let employees: any[] = [];
    let freelancers: any[] = [];

    if (workerType === "all" || workerType === "employees") {
      employees = await db.employee.findMany({
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
    }

    if (workerType === "all" || workerType === "freelancers") {
      freelancers = await db.freeLancer.findMany({
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
    }

    console.log(
      `Found ${employees.length} employees and ${freelancers.length} freelancers`
    );

    // Process employees
    const employeeCalculations = employees.map((employee) => {
      return calculateWorkerPayroll(employee, false, workingDaysInMonth);
    });

    // Process freelancers
    const freelancerCalculations = freelancers.map((freelancer) => {
      return calculateWorkerPayroll(freelancer, true, workingDaysInMonth);
    });

    const allCalculations = [
      ...employeeCalculations,
      ...freelancerCalculations,
    ];

    console.log(`Total payroll calculations: ${allCalculations.length}`);
    console.log("Sample calculation:", allCalculations[0]);

    return NextResponse.json(allCalculations);
  } catch (error) {
    console.error("Failed to fetch payroll calculations:", error);
    return NextResponse.json(
      { message: "Failed to fetch payroll calculations", error },
      { status: 500 }
    );
  }
}

function calculateWorkerPayroll(
  worker: any,
  isFreelancer: boolean,
  workingDaysInMonth: number
) {
  const attendanceRecords = isFreelancer
    ? worker.attendanceRecords
    : worker.AttendanceRecord;
  const salaryType = isFreelancer ? "DAILY" : worker.salaryType || "MONTHLY";

  // Use worker's individual overtime rate
  const overtimeHourRate = worker.overtimeHourRate || 50.0;

  // Get the correct salary fields based on worker type
  let dailyRate = 0;
  let monthlySalary = 0;

  if (isFreelancer) {
    // Freelancers: use salary field as daily rate
    dailyRate = Number(worker.salary) || 0;
    monthlySalary = dailyRate * workingDaysInMonth; // For display purposes only
  } else {
    // Employees: use the correct salary fields from the database
    if (salaryType === "DAILY") {
      // Daily employees: use dailySalary field
      dailyRate = Number(worker.dailySalary) || 0;
      monthlySalary = dailyRate * workingDaysInMonth;
    } else {
      // Monthly employees: use monthlySalary field
      monthlySalary = Number(worker.monthlySalary) || 0;
      dailyRate = monthlySalary / workingDaysInMonth; // For unpaid leave calculation
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
      totalOvertimeHours += Number(record.overtimeHours);

      const overtimeCalc = calculateOvertime(
        record.regularHours,
        record.overtimeHours,
        dailyRate,
        overtimeHourRate
      );

      totalOvertimeAmount += overtimeCalc.overtimeAmount;
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

    console.log(`Monthly employee ${worker.firstName} ${worker.lastName}:`, {
      monthlySalary,
      unpaidLeaveDays,
      unpaidDeduction,
      baseAmount,
    });
  }

  const totalAmount = parseFloat((baseAmount + totalOvertimeAmount).toFixed(2));

  // Calculate attendance breakdown
  const attendanceBreakdown = calculateAttendanceBreakdown(attendanceRecords);

  return {
    id: worker.id,
    firstName: worker.firstName,
    lastName: worker.lastName,
    email: worker.email,
    salaryType,
    monthlySalary,
    dailySalary: dailyRate,
    overtimeHourRate: overtimeHourRate,
    department: worker.department,
    paidDays,
    baseAmount,
    overtimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
    overtimeAmount: parseFloat(totalOvertimeAmount.toFixed(2)),
    amount: totalAmount,
    totalAmount,
    regularHours: parseFloat(totalRegularHours.toFixed(2)),
    isFreelancer,
    employeeType: isFreelancer ? "FREELANCER" : "EMPLOYEE",
    attendanceBreakdown,
    dailyRate,
    overtimeFixedRate: overtimeHourRate,
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
