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
        { status: 400 },
      );
    }

    // Get HR settings
    const hrSettings = await db.hRSettings.findFirst();
    if (!hrSettings) {
      return NextResponse.json(
        { error: "HR settings not configured" },
        { status: 400 },
      );
    }

    // Parse month and get date range
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of the month

    // Use fixed working days from HR settings (e.g. 26 as requested)
    const workingDaysInMonth = hrSettings.workingDaysPerMonth || 22;

    const user = await db.user.findUnique({
      where: { userId },
      include: { employee: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const hasFullAccess =
      user.role === "CHIEF_EXECUTIVE_OFFICER" || user.role === "ADMIN_MANAGER";

    const payrollId = searchParams.get("payrollId");

    // --- STEP 1: Identify workers who are ALREADY PAID for this month ---
    const paymentWhere: any = {
      Payroll: {
        month: month,
        status: { in: ["PROCESSED", "PAID"] }, // Only filter out finalized payrolls
      },
    };

    // If a payrollId is provided (editing mode), ensure we DON'T count that payroll's payments as "already paid"
    if (payrollId) {
      paymentWhere.Payroll.id = { not: payrollId };
    }

    if (!hasFullAccess && user.employee?.departmentId) {
      paymentWhere.OR = [
        { employee: { departmentId: user.employee.departmentId } },
        { freeLancer: { departmentId: user.employee.departmentId } },
      ];
    }

    const existingPayments = await db.payment.findMany({
      where: paymentWhere,
      select: {
        employeeId: true,
        freeLancerId: true,
        traineeId: true,
      },
    });

    const paidWorkerIds = new Set(
      existingPayments
        .flatMap((p) => [p.employeeId, p.freeLancerId, p.traineeId])
        .filter(Boolean) as string[],
    );

    // --- STEP 2: Fetch and Filter Workers ---
    let employees: any[] = [];
    let freelancers: any[] = [];

    const employeeWhere: any = {
      status: "ACTIVE",
      hireDate: {
        lte: endDate,
      },
    };

    const freelancerWhere: any = {
      status: "ACTIVE",
      hireDate: {
        lte: endDate,
      },
    };

    if (!hasFullAccess && user.employee?.departmentId) {
      employeeWhere.departmentId = user.employee.departmentId;
      freelancerWhere.departmentId = user.employee.departmentId;
    }

    if (workerType === "all" || workerType === "employees") {
      const allEmployees = await db.employee.findMany({
        where: employeeWhere,
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
        where: freelancerWhere,
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
        (free) => !paidWorkerIds.has(free.id),
      );
    }

    let trainees: any[] = [];
    const traineeWhere: any = {
      status: "ACTIVE",
      hireDate: {
        lte: endDate,
      },
    };

    if (!hasFullAccess && user.employee?.departmentId) {
      traineeWhere.departmentId = user.employee.departmentId;
    }

    if (workerType === "all" || workerType === "trainees") {
      const allTrainees = await db.trainee.findMany({
        where: traineeWhere,
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
      trainees = allTrainees.filter((t) => !paidWorkerIds.has(t.id));
    }

    // --- STEP 3: Process only the remaining (unpaid) workers ---

    // Process employees
    const employeeCalculations = await Promise.all(
      employees.map(async (employee) => {
        return calculateWorkerPayroll(
          employee,
          "EMPLOYEE",
          workingDaysInMonth,
          hrSettings,
          startDate,
          endDate,
        );
      }),
    );

    // Process freelancers
    const freelancerCalculations = await Promise.all(
      freelancers.map((freelancer) => {
        return calculateWorkerPayroll(
          freelancer,
          "FREELANCER",
          workingDaysInMonth,
          hrSettings,
          startDate,
          endDate,
        );
      }),
    );

    // Process trainees
    const traineeCalculations = await Promise.all(
      trainees.map((trainee) => {
        return calculateWorkerPayroll(
          trainee,
          "TRAINEE",
          workingDaysInMonth,
          hrSettings,
          startDate,
          endDate,
        );
      }),
    );

    const allCalculations = [
      ...employeeCalculations,
      ...freelancerCalculations,
      ...traineeCalculations,
    ];

    return NextResponse.json(allCalculations);
  } catch (error) {
    console.error("Failed to fetch payroll calculations:", error);
    return NextResponse.json(
      { message: "Failed to fetch payroll calculations", error },
      { status: 500 },
    );
  }
}

async function calculateWorkerPayroll(
  worker: any,
  workerType: "EMPLOYEE" | "FREELANCER" | "TRAINEE",
  workingDaysInMonth: number,
  hrSettings: any,
  startDate: Date,
  endDate: Date,
) {
  const isFreelancer = workerType === "FREELANCER";
  const isTrainee = workerType === "TRAINEE";

  const attendanceRecords =
    isFreelancer || isTrainee
      ? worker.attendanceRecords
      : worker.AttendanceRecord;
  const salaryType =
    isFreelancer || isTrainee ? "DAILY" : worker.salaryType || "MONTHLY";

  // Use worker's individual overtime rate
  const overtimeHourRate =
    worker.overtimeHourRate || hrSettings.overtimeHourRate || 50.0;

  // Get the correct salary fields based on worker type
  let dailyRate = 0;
  let monthlySalary = 0;

  if (isFreelancer || isTrainee) {
    // Freelancers/Trainees: use salary field as daily rate
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

  // PROACTIVE: Fetch all approved overtime requests for this worker in the date range
  const approvedOvertimeRequests = await db.overtimeRequest.findMany({
    where: {
      OR: [
        { employeeId: worker.id },
        { freeLancerId: worker.id },
        { traineeId: worker.id },
      ],
      status: "APPROVED",
      // date filter is handled by matching records, but we could add it here too
    },
    select: { date: true },
  });

  const approvedDates = new Set(
    approvedOvertimeRequests.map((req) => req.date.toISOString().split("T")[0]),
  );

  // Fetch completed Emergency Call Outs where worker was the requester (Team Leader)
  const completedCallOutsAsLeader = await db.emergencyCallOut.findMany({
    where: {
      status: "COMPLETED",
      leaders: {
        some: isFreelancer
          ? { freelancerId: worker.id }
          : isTrainee
            ? { traineeId: worker.id }
            : { employeeId: worker.id },
      },
      checkIn: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Fetch completed Emergency Call Outs where worker was an Assistant
  const completedCallOutsAsAssistant = await db.callOutAssistant.findMany({
    where: {
      OR: [
        { employeeId: worker.id },
        { freelancerId: worker.id },
        { traineeId: worker.id },
      ],
      emergencyCallOut: {
        status: "COMPLETED",
        checkIn: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    select: {
      earnings: true,
      emergencyCallOut: {
        select: {
          duration: true,
        },
      },
    },
  });

  const callOutHours =
    completedCallOutsAsLeader.reduce(
      (acc, curr) => acc + (curr.duration || 0),
      0,
    ) +
    completedCallOutsAsAssistant.reduce(
      (acc, curr) => acc + (curr.emergencyCallOut?.duration || 0),
      0,
    );

  const callOutEarnings =
    completedCallOutsAsLeader.reduce(
      (acc, curr) => acc + Number(curr.earnings || 0),
      0,
    ) +
    completedCallOutsAsAssistant.reduce(
      (acc, curr) => acc + Number(curr.earnings || 0),
      0,
    );

  let totalRegularHours = 0;
  let totalOvertimeHours = callOutHours;
  let totalOvertimeAmount = callOutEarnings;

  const paidDays = attendanceRecords.reduce((acc: number, record: any) => {
    const isPaidDay =
      record.status !== AttendanceStatus.ABSENT &&
      record.status !== AttendanceStatus.UNPAID_LEAVE;

    if (!isPaidDay) return acc;

    // Weight: Half Days count as 0.5, everything else (Present/Late/Leave) counts as 1.0
    const weight = record.status === AttendanceStatus.HALF_DAY ? 0.5 : 1.0;

    if (record.overtimeHours) {
      const recordDateStr = new Date(record.date).toISOString().split("T")[0];

      // Only count overtime if it was approved for this date
      if (approvedDates.has(recordDateStr)) {
        const overtimeHours = Number(record.overtimeHours);
        totalOvertimeHours += overtimeHours;

        // Calculate overtime amount at individual rate
        const overtimeAmount = overtimeHours * overtimeHourRate;
        totalOvertimeAmount += overtimeAmount;
      }
    }

    if (record.regularHours) {
      totalRegularHours += Number(record.regularHours);
    }

    return acc + weight;
  }, 0);

  // Calculate base amount based on salary type
  let baseAmount = 0;

  if (isFreelancer || salaryType === "DAILY") {
    // Freelancers and daily employees: daily rate × paid days
    baseAmount = parseFloat((dailyRate * paidDays).toFixed(2));
  } else {
    // Monthly employees: full monthly salary minus deductions for unpaid segments
    // This includes Absent days, Unpaid Leave, and 0.5 for each Half Day.
    const absentDays = attendanceRecords.filter(
      (r: any) => r.status === AttendanceStatus.ABSENT,
    ).length;
    const unpaidLeaveDays = attendanceRecords.filter(
      (r: any) => r.status === AttendanceStatus.UNPAID_LEAVE,
    ).length;
    const halfDays = attendanceRecords.filter(
      (r: any) => r.status === AttendanceStatus.HALF_DAY,
    ).length;

    const totalUnpaidWeight = absentDays + unpaidLeaveDays + halfDays * 0.5;
    const unpaidDeduction = dailyRate * totalUnpaidWeight;
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

  // Calculate tool deductions (Damage/Loss)
  const toolChecks = await db.toolCheck.findMany({
    where: {
      OR: [
        { employeeId: worker.id },
        { freelancerId: worker.id },
        { traineeId: worker.id },
      ],
      deductFromWorker: true,
      damageCost: { gt: 0 },
      checkDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const toolReturns = await db.toolReturn.findMany({
    where: {
      OR: [
        { employeeId: worker.id },
        { freelancerId: worker.id },
        { traineeId: worker.id },
      ],
      isApproved: true,
      damageCost: { gt: 0 },
      returnedDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalToolDeduction =
    toolChecks.reduce((sum, check) => sum + Number(check.damageCost || 0), 0) +
    toolReturns.reduce((sum, ret) => sum + Number(ret.damageCost || 0), 0);

  // Calculate bonuses and deductions
  const payrollCalculation = calculatePayroll(
    baseAmount,
    totalOvertimeAmount,
    hrSettings,
    workerType === "FREELANCER"
      ? "FREELANCER"
      : workerType === "TRAINEE"
        ? "TRAINEE"
        : "EMPLOYEE",
    performanceMetrics, // Pass metrics to the engine
    attendanceBreakdown,
    totalToolDeduction, // Pass tool damage/loss amount as damageLossAmount
    0, // existingLoans placeholder
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
    isTrainee,
    employeeType: workerType,
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
      record.status === AttendanceStatus.LATE,
  ).length;

  const halfDays = records.filter(
    (record) => record.status === AttendanceStatus.HALF_DAY,
  ).length;

  const leaveDays = records.filter(
    (record) =>
      record.status === AttendanceStatus.ANNUAL_LEAVE ||
      record.status === AttendanceStatus.SICK_LEAVE ||
      record.status === AttendanceStatus.MATERNITY_LEAVE ||
      record.status === AttendanceStatus.PATERNITY_LEAVE ||
      record.status === AttendanceStatus.STUDY_LEAVE,
  ).length;

  const absentDays = records.filter(
    (record) => record.status === AttendanceStatus.ABSENT,
  ).length;

  const unpaidLeaveDays = records.filter(
    (record) => record.status === AttendanceStatus.UNPAID_LEAVE,
  ).length;

  // Track effective loss of attendance for bonus calculation
  const effectiveAbsentDays = absentDays + unpaidLeaveDays + halfDays * 0.5;

  return {
    presentDays,
    halfDays,
    leaveDays,
    absentDays,
    unpaidLeaveDays,
    effectiveAbsentDays,
    totalDays: records.length,
  };
}
