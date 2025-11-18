import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Define proper types for attendance status
type AttendanceStatus =
  | "PRESENT"
  | "HALF_DAY"
  | "LATE"
  | "SICK_LEAVE"
  | "ANNUAL_LEAVE"
  | "UNPAID_LEAVE"
  | "ABSENT";

// Define type for attendance weights
interface AttendanceWeights {
  [key: string]: number;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching performance overview data...");

    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        department: true,
        AttendanceRecord: {
          where: {
            date: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            },
          },
        },
        assignedTasks: {
          include: {
            timeEntries: true,
            subtask: true,
            project: true,
          },
        },
      },
    });

    console.log(`Found ${employees.length} active employees`);

    if (employees.length === 0) {
      return NextResponse.json({
        averageScore: 0,
        topPerformers: 0,
        needsAttention: 0,
        activeWarnings: 0,
        trend: 0,
        totalEmployees: 0,
        message: "No active employees found",
      });
    }

    // Use the EXACT SAME calculation as individual performance API
    const employeeScores = employees.map((employee) => {
      try {
        // Calculate performance metrics using same functions
        const attendanceRate = calculateAttendanceRate(
          employee.AttendanceRecord
        );
        const taskPerformance = calculateTaskPerformance(
          employee.assignedTasks
        );
        const productivity = calculateProductivity(employee.assignedTasks);
        const projectContribution = calculateProjectContribution(
          employee.assignedTasks
        );
        const teamwork = calculateTeamwork(employee.assignedTasks);

        console.log(
          `Calculating for ${employee.firstName} ${employee.lastName}:`
        );
        console.log(
          `  Attendance: ${attendanceRate}%, Tasks: ${taskPerformance}%, Productivity: ${productivity}%, Teamwork: ${teamwork}%`
        );

        // EXACT SAME FORMULA as individual performance API
        const overallScore = Math.round(
          attendanceRate * 0.15 +
            taskPerformance * 0.35 +
            productivity * 0.25 +
            projectContribution * 0.15 +
            teamwork * 0.1
        );

        console.log(`  Overall Score: ${overallScore}%`);

        return {
          score: overallScore,
          department: employee.department?.name || "No Department",
          metrics: {
            attendanceRate,
            taskPerformance,
            productivity,
            teamwork,
            projectContribution,
          },
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
        };
      } catch (error) {
        console.error(
          `Error calculating score for employee ${employee.id}:`,
          error
        );
        return {
          score: 75,
          department: employee.department?.name || "No Department",
          metrics: null,
          error: true,
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
        };
      }
    });

    // Log all scores for debugging
    console.log("All employee scores:");
    employeeScores.forEach((emp) => {
      console.log(
        `  ${emp.employeeName}: ${emp.score}% ${emp.error ? "(ERROR)" : ""}`
      );
    });

    const validScores = employeeScores.filter((emp) => !emp.error);
    const averageScore =
      validScores.length > 0
        ? Math.round(
            validScores.reduce((sum, emp) => sum + emp.score, 0) /
              validScores.length
          )
        : 0;

    const topPerformers = validScores.filter((emp) => emp.score >= 90).length;
    const needsAttention = validScores.filter((emp) => emp.score < 70).length;

    // Count active warnings
    const activeWarnings = await db.warning.count({
      where: { status: "ACTIVE" },
    });

    // Calculate trend based on score distribution
    const trend = calculateTrend(validScores);

    // Department breakdown
    const departmentBreakdown = validScores.reduce(
      (acc, emp) => {
        const dept = emp.department;
        if (!acc[dept]) {
          acc[dept] = { totalScore: 0, count: 0, employees: [] };
        }
        acc[dept].totalScore += emp.score;
        acc[dept].count++;
        acc[dept].employees.push({
          score: emp.score,
          name: emp.employeeName,
          metrics: emp.metrics,
        });
        return acc;
      },
      {} as Record<
        string,
        { totalScore: number; count: number; employees: any[] }
      >
    );

    const departmentStats = Object.entries(departmentBreakdown).map(
      ([name, data]) => ({
        name,
        avgScore: Math.round(data.totalScore / data.count),
        employeeCount: data.count,
        topPerformers: data.employees.filter((emp) => emp.score >= 90).length,
        needsAttention: data.employees.filter((emp) => emp.score < 70).length,
      })
    );

    const response = {
      averageScore,
      topPerformers,
      needsAttention,
      activeWarnings,
      trend,
      totalEmployees: employees.length,
      departmentStats,
      calculatedAt: new Date().toISOString(),
      // Include detailed scores for debugging
      _debug: {
        totalCalculated: validScores.length,
        scores: validScores.map((emp) => ({
          name: emp.employeeName,
          score: emp.score,
          department: emp.department,
          metrics: emp.metrics,
        })),
      },
    };

    console.log("Performance overview calculated:", {
      averageScore,
      topPerformers,
      needsAttention,
      totalEmployees: employees.length,
      calculatedScores: validScores.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Performance overview API error:", error);
    return NextResponse.json(
      {
        averageScore: 0,
        topPerformers: 0,
        needsAttention: 0,
        activeWarnings: 0,
        trend: 0,
        totalEmployees: 0,
        error: "Failed to calculate performance overview",
        calculatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}

// EXACT SAME CALCULATION FUNCTIONS as individual performance API

function calculateAttendanceRate(records: any[]): number {
  if (records.length === 0) {
    console.log("No attendance records found");
    return 0;
  }

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
  let totalPossible = records.length;

  records.forEach((record) => {
    const status = record.status as AttendanceStatus;
    const weight = weights[status] || 0;
    totalScore += weight;
  });

  const rate = Math.round((totalScore / totalPossible) * 100);
  return rate;
}

function calculateTaskPerformance(tasks: any[]): number {
  if (tasks.length === 0) {
    console.log("No tasks assigned");
    return 0;
  }

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const cancelledTasks = tasks.filter(
    (task) => task.status === "CANCELLED"
  ).length;

  const totalAssignableTasks = tasks.length - cancelledTasks;
  const rate =
    totalAssignableTasks > 0
      ? Math.round((completedTasks / totalAssignableTasks) * 100)
      : 0;

  return rate;
}

function calculateProductivity(tasks: any[]): number {
  if (tasks.length === 0) {
    console.log("No tasks for productivity calculation");
    return 0;
  }

  const completedTasks = tasks.filter((task) => task.status === "COMPLETED");
  if (completedTasks.length === 0) {
    console.log("No completed tasks for productivity calculation");
    return 0;
  }

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
      if (task.status === "COMPLETED") {
        current.completed++;
      }
      completedTasksByProject.set(task.projectId, current);
    }
  });

  let totalProjectContribution = 0;
  completedTasksByProject.forEach((stats, projectId) => {
    const completionRate =
      stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    totalProjectContribution += completionRate;
  });

  const averageContribution =
    uniqueProjects > 0 ? totalProjectContribution / uniqueProjects : 0;
  const contribution = Math.round(Math.min(averageContribution, 100));

  return contribution;
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

function calculateTrend(employeeScores: any[]): number {
  if (employeeScores.length === 0) return 0;

  const average =
    employeeScores.reduce((sum, emp) => sum + emp.score, 0) /
    employeeScores.length;

  // Simple trend based on average score
  if (average >= 85) return 2.5;
  if (average >= 75) return 1.8;
  if (average >= 65) return 0.5;
  return -1.2;
}
