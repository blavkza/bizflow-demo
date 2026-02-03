import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Fetch User Data with Deep Nested Includes
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

            // Attendance records (Raw list)
            AttendanceRecord: {
              include: {
                overtimeRequest: true,
              },
              orderBy: {
                date: "desc",
              },
              take: 60,
            },

            overtimeRequests: {
              orderBy: {
                requestedAt: "desc",
              },
              take: 10,
            },

            employeeNotification: {
              orderBy: {
                createdAt: "desc",
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
                    // FIX: Ensure Folder/Document/Note are included
                    Folder: {
                      include: {
                        Document: true,
                        Note: true,
                      },
                    },
                    // FIX: Ensure Comment and Reply are included
                    comment: {
                      include: {
                        commentReply: true,
                      },
                    },
                    // FIX: Explicitly include 'tool' relation on toolInterUses
                    toolInterUses: {
                      include: {
                        tool: true,
                      },
                    },
                    workLogs: {
                      orderBy: {
                        date: "desc",
                      },
                      take: 50,
                    },
                    Expense: true,
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
                paymentBonuses: true,
                paymentDeductions: true,
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

            // Employee Tools
            tools: {
              include: {
                parentTool: true,
                subTools: true,
              },
              orderBy: {
                allocatedDate: "desc",
              },
            },
          },
        },

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

        workLogs: {
          include: {
            project: true,
          },
          orderBy: {
            date: "desc",
          },
          take: 100,
        },

        Project: {
          where: {
            archived: false,
          },
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
            toolInterUses: {
              include: {
                tool: true,
              },
            },
            tasks: {
              include: {
                assignees: true,
                timeEntries: true,
              },
            },
            documents: true,

            Expense: true,
            timeEntries: true,
            workLogs: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        projectTeams: {
          include: {
            project: {
              include: {
                client: true,
                manager: true,
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
                toolInterUses: {
                  include: {
                    tool: true,
                  },
                },
                Expense: true,
                tasks: {
                  include: {
                    assignees: true,
                    timeEntries: true,
                  },
                },
                documents: true,
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

        // General settings linked to the user
        GeneralSetting: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
