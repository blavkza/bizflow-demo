import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type AttendanceStatus =
  | "PRESENT"
  | "HALF_DAY"
  | "LATE"
  | "SICK_LEAVE"
  | "ANNUAL_LEAVE"
  | "UNPAID_LEAVE"
  | "ABSENT";

interface AttendanceWeights {
  [key: string]: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "6months";
    const dateRange = getDateRange(period);

    const [employees, warnings, trendsData] = await Promise.all([
      db.employee.findMany({
        where: { status: "ACTIVE" },
        include: {
          department: true,
          AttendanceRecord: {
            where: { date: { gte: dateRange.start } },
          },
          assignedTasks: {
            where: { createdAt: { gte: dateRange.start } },
            include: {
              timeEntries: true,
              subtask: true,
              project: true,
            },
          },
          Warning: { where: { status: "ACTIVE" } },
        },
      }),
      db.warning.findMany({
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
              department: true,
              avatar: true,
            },
          },
        },
        orderBy: { date: "desc" },
      }),
      getHistoricalTrends(dateRange.start),
    ]);

    const employeePerformance = employees.map((employee) => {
      try {
        const metrics = calculateEmployeeMetrics(employee);
        const overallScore = calculateOverallScore(metrics);
        const goals = getEmployeeGoals(metrics);

        return {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          position: employee.position,
          department: employee.department?.name || "No Department",
          avatar: employee.avatar,
          currentPoints: overallScore,
          trend: calculateEmployeeTrend(employee.assignedTasks),
          status: getPerformanceStatus(overallScore),
          metrics: {
            productivity: metrics.productivity,
            quality: metrics.taskPerformance,
            attendance: metrics.attendanceRate,
            teamwork: metrics.teamwork,
          },
          goals,
          warnings: employee.Warning.map((warning) => ({
            id: warning.id,
            type: warning.type,
            reason: warning.reason,
            severity: warning.severity,
            date: warning.date.toISOString(),
          })),
        };
      } catch (error) {
        return getDefaultEmployeePerformance(employee);
      }
    });

    const overview = calculateOverview(employeePerformance, warnings);
    const departments = calculateDepartmentAnalysis(employeePerformance);
    const distribution = calculatePerformanceDistribution(employeePerformance);

    const transformedWarnings = warnings.map((warning) => ({
      id: warning.id,
      type: warning.type,
      severity: warning.severity,
      reason: warning.reason,
      actionPlan: warning.actionPlan,
      date: warning.date.toISOString(),
      status: warning.status,
      resolvedAt: warning.resolvedAt?.toISOString(),
      resolutionNotes: warning.resolutionNotes,
      employee: {
        id: warning.employee.id,
        name: `${warning.employee.firstName} ${warning.employee.lastName}`,
        position: warning.employee.position,
        department: warning.employee.department?.name || "No Department",
        avatar: warning.employee.avatar,
      },
    }));

    const response = {
      overview,
      employees: employeePerformance,
      departments,
      warnings: transformedWarnings,
      trends: trendsData,
      distribution,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(getDefaultResponse(), { status: 200 });
  }
}

function calculateEmployeeMetrics(employee: any) {
  const attendanceRate = calculateAttendanceRate(
    employee.AttendanceRecord || []
  );
  const taskPerformance = calculateTaskPerformance(
    employee.assignedTasks || []
  );
  const productivity = calculateProductivity(employee.assignedTasks || []);
  const projectContribution = calculateProjectContribution(
    employee.assignedTasks || []
  );
  const teamwork = calculateTeamwork(employee.assignedTasks || []);

  return {
    attendanceRate,
    taskPerformance,
    productivity,
    projectContribution,
    teamwork,
  };
}

function calculateOverallScore(metrics: any): number {
  if (!metrics) return 75;

  const attendanceRate = Number(metrics.attendanceRate) || 0;
  const taskPerformance = Number(metrics.taskPerformance) || 0;
  const productivity = Number(metrics.productivity) || 0;
  const projectContribution = Number(metrics.projectContribution) || 0;
  const teamwork = Number(metrics.teamwork) || 0;

  return Math.round(
    attendanceRate * 0.15 +
      taskPerformance * 0.35 +
      productivity * 0.25 +
      projectContribution * 0.15 +
      teamwork * 0.1
  );
}

function calculateAttendanceRate(records: any[]): number {
  if (records.length === 0) return 0;

  const weights: AttendanceWeights = {
    PRESENT: 1.0,
    HALF_DAY: 0.8,
    LATE: 0.7,
    SICK_LEAVE: 0.5,
    ANNUAL_LEAVE: 0.5,
    UNPAID_LEAVE: 0.3,
    ABSENT: 0.0,
  };

  let totalScore = 0;
  records.forEach((record) => {
    const status = record.status as AttendanceStatus;
    const weight = weights[status] || 0;
    totalScore += weight;
  });

  return Math.round((totalScore / records.length) * 100);
}

