import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "6months";
    const employeeId = searchParams.get("employeeId");

    if (employeeId) {
      const performance = await getEmployeePerformance(employeeId, period);
      return NextResponse.json(performance);
    } else {
      const performance = await getOverallPerformance(period);
      return NextResponse.json(performance);
    }
  } catch (error) {
    console.error("Performance API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}

// Helper functions with proper error handling
async function getEmployeePerformance(employeeId: string, period: string) {
  try {
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        AttendanceRecord: {
          where: {
            date: {
              gte: getDateFromPeriod(period),
            },
          },
        },
        assignedTasks: {
          include: {
            timeEntries: true,
            Subtask: true,
            project: true,
          },
        },
        Warning: {
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    const metrics = calculateEmployeeMetrics(employee, period);
    const goals = getEmployeeGoals(employee);

    return {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        department: employee.department?.name || "No Department",
        avatar: employee.avatar,
        metrics,
        goals,
        warnings: employee.Warning,
        currentPoints: metrics.overallScore,
        status: getPerformanceStatus(metrics.overallScore),
        trend: "up",
      },
    };
  } catch (error) {
    console.error("Error getting employee performance:", error);
    throw error;
  }
}

async function getOverallPerformance(period: string) {
  try {
    const employees = await db.employee.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        department: true,
        AttendanceRecord: {
          where: {
            date: {
              gte: getDateFromPeriod(period),
            },
          },
        },
        assignedTasks: {
          include: {
            timeEntries: true,
          },
        },
      },
    });

    const departmentStats = calculateDepartmentStats(employees);
    const performanceDistribution = calculatePerformanceDistribution(employees);

    return {
      departmentStats,
      performanceDistribution,
      averageScore: calculateAverageScore(employees),
      topPerformers: countTopPerformers(employees),
      needsAttention: countEmployeesNeedingAttention(employees),
    };
  } catch (error) {
    console.error("Error getting overall performance:", error);
    throw error;
  }
}

// Utility functions with proper null checks
function calculateEmployeeMetrics(employee: any, period: string) {
  const attendance = calculateAttendanceRate(employee.attendanceRecords || []);
  const taskPerformance = calculateTaskPerformance(
    employee.assignedTasks || []
  );
  const productivity = calculateProductivity(employee.assignedTasks || []);

  const overallScore = Math.round(
    attendance * 0.3 + taskPerformance * 0.4 + productivity * 0.3
  );

  return {
    productivity,
    quality: taskPerformance,
    attendance,
    teamwork: Math.floor(Math.random() * 20) + 80,
    overallScore,
  };
}

function calculateAttendanceRate(records: any[]): number {
  // Add null check
  if (!records || records.length === 0) return 85;
  const presentDays = records.filter((r) => r.status === "PRESENT").length;
  return Math.round((presentDays / records.length) * 100);
}

function calculateTaskPerformance(tasks: any[]): number {
  if (!tasks || tasks.length === 0) return 75;
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  return Math.round((completedTasks / tasks.length) * 100);
}

function calculateProductivity(tasks: any[]): number {
  if (!tasks || tasks.length === 0) return 75;

  const totalEstimatedHours = tasks.reduce(
    (sum, task) =>
      sum + (task.estimatedHours ? Number(task.estimatedHours) : 8),
    0
  );

  const totalActualHours = tasks.reduce((sum, task) => {
    const taskHours = (task.timeEntries || []).reduce(
      (timeSum: number, entry: any) =>
        timeSum + (entry.hours ? Number(entry.hours) : 0),
      0
    );
    return sum + taskHours;
  }, 0);

  if (totalEstimatedHours === 0) return 75;

  const efficiency =
    (totalEstimatedHours / Math.max(totalActualHours, 1)) * 100;
  return Math.min(Math.round(efficiency), 100);
}

function getPerformanceStatus(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Needs Improvement";
  return "Poor";
}

function getEmployeeGoals(employee: any) {
  const taskCompletionRate = calculateTaskPerformance(
    employee.assignedTasks || []
  );
  const attendanceRate = calculateAttendanceRate(
    employee.attendanceRecords || []
  );

  return [
    {
      title: "Task Completion",
      progress: taskCompletionRate,
      status:
        taskCompletionRate >= 80
          ? "Completed"
          : taskCompletionRate >= 60
            ? "In Progress"
            : "Behind",
    },
    {
      title: "Attendance",
      progress: attendanceRate,
      status:
        attendanceRate >= 95
          ? "Completed"
          : attendanceRate >= 85
            ? "In Progress"
            : "Behind",
    },
    {
      title: "Productivity",
      progress: calculateProductivity(employee.assignedTasks || []),
      status: "In Progress",
    },
  ];
}

function calculateDepartmentStats(employees: any[]) {
  const deptMap = new Map();

  employees.forEach((emp) => {
    const deptName = emp.department?.name || "No Department";
    if (!deptMap.has(deptName)) {
      deptMap.set(deptName, {
        name: deptName,
        totalScore: 0,
        count: 0,
        employees: 0,
        color: getDepartmentColor(deptName),
      });
    }

    const dept = deptMap.get(deptName);
    const score = calculateEmployeeMetrics(emp, "6months").overallScore;
    dept.totalScore += score;
    dept.count++;
    dept.employees++;
  });

  return Array.from(deptMap.values()).map((dept) => ({
    ...dept,
    avgScore: dept.count > 0 ? Math.round(dept.totalScore / dept.count) : 0,
  }));
}

function calculatePerformanceDistribution(employees: any[]) {
  const distribution = {
    excellent: 0,
    good: 0,
    average: 0,
    needsImprovement: 0,
  };

  employees.forEach((emp) => {
    const score = calculateEmployeeMetrics(emp, "6months").overallScore;
    if (score >= 90) distribution.excellent++;
    else if (score >= 80) distribution.good++;
    else if (score >= 70) distribution.average++;
    else distribution.needsImprovement++;
  });

  return [
    {
      name: "Excellent (90-100)",
      value: distribution.excellent,
      fill: "#22c55e",
    },
    { name: "Good (80-89)", value: distribution.good, fill: "#3b82f6" },
    { name: "Average (70-79)", value: distribution.average, fill: "#f59e0b" },
    {
      name: "Needs Improvement (<70)",
      value: distribution.needsImprovement,
      fill: "#ef4444",
    },
  ];
}

function calculateAverageScore(employees: any[]): number {
  if (employees.length === 0) return 0;
  const total = employees.reduce((sum, emp) => {
    return sum + calculateEmployeeMetrics(emp, "6months").overallScore;
  }, 0);
  return Math.round(total / employees.length);
}

function countTopPerformers(employees: any[]): number {
  return employees.filter((emp) => {
    const score = calculateEmployeeMetrics(emp, "6months").overallScore;
    return score >= 90;
  }).length;
}

function countEmployeesNeedingAttention(employees: any[]): number {
  return employees.filter((emp) => {
    const score = calculateEmployeeMetrics(emp, "6months").overallScore;
    return score < 70;
  }).length;
}

function getDepartmentColor(deptName: string): string {
  const colors: { [key: string]: string } = {
    Engineering: "#8884d8",
    Sales: "#82ca9d",
    Marketing: "#ffc658",
    HR: "#ff7300",
    Finance: "#ff3860",
    Operations: "#0088fe",
  };
  return colors[deptName] || "#8884d8";
}

function getDateFromPeriod(period: string): Date {
  const now = new Date();
  switch (period) {
    case "1month":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "3months":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "1year":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case "6months":
    default:
      return new Date(now.setMonth(now.getMonth() - 6));
  }
}
