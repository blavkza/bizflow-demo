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
            Subtask: true,
          },
        },
      },
    });

    // Group data by month and calculate averages
    const monthlyData: { [key: string]: any } = {};

    employees.forEach((employee) => {
      // Group attendance by month
      employee.AttendanceRecord.forEach((record) => {
        const month = record.date.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month: formatMonth(record.date),
            productivity: [],
            quality: [],
            attendance: [],
            teamwork: [],
          };
        }

        // Calculate attendance for this record
        const weight = getAttendanceWeight(record.status);
        monthlyData[month].attendance.push(weight * 100);
      });

      // Group tasks by month
      employee.assignedTasks.forEach((task) => {
        const month = task.createdAt.toISOString().substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month: formatMonth(task.createdAt),
            productivity: [],
            quality: [],
            attendance: [],
            teamwork: [],
          };
        }

        // Calculate task performance
        if (task.status === "COMPLETED") {
          monthlyData[month].quality.push(100);
        } else {
          monthlyData[month].quality.push(0);
        }

        // Calculate productivity
        const estimatedHours = task.estimatedHours
          ? Number(task.estimatedHours)
          : 8;
        const actualHours = task.timeEntries.reduce(
          (sum, entry) => sum + (entry.hours ? Number(entry.hours) : 0),
          0
        );

        if (actualHours > 0 && estimatedHours > 0) {
          const efficiency = Math.min(
            (estimatedHours / actualHours) * 100,
            150
          );
          monthlyData[month].productivity.push(efficiency);
        } else if (task.status === "COMPLETED") {
          // For completed tasks without time entries, assume 100% productivity
          monthlyData[month].productivity.push(100);
        }

        // Calculate teamwork (based on subtasks)
        const teamworkScore = task.Subtask && task.Subtask.length > 0 ? 100 : 0;
        monthlyData[month].teamwork.push(teamworkScore);
      });
    });

    // Calculate averages for each month - no fallback values
    const trendsData = Object.values(monthlyData)
      .map((monthData) => {
        const productivity = average(monthData.productivity);
        const quality = average(monthData.quality);
        const attendance = average(monthData.attendance);
        const teamwork = average(monthData.teamwork);

        // Only include months that have actual data
        if (productivity > 0 || quality > 0 || attendance > 0 || teamwork > 0) {
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
      .filter(Boolean); // Remove null entries

    // Sort by date and take last 6 months
    const sortedData = trendsData
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6);

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error("Performance trends API error:", error);
    return NextResponse.json([], { status: 200 });
  }
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

function average(arr: number[]): number {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