function calculateTaskPerformance(tasks: any[]): number {
  if (tasks.length === 0) return 0;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;
  const cancelledTasks = tasks.filter(
    (task) => task.status === "CANCELLED"
  ).length;
  const totalAssignableTasks = tasks.length - cancelledTasks;

  return totalAssignableTasks > 0
    ? Math.round((completedTasks / totalAssignableTasks) * 100)
    : 0;
}

function calculateProductivity(tasks: any[]): number {
  if (tasks.length === 0) return 0;

  const completedTasks = tasks.filter((task) => task.status === "COMPLETED");
  if (completedTasks.length === 0) return 0;

  let totalProductivity = 0;
  let validTasks = 0;

  completedTasks.forEach((task) => {
    const estimatedHours = task.estimatedHours
      ? Number(task.estimatedHours)
      : 8;
    const actualHours = task.timeEntries.reduce((sum: number, entry: any) => {
      return sum + (entry.hours ? Number(entry.hours) : 0);
    }, 0);

    let taskProductivity = 100;

    if (actualHours > 0 && estimatedHours > 0) {
      taskProductivity = Math.min((estimatedHours / actualHours) * 100, 120);
      taskProductivity = Math.max(70, taskProductivity);
    } else {
      taskProductivity = 90;
    }

    totalProductivity += taskProductivity;
    validTasks++;
  });

  const productivity =
    validTasks > 0 ? Math.round(totalProductivity / validTasks) : 0;
  return Math.min(120, Math.max(0, productivity));
}

function calculateProjectContribution(tasks: any[]): number {
  if (tasks.length === 0) return 0;

  const uniqueProjects = new Set(
    tasks.map((task) => task.projectId).filter(Boolean)
  ).size;
  const completedTasksByProject = new Map();

  tasks.forEach((task) => {
    if (task.projectId) {
      const current = completedTasksByProject.get(task.projectId) || {
        total: 0,
        completed: 0,
      };
      current.total++;
      if (task.status === "COMPLETED") current.completed++;
      completedTasksByProject.set(task.projectId, current);
    }
  });

  let totalProjectContribution = 0;
  completedTasksByProject.forEach((stats) => {
    const completionRate =
      stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    totalProjectContribution += completionRate;
  });

  const averageContribution =
    uniqueProjects > 0 ? totalProjectContribution / uniqueProjects : 0;
  return Math.round(Math.min(averageContribution, 100));
}

function calculateTeamwork(tasks: any[]): number {
  if (tasks.length === 0) return 50;

  const collaborativeTasks = tasks.filter(
    (task) => task.subtask && task.subtask.length > 0
  ).length;
  const reviewTasks = tasks.filter((task) => task.status === "REVIEW").length;
  const uniqueProjects = new Set(
    tasks.map((task) => task.projectId).filter(Boolean)
  ).size;

  const collaborationScore = Math.min(
    (collaborativeTasks / Math.max(tasks.length, 1)) * 50,
    50
  );
  const reviewScore = Math.min(
    (reviewTasks / Math.max(tasks.length, 1)) * 30,
    30
  );
  const projectDiversityScore = Math.min(uniqueProjects * 7, 20);

  const teamwork = Math.round(
    collaborationScore + reviewScore + projectDiversityScore
  );
  return Math.min(100, Math.max(20, teamwork));
}

function calculateOverview(employees: any[], warnings: any[]) {
  const employeesWithScores = employees.filter(
    (emp) => emp.currentPoints !== null && emp.currentPoints !== undefined
  );
  const scores = employeesWithScores.map((emp) => emp.currentPoints);

  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  return {
    averageScore,
    topPerformers: employeesWithScores.filter((emp) => emp.currentPoints >= 90)
      .length,
    needsAttention: employeesWithScores.filter((emp) => emp.currentPoints < 70)
      .length,
    activeWarnings: warnings.filter((w: any) => w.status === "ACTIVE").length,
    trend: calculateTrend(scores),
    totalEmployees: employees.length,
    departmentStats: calculateDepartmentStats(employeesWithScores),
    calculatedAt: new Date().toISOString(),
  };
}

