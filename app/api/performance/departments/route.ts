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
    const departments = await db.department.findMany({
      where: { status: "ACTIVE" },
      include: {
        employees: {
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
                subtask: true,
                project: true,
              },
            },
            Warning: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
    });

    const departmentStats = departments.map((dept) => {
      if (!dept.employees || dept.employees.length === 0) {
        return {
          name: dept.name,
          avgScore: 0,
          employees: [],
          color: getDepartmentColor(dept.name),
        };
      }

      const employeesWithScores = dept.employees.map((employee) => {
        try {
          // Calculate individual metrics for each employee
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
            avatar: employee.avatar,
            currentPoints: overallScore,
            trend: calculateEmployeeTrend(employee),
            metrics: {
              productivity: productivity,
              quality: taskPerformance,
              attendance: attendanceRate,
              teamwork: teamwork,
            },
            warnings: (employee.Warning || []).map((warning) => ({
              id: warning.id,
              type: warning.type,
              reason: warning.reason,
              severity: warning.severity,
              date: warning.date.toISOString(),
            })),
          };
        } catch (error) {
          console.error(
            "Error calculating score for employee:",
            employee.id,
            error
          );
          return {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            position: employee.position,
            avatar: employee.avatar,
            currentPoints: 75,
            trend: "stable",
            metrics: {
              productivity: 75,
              quality: 75,
              attendance: 85,
              teamwork: 80,
            },
            warnings: [],
          };
        }
      });

      const avgScore =
        employeesWithScores.length > 0
          ? employeesWithScores.reduce(
              (sum, emp) => sum + emp.currentPoints,
              0
            ) / employeesWithScores.length
          : 0;

      return {
        name: dept.name,
        avgScore: Math.round(avgScore),
        employees: employeesWithScores,
        color: getDepartmentColor(dept.name),
      };
    });

    return NextResponse.json(departmentStats);
  } catch (error) {
    console.error("Departments performance API error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// FIXED Calculation functions with proper typing
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
    } else {
      totalEfficiency += 90;
    }
  });

  return Math.round(totalEfficiency / completedTasks.length);
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

function calculateEmployeeTrend(employee: any): string {
  const taskPerformance = calculateTaskPerformance(employee.assignedTasks);
  if (taskPerformance >= 80) return "up";
  if (taskPerformance >= 60) return "stable";
  return "down";
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
