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
    // Get employees with their historical data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        AttendanceRecord: {
          where: {
            date: {
              gte: sixMonthsAgo,
            },
          },
        },
        assignedTasks: {
          where: {
            createdAt: {
              gte: sixMonthsAgo,
            },
          },
          include: {
            timeEntries: true,
            subtask: true,
            project: true,
          },
        },
      },
    });

    console.log(`Processing trends for ${employees.length} employees`);

    // Group data by month and calculate averages using SAME logic
    const monthlyData: { [key: string]: any } = {};

    employees.forEach((employee) => {
      // Group by month and calculate metrics using same functions as individual API
      employee.assignedTasks.forEach((task) => {
        const taskMonth = task.createdAt.toISOString().substring(0, 7); // YYYY-MM

        if (!monthlyData[taskMonth]) {
          monthlyData[taskMonth] = {
            month: formatMonth(task.createdAt),
            productivity: [],
            quality: [],
            attendance: [],
            teamwork: [],
            projectContribution: [],
          };
        }

        // Calculate metrics for this task using SAME functions
        const monthData = monthlyData[taskMonth];

        // Quality (task completion)
        if (task.status === "COMPLETED") {
          monthData.quality.push(100);
        } else {
          monthData.quality.push(0);
        }

        // Productivity (same calculation as individual API)
        const taskProductivity = calculateTaskProductivity(task);
        if (taskProductivity > 0) {
          monthData.productivity.push(taskProductivity);
        }

        // Teamwork (same calculation as individual API)
        const taskTeamwork = calculateTaskTeamwork(task);
        monthData.teamwork.push(taskTeamwork);

        // Project contribution
        if (task.projectId) {
          monthData.projectContribution.push(100); // Simplified for trends
        }
      });

      // Process attendance records for this month
      employee.AttendanceRecord.forEach((record) => {
        const attendanceMonth = record.date.toISOString().substring(0, 7);

        if (!monthlyData[attendanceMonth]) {
          monthlyData[attendanceMonth] = {
            month: formatMonth(record.date),
            productivity: [],
            quality: [],
            attendance: [],
            teamwork: [],
            projectContribution: [],
          };
        }

        // Attendance (same calculation as individual API)
        const weight = getAttendanceWeight(record.status);
        monthlyData[attendanceMonth].attendance.push(weight * 100);
      });
    });

    // Calculate averages for each month using same approach
    const trendsData = Object.values(monthlyData)
      .map((monthData) => {
        // Use same averaging logic but ensure we have reasonable data
        const productivity = calculateMonthlyAverage(
          monthData.productivity,
          85
        );
        const quality = calculateMonthlyAverage(monthData.quality, 75);
        const attendance = calculateMonthlyAverage(monthData.attendance, 90);
        const teamwork = calculateMonthlyAverage(monthData.teamwork, 60);

        // Only include months with sufficient data
        const totalDataPoints =
          monthData.productivity.length +
          monthData.quality.length +
          monthData.attendance.length +
          monthData.teamwork.length;

        if (totalDataPoints >= 5) {
          // Require minimum data points
          return {
            month: monthData.month,
            productivity: Math.round(productivity),
            quality: Math.round(quality),
            attendance: Math.round(attendance),
            teamwork: Math.round(teamwork),
            _debug: {
              dataPoints: {
                productivity: monthData.productivity.length,
                quality: monthData.quality.length,
                attendance: monthData.attendance.length,
                teamwork: monthData.teamwork.length,
              },
            },
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months

    console.log(`Generated trends for ${trendsData.length} months`);

    return NextResponse.json(trendsData);
  } catch (error) {
    console.error("Performance trends API error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// SAME CALCULATION FUNCTIONS as individual performance API

function calculateTaskProductivity(task: any): number {
  if (task.status !== "COMPLETED") return 0;

  const estimatedHours = task.estimatedHours ? Number(task.estimatedHours) : 8;
  const actualHours = task.timeEntries.reduce(
    (sum, entry) => sum + (entry.hours ? Number(entry.hours) : 0),
    0
  );

  let taskProductivity = 100; // Default for completed tasks

  if (actualHours > 0 && estimatedHours > 0) {
    taskProductivity = Math.min((estimatedHours / actualHours) * 100, 120);
    taskProductivity = Math.max(70, taskProductivity);
  } else {
    taskProductivity = 90; // Penalty for no time tracking
  }

  return taskProductivity;
}

function calculateTaskTeamwork(task: any): number {
  let teamworkScore = 0;

  // Collaborative tasks (with subtasks)
  if (task.subtask && task.subtask.length > 0) {
    teamworkScore += 50;
  }

  // Review tasks
  if (task.status === "REVIEW") {
    teamworkScore += 30;
  }

  // Project diversity
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

function formatMonth(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getAttendanceWeight(status: string): number {
  const weights: AttendanceWeights = {
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
