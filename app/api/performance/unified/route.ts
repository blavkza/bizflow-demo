import db from "@/lib/db";
import { AttendanceStatus, TaskStatus } from "@prisma/client";
import { NextResponse } from "next/server";

// --- Types for specific logic ---
type AttendanceWeights = {
  [key in
    | AttendanceStatus
    | "HALF_DAY"
    | "LATE"
    | "SICK_LEAVE"
    | "ANNUAL_LEAVE"
    | "UNPAID_LEAVE"
    | "ABSENT"]: number;
};

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // 1. Fetch User Data with Deep Nested Includes
    const user = await db.user.findUnique({
      where: {
        userId,
      },
      include: {
        employee: {
          include: {
            // Department with full hierarchy
            department: {
              include: {
                manager: true,
                parent: true,
                children: true,
              },
            },

            // Attendance records
            AttendanceRecord: {
              orderBy: {
                date: "desc",
              },
              take: 60,
            },

            // Tasks with full project and assignment details
            assignedTasks: {
              include: {
                project: {
                  include: {
                    client: true,
                    manager: true,
                    teamMembers: {
                      include: {
                        user: true,
                      },
                    },
                    Folder: {
                      include: {
                        Document: true,
                        Note: true,
                      },
                    },
                    comment: {
                      include: {
                        commentReply: true,
                      },
                    },
                    toolInterUses: true,
                    workLogs: {
                      orderBy: {
                        date: "desc",
                      },
                      take: 50,
                    },
                    tasks: {
                      include: {
                        assignees: true,
                        freeLancerAssignees: true,
                        timeEntries: {
                          where: {
                            userId: userId,
                          },
                        },
                        subtask: true,
                      },
                    },
                  },
                },
                subtask: {
                  orderBy: {
                    order: "asc",
                  },
                },
                timeEntries: {
                  orderBy: {
                    date: "desc",
                  },
                  take: 50,
                },
                assignees: {
                  include: {
                    department: true,
                  },
                },
                freeLancerAssignees: true,
                documents: true,
                comment: {
                  include: {
                    commentReply: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },

            // Warnings
            Warning: {
              orderBy: {
                date: "desc",
              },
            },

            // Payments
            payments: {
              include: {
                transaction: {
                  include: {
                    category: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },

            // Leave requests
            leaveRequests: {
              orderBy: {
                requestedDate: "desc",
              },
            },

            // Documents
            documents: {
              orderBy: {
                createdAt: "desc",
              },
            },

            // Notes
            Note: {
              orderBy: {
                createdAt: "desc",
              },
            },

            // KPI Results
            kpiResults: {
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
        },

        // User's own time entries
        timeEntries: {
          include: {
            project: true,
            task: true,
          },
          orderBy: {
            date: "desc",
          },
          take: 100,
        },

        // User's work logs
        workLogs: {
          include: {
            project: true,
          },
          orderBy: {
            date: "desc",
          },
          take: 100,
        },

        // Projects where user is manager
        Project: {
          where: {
            archived: false,
          },
          include: {
            client: true,
            teamMembers: {
              include: {
                user: true,
              },
            },
            tasks: {
              include: {
                assignees: true,
                timeEntries: true,
              },
            },
            timeEntries: true,
            workLogs: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        // Projects where user is team member
        projectTeams: {
          include: {
            project: {
              include: {
                client: true,
                manager: true,
                tasks: {
                  include: {
                    assignees: true,
                    timeEntries: true,
                  },
                },
                timeEntries: true,
                workLogs: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        // Departments managed by user
        managedDepartments: {
          include: {
            employees: {
              include: {
                department: true,
                assignedTasks: {
                  include: {
                    subtask: true,
                    timeEntries: true,
                    project: true,
                  },
                },
                AttendanceRecord: {
                  orderBy: {
                    date: "desc",
                  },
                  take: 30,
                },
                Warning: true,
              },
            },
            freelancers: true,
            children: true,
          },
        },

        // Notifications
        notifications: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },

        // Activity logs
        activityLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },

        // Dashboard settings
        dashboardSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Calculate additional statistics
    const statistics = await calculateUserStatistics(user);

    const enhancedUser = {
      ...user,
      statistics,
    };

    return NextResponse.json(enhancedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ==========================================
//  CALCULATION LOGIC
// ==========================================

async function calculateUserStatistics(user: any) {
  try {
    const attendanceRecords = user.employee?.AttendanceRecord || [];
    const assignedTasks = user.employee?.assignedTasks || [];

    // Calculate Metric Scores
    const attendanceScore = calculateAttendanceRate(attendanceRecords);
    const taskScore = calculateTaskPerformance(assignedTasks);
    const productivityScore = calculateProductivity(assignedTasks);
    const teamworkScore = calculateTeamwork(assignedTasks);
    const projectContribution = calculateProjectContribution(assignedTasks);

    // Calculate Overall Score
    const overallScore = calculateWeightedScore({
      attendance: attendanceScore,
      tasks: taskScore,
      productivity: productivityScore,
      teamwork: teamworkScore,
      projects: projectContribution,
    });

    // Manager View Logic
    let managerStats = null;
    if (user.managedDepartments && user.managedDepartments.length > 0) {
      // Flatten employees from all managed departments
      const allManagedEmployees = user.managedDepartments.flatMap(
        (dept: any) => dept.employees || []
      );

      const employeesWithScores = allManagedEmployees.map((emp: any) => {
        const empScore = calculateWeightedScore({
          attendance: calculateAttendanceRate(emp.AttendanceRecord || []),
          tasks: calculateTaskPerformance(emp.assignedTasks || []),
          productivity: calculateProductivity(emp.assignedTasks || []),
          teamwork: calculateTeamwork(emp.assignedTasks || []),
          projects: calculateProjectContribution(emp.assignedTasks || []),
        });
        return { ...emp, currentPoints: empScore };
      });

      const warnings = employeesWithScores.flatMap((e: any) => e.Warning || []);

      managerStats = {
        overview: calculateOverview(employeesWithScores, warnings),
        departmentAnalysis: calculateDepartmentAnalysis(employeesWithScores),
        performanceDistribution:
          calculatePerformanceDistribution(employeesWithScores),
        departmentStats: calculateDepartmentStats(employeesWithScores),
      };
    }

    return {
      performance: {
        overallScore,
        rating: getPerformanceStatus(overallScore),
        scores: {
          attendance: attendanceScore,
          tasks: taskScore,
          productivity: productivityScore,
          teamwork: teamworkScore,
          projects: projectContribution,
        },
        goals: getEmployeeGoals({
          taskPerformance: taskScore,
          attendanceRate: attendanceScore,
          productivity: productivityScore,
        }),
        trend: calculateEmployeeTrend(taskScore),
      },
      metrics: {
        totalTasks: assignedTasks.length,
        completedTasks: assignedTasks.filter(
          (t: any) => t.status === "COMPLETED"
        ).length, // CORRECTED: using Enum value [cite: 367]
        attendanceDays: attendanceRecords.length,
        presentDays: attendanceRecords.filter(
          (r: any) => r.status === "PRESENT"
        ).length,
      },
      managerView: managerStats,
    };
  } catch (error) {
    console.error("Error calculating statistics:", error);
    return {};
  }
}

function calculateWeightedScore(scores: any) {
  // Weights based on your logic preference
  return Math.round(
    scores.attendance * 0.25 +
      scores.tasks * 0.3 +
      scores.productivity * 0.2 +
      scores.teamwork * 0.15 +
      scores.projects * 0.1
  );
}

// ==========================================
//  HELPER FUNCTIONS
// ==========================================

function calculateAttendanceRate(records: any[]): number {
  if (!records || records.length === 0) return 0;

  const weights: AttendanceWeights = {
    PRESENT: 1.0,
    HALF_DAY: 0.8,
    LATE: 0.7,
    SICK_LEAVE: 0.5,
    ANNUAL_LEAVE: 0.5,
    UNPAID_LEAVE: 0.3,
    ABSENT: 0.0,
    MATERNITY_LEAVE: 1.0,
    PATERNITY_LEAVE: 1.0,
    STUDY_LEAVE: 1.0,
  };

  let totalScore = 0;
  records.forEach((record) => {
    const status = record.status as keyof AttendanceWeights;
    const weight = weights[status] !== undefined ? weights[status] : 0;
    totalScore += weight;
  });

  return Math.round((totalScore / records.length) * 100);
}

function calculateTaskPerformance(tasks: any[]): number {
  if (!tasks || tasks.length === 0) return 0;

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
  if (!tasks || tasks.length === 0) return 0;

  const completedTasks = tasks.filter((task) => task.status === "COMPLETED");
  if (completedTasks.length === 0) return 0;

  let totalProductivity = 0;
  let validTasks = 0;

  completedTasks.forEach((task) => {
    // Handle Decimal fields from Prisma
    const estimatedHours = task.estimatedHours
      ? Number(task.estimatedHours)
      : 8;

    const actualHours = task.timeEntries
      ? task.timeEntries.reduce((sum: number, entry: any) => {
          return sum + (entry.hours ? Number(entry.hours) : 0);
        }, 0)
      : 0;

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
  if (!tasks || tasks.length === 0) return 0;

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
  let projectCount = 0;
  completedTasksByProject.forEach((stats) => {
    const completionRate =
      stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    totalProjectContribution += completionRate;
    projectCount++;
  });

  const averageContribution =
    projectCount > 0 ? totalProjectContribution / projectCount : 0;
  return Math.round(Math.min(averageContribution, 100));
}

function calculateTeamwork(tasks: any[]): number {
  if (!tasks || tasks.length === 0) return 50;

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

// --- Dashboard / Aggregate Calculations ---

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
    calculatedAt: new Date().toISOString(),
  };
}

function calculateDepartmentAnalysis(employees: any[]) {
  const deptMap = new Map();

  employees.forEach((emp) => {
    const dept = emp.department?.name || "Unassigned";
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

    const dept = emp.department?.name || "Unassigned";
    if (!deptStats.has(dept)) {
      deptStats.set(dept, { totalScore: 0, count: 0 });
    }
    const stats = deptStats.get(dept);
    stats.totalScore += emp.currentPoints;
    stats.count++;
  });

  return Array.from(deptStats.entries()).map(
    ([name, stats]: [string, any]) => ({
      name,
      avgScore:
        stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0,
      employeeCount: stats.count,
    })
  );
}

function calculateEmployeeTrend(score: number): string {
  if (score >= 80) return "up";
  if (score >= 60) return "stable";
  return "down";
}

function calculateTrend(scores: number[]): string {
  if (scores.length === 0) return "stable";
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 80) return "up";
  if (avg >= 60) return "stable";
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
