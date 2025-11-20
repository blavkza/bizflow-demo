import db from "@/lib/db";
import { TaskStatus } from "@prisma/client";
import { NextResponse } from "next/server";

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

            // Attendance records with calculations
            AttendanceRecord: {
              orderBy: {
                date: "desc",
              },
              take: 30, // Last 30 days
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

            // Warnings with details
            Warning: {
              orderBy: {
                date: "desc",
              },
            },

            // Payments with transaction details
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

            // Leave requests with status
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
          },
        },

        // User's own time entries across all projects
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

        // User's work logs across all projects
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
                assignedTasks: {
                  include: {
                    project: true,
                  },
                },
                AttendanceRecord: {
                  orderBy: {
                    date: "desc",
                  },
                  take: 7,
                },
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

    // Calculate additional statistics
    const enhancedUser = {
      ...user,
      statistics: await calculateUserStatistics(userId, user),
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

// Helper function to calculate user statistics
async function calculateUserStatistics(userId: string, user: any) {
  try {
    // Calculate attendance statistics
    const attendanceRecords = user.employee?.AttendanceRecord || [];
    const recentAttendance = attendanceRecords.slice(0, 30); // Last 30 days

    const presentDays = recentAttendance.filter(
      (record: any) => record.status === "PRESENT"
    ).length;

    const attendanceRate =
      recentAttendance.length > 0
        ? (presentDays / recentAttendance.length) * 100
        : 0;

    // Calculate task statistics
    const assignedTasks = user.employee?.assignedTasks || [];
    const completedTasks = assignedTasks.filter(
      (task: any) => task.status === TaskStatus.COMPLETED
    ).length;

    const taskCompletionRate =
      assignedTasks.length > 0
        ? (completedTasks / assignedTasks.length) * 100
        : 0;

    // Calculate time tracking statistics
    const timeEntries = user.timeEntries || [];
    const totalHoursThisMonth = timeEntries
      .filter((entry: any) => {
        const entryDate = new Date(entry.date);
        const now = new Date();
        return (
          entryDate.getMonth() === now.getMonth() &&
          entryDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce(
        (total: number, entry: any) => total + parseFloat(entry.hours),
        0
      );

    // Calculate project statistics
    const managedProjects = user.Project || [];
    const teamProjects = user.projectTeams || [];
    const allProjects = [
      ...managedProjects,
      ...teamProjects.map((pt: any) => pt.project),
    ];

    const activeProjects = allProjects.filter(
      (project: any) =>
        project.status !== "COMPLETED" && project.status !== "CANCELLED"
    ).length;

    // Calculate leave statistics
    const leaveRequests = user.employee?.leaveRequests || [];
    const approvedLeaveDays = leaveRequests
      .filter((leave: any) => leave.status === "APPROVED")
      .reduce((total: number, leave: any) => total + leave.days, 0);

    const remainingLeaveDays =
      (user.employee?.annualLeaveDays || 0) - approvedLeaveDays;

    return {
      attendance: {
        rate: Math.round(attendanceRate),
        presentDays,
        totalDays: recentAttendance.length,
        recentRecords: recentAttendance,
      },
      tasks: {
        total: assignedTasks.length,
        completed: completedTasks,
        completionRate: Math.round(taskCompletionRate),
        overdue: assignedTasks.filter((task: any) => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) < new Date() && task.status !== "DONE";
        }).length,
      },
      time: {
        totalHoursThisMonth: Math.round(totalHoursThisMonth * 100) / 100,
        averageDailyHours:
          recentAttendance.length > 0
            ? Math.round(
                (totalHoursThisMonth / recentAttendance.length) * 100
              ) / 100
            : 0,
        overtimeHours: timeEntries.reduce((total: number, entry: any) => {
          const regularHours = 8; // Assuming 8-hour workday
          const overtime = parseFloat(entry.hours) - regularHours;
          return total + Math.max(0, overtime);
        }, 0),
      },
      projects: {
        total: allProjects.length,
        active: activeProjects,
        completed: allProjects.filter((p: any) => p.status === "COMPLETED")
          .length,
      },
      leave: {
        remainingDays: Math.max(0, remainingLeaveDays),
        usedDays: approvedLeaveDays,
        totalDays: user.employee?.annualLeaveDays || 0,
        pendingRequests: leaveRequests.filter(
          (l: any) => l.status === "PENDING"
        ).length,
      },
      performance: {
        overallScore: calculateOverallPerformance(user),
        lastEvaluation: user.employee?.kpiResults[0]?.createdAt || null,
      },
    };
  } catch (error) {
    console.error("Error calculating statistics:", error);
    return {};
  }
}

// Helper function to calculate overall performance score
function calculateOverallPerformance(user: any) {
  const weights = {
    attendance: 0.3,
    taskCompletion: 0.4,
    timeManagement: 0.2,
    projectInvolvement: 0.1,
  };

  const statistics = user.statistics || {};

  const attendanceScore = statistics.attendance?.rate || 0;
  const taskScore = statistics.tasks?.completionRate || 0;
  const timeScore = Math.min(
    100,
    ((statistics.time?.totalHoursThisMonth || 0) / 160) * 100
  ); // 160 hours monthly target
  const projectScore = statistics.projects?.active > 0 ? 100 : 0;

  const overallScore =
    attendanceScore * weights.attendance +
    taskScore * weights.taskCompletion +
    timeScore * weights.timeManagement +
    projectScore * weights.projectInvolvement;

  return Math.round(overallScore);
}
