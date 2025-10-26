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
    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        department: true,
        AttendanceRecord: true,
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

    if (employees.length === 0) {
      return NextResponse.json([]);
    }

    const employeePerformance = employees.map((employee) => {
      console.log(
        `Processing employee: ${employee.firstName} ${employee.lastName}`
      );
      console.log(
        `- Total attendance records: ${employee.AttendanceRecord.length}`
      );
      console.log(`- Total assigned tasks: ${employee.assignedTasks.length}`);
      console.log(
        `- Completed tasks: ${employee.assignedTasks.filter((t) => t.status === "COMPLETED").length}`
      );

      // Calculate performance metrics
      const attendanceRate = calculateAttendanceRate(employee.AttendanceRecord);
      const taskPerformance = calculateTaskPerformance(employee.assignedTasks);
      const productivity = calculateProductivity(employee.assignedTasks);
      const projectContribution = calculateProjectContribution(
        employee.assignedTasks
      );
      const teamwork = calculateTeamwork(employee.assignedTasks);

      console.log(
        `Final metrics - Attendance: ${attendanceRate}%, Tasks: ${taskPerformance}%, Productivity: ${productivity}%`
      );

      const overallScore = Math.round(
        attendanceRate * 0.2 +
          taskPerformance * 0.3 +
          productivity * 0.25 +
          projectContribution * 0.15 +
          teamwork * 0.1
      );

      return {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        department: employee.department?.name,
        avatar: employee.avatar,
        currentPoints: overallScore,
        trend: calculateEmployeeTrend(employee),
        status: getPerformanceStatus(overallScore),
        metrics: {
          productivity: productivity,
          quality: taskPerformance,
          attendance: attendanceRate,
          teamwork: teamwork,
        },
        goals: getEmployeeGoals(taskPerformance, attendanceRate, productivity),
        warnings: employee.Warning.map((warning) => ({
          id: warning.id,
          type: warning.type,
          reason: warning.reason,
          severity: warning.severity,
          date: warning.date.toISOString(),
        })),
      };
    });

    return NextResponse.json(employeePerformance);
  } catch (error) {
    console.error("Employees performance API error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// FIXED CALCULATION FUNCTIONS WITH PROPER TYPING

function calculateAttendanceRate(records: any[]): number {
  if (records.length === 0) {
    console.log("No attendance records found");
    return 0;
  }

  // Weighted attendance calculation with proper typing
  const weights: AttendanceWeights = {
    PRESENT: 1.0, // Full credit
    HALF_DAY: 0.8, // 80% credit
    LATE: 0.7, // 70% credit (favorable but less favorable)
    SICK_LEAVE: 0.5, // 50% credit
    ANNUAL_LEAVE: 0.5, // 50% credit
    UNPAID_LEAVE: 0.3, // 30% credit
    ABSENT: 0.0, // No credit
  };

  let totalScore = 0;
  let totalPossible = records.length; // Each day is worth 1 point max

  records.forEach((record) => {
    const status = record.status as AttendanceStatus;
    const weight = weights[status] || 0;
    totalScore += weight;
  });

  const rate = Math.round((totalScore / totalPossible) * 100);

  console.log(`Attendance calculation:`);
  console.log(`  Total records: ${records.length}`);
  console.log(`  Weighted score: ${totalScore}/${totalPossible}`);
  console.log(`  Rate: ${rate}%`);

  // Breakdown by status with proper typing
  const statusCount: Record<string, number> = {};
  records.forEach((record) => {
    const status = record.status as string;
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  console.log(`  Status breakdown:`, statusCount);

  return rate;
}

function calculateTaskPerformance(tasks: any[]): number {
  if (tasks.length === 0) {
    console.log("No tasks assigned");
    return 0;
  }

  // Count completed tasks vs total tasks (excluding cancelled)
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

  console.log(`Task performance calculation:`);
  console.log(`  Total tasks: ${tasks.length}`);
  console.log(`  Completed: ${completedTasks}`);
  console.log(`  Cancelled: ${cancelledTasks}`);
  console.log(`  Completion rate: ${rate}%`);

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

  let totalEfficiency = 0;
  let validTasksWithTime = 0;
  let tasksWithoutTime = 0;

  completedTasks.forEach((task, index) => {
    const estimatedHours = task.estimatedHours
      ? Number(task.estimatedHours)
      : 8;
    const actualHours = task.timeEntries.reduce((sum: number, entry: any) => {
      return sum + (entry.hours ? Number(entry.hours) : 0);
    }, 0);

    console.log(
      `Completed Task ${index + 1}: estimated=${estimatedHours}h, actual=${actualHours}h`
    );

    if (actualHours > 0) {
      // Task has time entries - calculate actual efficiency
      const efficiency =
        estimatedHours > 0 ? (estimatedHours / actualHours) * 100 : 100; // If no estimate, assume good productivity

      // Cap efficiency between 50% and 150% to avoid extreme values
      const cappedEfficiency = Math.max(50, Math.min(150, efficiency));
      totalEfficiency += cappedEfficiency;
      validTasksWithTime++;
    } else {
      // Task has no time entries - assume good productivity (100%)
      // but with a small penalty to encourage time tracking
      totalEfficiency += 90; // 90% for completed tasks without time tracking
      tasksWithoutTime++;
    }
  });

  const productivity =
    completedTasks.length > 0
      ? Math.round(totalEfficiency / completedTasks.length)
      : 0;

  console.log(`Productivity calculation:`);
  console.log(`  Completed tasks: ${completedTasks.length}`);
  console.log(`  Tasks with time entries: ${validTasksWithTime}`);
  console.log(`  Tasks without time entries: ${tasksWithoutTime}`);
  console.log(`  Final productivity: ${productivity}%`);

  return productivity;
}

function calculateProjectContribution(tasks: any[]): number {
  if (tasks.length === 0) return 0;

  // Get all unique projects the employee has worked on
  const uniqueProjects = new Set(
    tasks.map((task) => task.projectId).filter(Boolean)
  ).size;

  // Calculate contribution based on project involvement and task completion
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

  console.log(
    `Project contribution: ${contribution}% (across ${uniqueProjects} projects)`
  );
  return contribution;
}

function calculateTeamwork(tasks: any[]): number {
  if (tasks.length === 0) return 0;

  // Teamwork based on:
  // 1. Tasks with subtasks (collaboration)
  // 2. Tasks in REVIEW status (peer review)
  // 3. Variety of projects (cross-team work)

  const collaborativeTasks = tasks.filter(
    (task) => task.Subtask && task.Subtask.length > 0
  ).length;

  const reviewTasks = tasks.filter((task) => task.status === "REVIEW").length;

  const uniqueProjects = new Set(
    tasks.map((task) => task.projectId).filter(Boolean)
  ).size;

  // Calculate teamwork score (0-100)
  const collaborationScore = (collaborativeTasks / tasks.length) * 40;
  const reviewScore = (reviewTasks / tasks.length) * 30;
  const projectDiversityScore = Math.min(uniqueProjects * 10, 30);

  const teamwork = Math.round(
    collaborationScore + reviewScore + projectDiversityScore
  );

  console.log(`Teamwork calculation:`);
  console.log(`  Collaborative tasks: ${collaborativeTasks}/${tasks.length}`);
  console.log(`  Review tasks: ${reviewTasks}/${tasks.length}`);
  console.log(`  Unique projects: ${uniqueProjects}`);
  console.log(`  Score: ${teamwork}%`);

  return teamwork;
}

function calculateEmployeeTrend(employee: any): string {
  const taskPerformance = calculateTaskPerformance(employee.assignedTasks);
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

function getEmployeeGoals(
  taskPerformance: number,
  attendanceRate: number,
  productivity: number
) {
  return [
    {
      title: "Task Completion Rate",
      progress: taskPerformance,
      status: getGoalStatus(taskPerformance),
    },
    {
      title: "Attendance Rate",
      progress: attendanceRate,
      status: getGoalStatus(attendanceRate),
    },
    {
      title: "Productivity",
      progress: productivity,
      status: getGoalStatus(productivity),
    },
  ];
}

function getGoalStatus(progress: number): string {
  if (progress >= 90) return "Completed";
  if (progress >= 70) return "In Progress";
  return "Behind";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, type, severity, reason, actionPlan } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const warning = await db.warning.create({
      data: {
        employeeId,
        type: type,
        severity: severity,
        reason: reason,
        actionPlan: actionPlan,
        status: "ACTIVE",
        date: new Date(),
      },
    });

    return NextResponse.json(warning);
  } catch (error) {
    console.error("Create warning API error:", error);
    return NextResponse.json(
      { error: "Failed to create warning" },
      { status: 500 }
    );
  }
}
