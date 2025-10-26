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
            Subtask: true,
          },
        },
      },
    });

    // Calculate scores for all employees using the same logic as individual performance
    const scores = employees
      .map((employee) => {
        try {
          const attendanceRate = calculateAttendanceRate(
            employee.AttendanceRecord || []
          );
          const taskPerformance = calculateTaskPerformance(
            employee.assignedTasks || []
          );
          const productivity = calculateProductivity(
            employee.assignedTasks || []
          );
          const projectContribution = calculateProjectContribution(
            employee.assignedTasks || []
          );
          const teamwork = calculateTeamwork(employee.assignedTasks || []);

          return Math.round(
            attendanceRate * 0.2 +
              taskPerformance * 0.3 +
              productivity * 0.25 +
              projectContribution * 0.15 +
              teamwork * 0.1
          );
        } catch (error) {
          console.error(
            "Error calculating distribution score for employee:",
            employee.id,
            error
          );
          return 0; // Return 0 instead of 75 for failed calculations
        }
      })
      .filter((score) => score > 0); // Only include valid scores

    // Count employees in each performance category
    const excellent = scores.filter((score) => score >= 90).length;
    const good = scores.filter((score) => score >= 80 && score < 90).length;
    const average = scores.filter((score) => score >= 70 && score < 80).length;
    const needsImprovement = scores.filter(
      (score) => score < 70 && score > 0
    ).length;

    const distribution = [
      { name: "Excellent (90-100)", value: excellent, fill: "#22c55e" },
      { name: "Good (80-89)", value: good, fill: "#3b82f6" },
      { name: "Average (70-79)", value: average, fill: "#f59e0b" },
      {
        name: "Needs Improvement (<70)",
        value: needsImprovement,
        fill: "#ef4444",
      },
    ];

    return NextResponse.json(distribution);
  } catch (error) {
    console.error("Performance distribution API error:", error);
    return NextResponse.json([], { status: 200 });
  }
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

  let totalEfficiency = 0;
  let validTasks = 0;

  completedTasks.forEach((task) => {
    const estimatedHours = task.estimatedHours
      ? Number(task.estimatedHours)
      : 8;
    const actualHours = task.timeEntries.reduce((sum: number, entry: any) => {
      return sum + (entry.hours ? Number(entry.hours) : 0);
    }, 0);

    if (actualHours > 0) {
      const efficiency =
        estimatedHours > 0 ? (estimatedHours / actualHours) * 100 : 100;
      const cappedEfficiency = Math.max(50, Math.min(150, efficiency));
      totalEfficiency += cappedEfficiency;
      validTasks++;
    } else {
      // For completed tasks without time entries, use default productivity
      totalEfficiency += 100;
      validTasks++;
    }
  });

  return validTasks > 0 ? Math.round(totalEfficiency / validTasks) : 0;
}

function calculateProjectContribution(tasks: any[]): number {
  if (tasks.length === 0) return 0;
  const uniqueProjects = new Set(
    tasks.map((task) => task.projectId).filter(Boolean)
  ).size;
  return Math.min(uniqueProjects * 20, 100);
}

function calculateTeamwork(tasks: any[]): number {
  if (tasks.length === 0) return 0;
  const collaborativeTasks = tasks.filter(
    (task) => task.Subtask && task.Subtask.length > 0
  ).length;
  const reviewTasks = tasks.filter((task) => task.status === "REVIEW").length;
  const uniqueProjects = new Set(
    tasks.map((task) => task.projectId).filter(Boolean)
  ).size;

  const collaborationScore = (collaborativeTasks / tasks.length) * 40;
  const reviewScore = (reviewTasks / tasks.length) * 30;
  const projectDiversityScore = Math.min(uniqueProjects * 10, 30);

  return Math.round(collaborationScore + reviewScore + projectDiversityScore);
}