function calculateDepartmentAnalysis(employees: any[]) {
  const deptMap = new Map();

  employees.forEach((emp) => {
    const dept = emp.department;
    if (!deptMap.has(dept)) {
      deptMap.set(dept, {
        name: dept,
        employees: [],
        avgScore: 0,
        totalEmployees: 0,
        topPerformers: 0,
        needsAttention: 0,
      });
    }

    const deptData = deptMap.get(dept);
    deptData.employees.push(emp);
    deptData.totalEmployees++;
    if (emp.currentPoints >= 90) deptData.topPerformers++;
    if (emp.currentPoints < 70) deptData.needsAttention++;
  });

  deptMap.forEach((deptData) => {
    deptData.avgScore = Math.round(
      deptData.employees.reduce(
        (sum: number, emp: any) => sum + emp.currentPoints,
        0
      ) / deptData.totalEmployees
    );
  });

  return Array.from(deptMap.values());
}

function calculatePerformanceDistribution(employees: any[]) {
  const validEmployees = employees.filter(
    (emp) => emp.currentPoints !== null && emp.currentPoints !== undefined
  );

  const distribution = {
    excellent: validEmployees.filter((emp) => emp.currentPoints >= 90).length,
    good: validEmployees.filter(
      (emp) => emp.currentPoints >= 80 && emp.currentPoints < 90
    ).length,
    average: validEmployees.filter(
      (emp) => emp.currentPoints >= 70 && emp.currentPoints < 80
    ).length,
    needsImprovement: validEmployees.filter((emp) => emp.currentPoints < 70)
      .length,
  };

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

function calculateDepartmentStats(employees: any[]) {
  const deptStats = new Map();

  employees.forEach((emp) => {
    if (emp.currentPoints === null || emp.currentPoints === undefined) return;

    const dept = emp.department;
    if (!deptStats.has(dept)) {
      deptStats.set(dept, { totalScore: 0, count: 0 });
    }
    const stats = deptStats.get(dept);
    stats.totalScore += emp.currentPoints;
    stats.count++;
  });

  return Array.from(deptStats.entries()).map(([name, stats]) => ({
    name,
    avgScore: stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0,
    employeeCount: stats.count,
  }));
}

function calculateEmployeeTrend(tasks: any[]): string {
  const taskPerformance = calculateTaskPerformance(tasks);
  if (taskPerformance >= 80) return "up";
  if (taskPerformance >= 60) return "stable";
  return "down";
}

function getPerformanceStatus(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Needs Improvement";
  return "Poor";
}

function getEmployeeGoals(metrics: any) {
  return [
    {
      title: "Task Completion Rate",
      progress: metrics.taskPerformance,
      status: getGoalStatus(metrics.taskPerformance),
    },
    {
      title: "Attendance Rate",
      progress: metrics.attendanceRate,
      status: getGoalStatus(metrics.attendanceRate),
    },
    {
      title: "Productivity",
      progress: metrics.productivity,
      status: getGoalStatus(metrics.productivity),
    },
  ];
}

function getGoalStatus(progress: number): string {
  if (progress >= 90) return "Completed";
  if (progress >= 70) return "In Progress";
  return "Behind";
}

function calculateTrend(scores: number[]): number {
  if (scores.length === 0) return 0;
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (average >= 85) return 2.5;
  if (average >= 75) return 1.8;
  if (average >= 65) return 0.5;
  return -1.2;
}

async function getHistoricalTrends(since: Date) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        AttendanceRecord: {
          where: { date: { gte: sixMonthsAgo } },
        },
        assignedTasks: {
          where: { createdAt: { gte: sixMonthsAgo } },
          include: {
            timeEntries: true,
            subtask: true,
            project: true,
          },
        },
      },
    });

    // Define proper type for monthlyData
    const monthlyData: {
      [key: string]: {
        month: string;
        productivity: number[];
        quality: number[];
        attendance: number[];
        teamwork: number[];
      };
    } = {};

    employees.forEach((employee) => {
      employee.assignedTasks.forEach((task) => {
        const taskMonth = task.createdAt.toISOString().substring(0, 7);

        if (!monthlyData[taskMonth]) {
          monthlyData[taskMonth] = {
            month: formatMonth(task.createdAt),
            productivity: [],
            quality: [],
            attendance: [],
            teamwork: [],
          };
        }

        const monthData = monthlyData[taskMonth];

        if (task.status === "COMPLETED") {
          monthData.quality.push(100);
        } else {
          monthData.quality.push(0);
        }

        const taskProductivity = calculateTaskProductivity(task);
        if (taskProductivity > 0) {
          monthData.productivity.push(taskProductivity);
        }

        const taskTeamwork = calculateTaskTeamwork(task);
        monthData.teamwork.push(taskTeamwork);
      });

      employee.AttendanceRecord.forEach((record) => {
        const attendanceMonth = record.date.toISOString().substring(0, 7);

        if (!monthlyData[attendanceMonth]) {
          monthlyData[attendanceMonth] = {
            month: formatMonth(record.date),
            productivity: [],
            quality: [],
            attendance: [],
            teamwork: [],
          };
        }

        const weight = getAttendanceWeight(record.status);
        monthlyData[attendanceMonth].attendance.push(weight * 100);
      });
    });

    const trendsData = Object.values(monthlyData)
      .map((monthData) => {
        const productivity = calculateMonthlyAverage(monthData.productivity, 0);
        const quality = calculateMonthlyAverage(monthData.quality, 0);
        const attendance = calculateMonthlyAverage(monthData.attendance, 0);
        const teamwork = calculateMonthlyAverage(monthData.teamwork, 0);

        const totalDataPoints =
          monthData.productivity.length +
          monthData.quality.length +
          monthData.attendance.length +
          monthData.teamwork.length;

        if (totalDataPoints >= 3) {
          return {
            month: monthData.month,
            productivity: Math.round(productivity),
            quality: Math.round(quality),
            attendance: Math.round(attendance),
            teamwork: Math.round(teamwork),
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6);

    return trendsData;
  } catch (error) {
    console.error("Error calculating trends:", error);
    return getDefaultTrends();
  }
}

function calculateTaskProductivity(task: any): number {
  if (task.status !== "COMPLETED") return 0;

  const estimatedHours = task.estimatedHours ? Number(task.estimatedHours) : 8;
  const actualHours = task.timeEntries.reduce(
    (sum: number, entry: any) => sum + (entry.hours ? Number(entry.hours) : 0),
    0
  );

  let taskProductivity = 100;

  if (actualHours > 0 && estimatedHours > 0) {
    taskProductivity = Math.min((estimatedHours / actualHours) * 100, 120);
    taskProductivity = Math.max(70, taskProductivity);
  } else {
    taskProductivity = 90;
  }

  return taskProductivity;
}

function calculateTaskTeamwork(task: any): number {
  let teamworkScore = 0;

  if (task.subtask && task.subtask.length > 0) {
    teamworkScore += 50;
  }

  if (task.status === "REVIEW") {
    teamworkScore += 30;
  }

  if (task.projectId) {
    teamworkScore += 20;
  }

  return Math.min(teamworkScore, 100);
}

function calculateMonthlyAverage(
  values: number[],
  defaultValue: number
): number {
  if (!values || values.length === 0) return defaultValue;
  const validValues = values.filter((v) => v > 0);
  if (validValues.length === 0) return defaultValue;
  const sum = validValues.reduce((a, b) => a + b, 0);
  return sum / validValues.length;
}

function getAttendanceWeight(status: string): number {
  const weights: { [key: string]: number } = {
    PRESENT: 1.0,
    HALF_DAY: 0.8,
    LATE: 0.7,
    SICK_LEAVE: 0.5,
    ANNUAL_LEAVE: 0.5,
    UNPAID_LEAVE: 0.3,
    ABSENT: 0.0,
  };
  return weights[status] || 0;
}

function getDefaultTrends() {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: formatMonth(date),
      productivity: 75,
      quality: 75,
      attendance: 85,
      teamwork: 60,
    });
  }
  return months;
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getDateRange(period: string) {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case "1month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "3months":
      start.setMonth(now.getMonth() - 3);
      break;
    case "1year":
      start.setFullYear(now.getFullYear() - 1);
      break;
    case "6months":
    default:
      start.setMonth(now.getMonth() - 6);
      break;
  }

  return { start, end: now };
}

function getDefaultEmployeePerformance(employee: any) {
  return {
    id: employee.id,
    name: `${employee.firstName} ${employee.lastName}`,
    position: employee.position,
    department: employee.department?.name || "No Department",
    avatar: employee.avatar,
    currentPoints: 75,
    trend: "stable",
    status: "Needs Improvement",
    metrics: {
      productivity: 75,
      quality: 75,
      attendance: 85,
      teamwork: 60,
    },
    goals: [
      { title: "Task Completion Rate", progress: 75, status: "In Progress" },
      { title: "Attendance Rate", progress: 85, status: "In Progress" },
      { title: "Productivity", progress: 75, status: "In Progress" },
    ],
    warnings: [],
  };
}

function getDefaultResponse() {
  return {
    overview: {
      averageScore: 0,
      topPerformers: 0,
      needsAttention: 0,
      activeWarnings: 0,
      trend: 0,
      totalEmployees: 0,
      departmentStats: [],
      calculatedAt: new Date().toISOString(),
    },
    employees: [],
    departments: [],
    warnings: [],
    trends: [],
    distribution: [],
  };
}
