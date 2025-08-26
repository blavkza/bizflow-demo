import { NextResponse } from "next/server";
import db from "@/lib/db";
import { chatSession } from "@/configs/AiModel";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
  }

  try {
    const currentDate = new Date();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with role, permissions, and project relationships
    const user = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
        projectTeams: {
          include: {
            project: {
              include: {
                client: true,
                teamMembers: true,
                tasks: true,
              },
            },
          },
        },
        managedDepartments: {
          select: {
            id: true,
            name: true,
          },
        },
        Project: {
          where: {
            managerId: userId,
          },
          include: {
            client: true,
            teamMembers: true,
            tasks: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has AI system permission
    const hasAIPermission = user.permissions.some(
      (permission) => permission === "SYSTEMS_AI"
    );

    if (!hasAIPermission && user.role !== "CHIEF_EXECUTIVE_OFFICER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get all project IDs user has access to (as manager or team member)
    const managedProjectIds = user.Project.map((p) => p.id);
    const teamMemberProjectIds = user.projectTeams.map((pt) => pt.projectId);
    const userProjectIds = [
      ...new Set([...managedProjectIds, ...teamMemberProjectIds]),
    ];

    const userManagedDepartmentIds = user.managedDepartments.map((d) => d.id);

    // Helper function to check project access
    const hasProjectAccess = (
      projectId: string | null | undefined
    ): boolean => {
      if (!projectId) return false;
      if (user.role === "CHIEF_EXECUTIVE_OFFICER") return true;
      return userProjectIds.includes(projectId);
    };

    // Helper function to check department access
    const hasDepartmentAccess = (
      departmentId: string | null | undefined
    ): boolean => {
      if (!departmentId) return false;
      if (user.role === "CHIEF_EXECUTIVE_OFFICER") return true;
      return userManagedDepartmentIds.includes(departmentId);
    };

    // Helper function to check general permission
    const hasPermission = (requiredPermission: string): boolean => {
      if (user.role === "CHIEF_EXECUTIVE_OFFICER") return true;
      return user.permissions.some(
        (permission) => permission === requiredPermission
      );
    };

    // Data fetching promises
    const dataFetchers: Promise<any>[] = [];

    // CLIENTS
    if (
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      hasPermission("Clients_VIEW")
    ) {
      dataFetchers.push(
        db.client.findMany({
          include: {
            invoices: {
              include: {
                payments: true,
                items: true,
              },
              where:
                user.role !== "CHIEF_EXECUTIVE_OFFICER"
                  ? {
                      OR: [
                        { projectId: { in: userProjectIds } },
                        { createdBy: user.id },
                      ],
                    }
                  : undefined,
            },
            quotations: {
              include: {
                items: true,
              },
              where:
                user.role !== "CHIEF_EXECUTIVE_OFFICER"
                  ? {
                      OR: [
                        { projectId: { in: userProjectIds } },
                        { departmentId: { in: userManagedDepartmentIds } },
                        { createdBy: user.id },
                      ],
                    }
                  : undefined,
            },
            projects: {
              where:
                user.role !== "CHIEF_EXECUTIVE_OFFICER"
                  ? {
                      OR: [
                        { id: { in: userProjectIds } },
                        { managerId: user.id },
                      ],
                    }
                  : undefined,
              include: {
                teamMembers: true,
                tasks: true,
              },
            },
            documents: true,
          },
          where:
            user.role !== "CHIEF_EXECUTIVE_OFFICER"
              ? {
                  OR: [
                    { projects: { some: { id: { in: userProjectIds } } } },
                    { invoices: { some: { createdBy: user.id } } },
                    { quotations: { some: { createdBy: user.id } } },
                  ],
                }
              : undefined,
        })
      );
    } else {
      dataFetchers.push(Promise.resolve([]));
    }

    // INVOICES
    if (
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      hasPermission("INVOICES_VIEW")
    ) {
      dataFetchers.push(
        db.invoice.findMany({
          include: {
            client: true,
            payments: true,
            items: true,
            Project: true,
            Transaction: true,
          },
          where:
            user.role !== "CHIEF_EXECUTIVE_OFFICER"
              ? {
                  OR: [
                    { projectId: { in: userProjectIds } },
                    { createdBy: user.id },
                  ],
                }
              : undefined,
          orderBy: { dueDate: "asc" },
        })
      );
    } else {
      dataFetchers.push(Promise.resolve([]));
    }

    // TRANSACTIONS
    if (
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      hasPermission("TRANSACTIONS_VIEW")
    ) {
      dataFetchers.push(
        db.transaction.findMany({
          include: {
            invoice: {
              include: {
                client: true,
                items: true,
                payments: true,
              },
            },
            category: true,
            splits: {
              include: {
                category: true,
              },
            },
            department: true,
            client: true,
          },
          where:
            user.role !== "CHIEF_EXECUTIVE_OFFICER"
              ? {
                  OR: [
                    { createdBy: user.id },
                    { departmentId: { in: userManagedDepartmentIds } },
                    { invoice: { projectId: { in: userProjectIds } } },
                  ],
                }
              : undefined,
          orderBy: { date: "desc" },
        })
      );
    } else {
      dataFetchers.push(Promise.resolve([]));
    }

    // QUOTATIONS
    if (
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      hasPermission("QUOTATIONS_VIEW")
    ) {
      dataFetchers.push(
        db.quotation.findMany({
          include: {
            client: true,
            items: true,
            project: {
              include: {
                client: true,
                teamMembers: true,
              },
            },
            Department: true,
          },
          where:
            user.role !== "CHIEF_EXECUTIVE_OFFICER"
              ? {
                  OR: [
                    { projectId: { in: userProjectIds } },
                    { departmentId: { in: userManagedDepartmentIds } },
                    { createdBy: user.id },
                  ],
                }
              : undefined,
        })
      );
    } else {
      dataFetchers.push(Promise.resolve([]));
    }

    // DEPARTMENTS
    if (
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      hasPermission("DEPARTMENT_VIEW")
    ) {
      dataFetchers.push(
        db.department.findMany({
          include: {
            manager: true,
            parent: true,
            children: true,
            employees: {
              include: {
                department: true,
                assignedTasks: true,
              },
            },
            budgets: true,
            expenses: true,
            Quotation: true,
          },
          where:
            user.role !== "CHIEF_EXECUTIVE_OFFICER"
              ? {
                  OR: [
                    { id: { in: userManagedDepartmentIds } },
                    { managerId: user.id },
                  ],
                }
              : undefined,
        })
      );
    } else {
      dataFetchers.push(Promise.resolve([]));
    }

    // EMPLOYEES
    if (
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      hasPermission("EMPLOYEES_VIEW")
    ) {
      dataFetchers.push(
        db.employee.findMany({
          include: {
            department: true,
            assignedTasks: {
              include: {
                project: true,
              },
            },
            payments: true,
            documents: true,
            targets: true,
            kpiResults: true,
          },
          where:
            user.role !== "CHIEF_EXECUTIVE_OFFICER"
              ? {
                  OR: [
                    { departmentId: { in: userManagedDepartmentIds } },
                    {
                      assignedTasks: {
                        some: { projectId: { in: userProjectIds } },
                      },
                    },
                  ],
                }
              : undefined,
        })
      );
    } else {
      dataFetchers.push(Promise.resolve([]));
    }

    // EMPLOYEE PAYMENTS
    if (
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      hasPermission("PAYMENTS_VIEW")
    ) {
      dataFetchers.push(
        db.payment.findMany({
          include: {
            employee: {
              include: {
                department: true,
              },
            },
            transaction: {
              include: {
                category: true,
                invoice: {
                  include: {
                    client: true,
                  },
                },
              },
            },
          },
          where:
            user.role !== "CHIEF_EXECUTIVE_OFFICER"
              ? {
                  OR: [
                    {
                      employee: {
                        departmentId: { in: userManagedDepartmentIds },
                      },
                    },
                    { createdBy: user.id },
                  ],
                }
              : undefined,
          orderBy: { payDate: "desc" },
        })
      );
    } else {
      dataFetchers.push(Promise.resolve([]));
    }

    // CATEGORIES
    if (
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      hasPermission("CATEGORY_VIEW")
    ) {
      dataFetchers.push(
        db.category.findMany({
          include: {
            parent: true,
            children: true,
            transactions: {
              where:
                user.role !== "CHIEF_EXECUTIVE_OFFICER"
                  ? {
                      OR: [
                        { createdBy: user.id },
                        { departmentId: { in: userManagedDepartmentIds } },
                        { invoice: { projectId: { in: userProjectIds } } },
                      ],
                    }
                  : undefined,
            },
            budgets: true,
            splits: true,
          },
        })
      );
    } else {
      dataFetchers.push(Promise.resolve([]));
    }

    // PRODUCTS
    if (
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      hasPermission("INVENTORY_VIEW")
    ) {
      dataFetchers.push(db.product.findMany());
    } else {
      dataFetchers.push(Promise.resolve([]));
    }

    // PROJECTS (with detailed inclusion)
    if (
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      hasPermission("PROJECTS_VIEW")
    ) {
      dataFetchers.push(
        db.project.findMany({
          include: {
            client: true,
            manager: true,
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
            invoices: {
              include: {
                payments: true,
                items: true,
              },
            },
            quotations: {
              include: {
                items: true,
                Department: true,
              },
            },
            documents: true,
            Note: true,
            Folder: true,
            comment: true,
          },
          where:
            user.role !== "CHIEF_EXECUTIVE_OFFICER"
              ? {
                  OR: [{ id: { in: userProjectIds } }, { managerId: user.id }],
                }
              : undefined,
        })
      );
    } else {
      dataFetchers.push(Promise.resolve([]));
    }

    // Execute all data fetching promises
    const results = await Promise.all(dataFetchers);

    // Extract data from results
    const [
      clients,
      invoices,
      transactions,
      quotations,
      departments,
      employees,
      employeePayments,
      categories,
      products,
      projects,
    ] = results;

    // Calculate financial metrics
    const invoicePayments = transactions.flatMap(
      (t: any) => t.invoice?.payments ?? []
    );
    const totalEmployeePayments = employeePayments.reduce(
      (sum: number, p: any) => sum + Number(p.amount),
      0
    );

    const incomeTransactions = transactions.filter(
      (t: any) => t.type === "INCOME"
    );
    const totalIncome = incomeTransactions.reduce(
      (sum: number, t: any) => sum + Number(t.amount),
      0
    );
    const expenseTransactions = transactions.filter(
      (t: any) => t.type === "EXPENSE"
    );
    const totalExpenses = expenseTransactions.reduce(
      (sum: number, t: any) => sum + Number(t.amount),
      0
    );
    const totalRevenue = totalIncome - totalExpenses;

    const overdueInvoices = invoices.filter(
      (inv: any) =>
        inv.status === "OVERDUE" ||
        (new Date(inv.dueDate) < currentDate && inv.status !== "PAID")
    );

    const totalOverdueAmount = overdueInvoices.reduce(
      (sum: number, inv: any) =>
        sum + (Number(inv.totalAmount) - Number(inv.amount)),
      0
    );

    const recentPayments = invoicePayments.filter((p: any) => {
      const paymentDate = new Date(p.paidAt ?? "");
      const diffDays = Math.ceil(
        Math.abs(currentDate.getTime() - paymentDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return diffDays <= 30;
    });

    const recentEmployeePayments = employeePayments.filter((p: any) => {
      const paymentDate = new Date(p.payDate ?? "");
      const diffDays = Math.ceil(
        Math.abs(currentDate.getTime() - paymentDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return diffDays <= 30;
    });

    const calculateProjectProgress = (tasks: any[]): number => {
      if (!tasks || tasks.length === 0) return 0;

      const completedTasks = tasks.filter(
        (task: any) => task.status === "COMPLETED"
      );
      return Math.round((completedTasks.length / tasks.length) * 100);
    };

    // Prepare comprehensive context data
    let contextData = `
    SYSTEM DATA OVERVIEW (as of ${currentDate.toLocaleDateString()}):

    USER CONTEXT:
    - Role: ${user.role}
    - Name: ${user.name}
    - Email: ${user.email}
    - Managed Departments: ${user.managedDepartments.map((d) => d.name).join(", ")}
    - Managed Projects: ${user.Project.map((p) => p.title).join(", ")}
    - Team Member Projects: ${user.projectTeams.map((pt) => pt.project.title).join(", ")}

    === FINANCIAL SUMMARY ===
    - Total Income: R${totalIncome.toFixed(2)} (from ${incomeTransactions.length} income transactions)
    - Total Expenses: R${totalExpenses.toFixed(2)} (from ${expenseTransactions.length} expense transactions)
    - Employee Payments: R${totalEmployeePayments.toFixed(2)} (${employeePayments.length} payments)
    - Net Revenue: R${totalRevenue.toFixed(2)}
    - Overdue Amount: R${totalOverdueAmount.toFixed(2)}
    - Recent Invoice Payments (30 days): R${recentPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0).toFixed(2)}
    - Recent Employee Payments (30 days): R${recentEmployeePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0).toFixed(2)}

    === CLIENTS (${clients.length}) ===
    ${clients.map((c: any) => `- ${c.name} (${c.status}): ${c.invoices.length} invoices, ${c.quotations.length} quotations, ${c.projects.length} projects`).join("\n")}

    === PROJECTS (${projects.length}) ===
    ${projects
      .map(
        (p: any) => `
    Project: ${p.title} (${p.projectNumber})
    Status: ${p.status}, Priority: ${p.priority}
    Client: ${p.client?.name || "None"}
    Manager: ${p.manager?.name || "None"}
    Team Members: ${p.teamMembers.length}
    Tasks: ${p.tasks.length} (${p.tasks.filter((t: any) => t.status === "COMPLETED").length} completed)
    Budget: R${p.budget || "0.00"} (Spent: R${p.budgetSpent || "0.00"})
    Progress: ${calculateProjectProgress(p.tasks)}%
    Timeline: ${p.startDate ? new Date(p.startDate).toLocaleDateString() : "No start date"} - ${p.endDate ? new Date(p.endDate).toLocaleDateString() : "No end date"}
    `
      )
      .join("\n")}

    === INVOICES (${invoices.length}) ===
    Status Summary:
    - DRAFT: ${invoices.filter((i: any) => i.status === "DRAFT").length}
    - SENT: ${invoices.filter((i: any) => i.status === "SENT").length}
    - PAID: ${invoices.filter((i: any) => i.status === "PAID").length}
    - PARTIALLY PAID: ${invoices.filter((i: any) => i.status === "PARTIALLY_PAID").length}
    - CANCELLED: ${invoices.filter((i: any) => i.status === "CANCELLED").length}
    - OVERDUE: ${overdueInvoices.length}

   === QUOTATIONS  (${quotations.length}) ===  
    Status Summary:
    - DRAFT: ${quotations.filter((i: any) => i.status === "DRAFT").length}
    - CONVERTED: ${quotations.filter((i: any) => i.status === "CONVERTED").length} 
    - CANCELLED: ${quotations.filter((i: any) => i.status === "CANCELLED").length}

    === EMPLOYEE PAYMENTS (${employeePayments.length}) ===
Status Summary:
- Total Amount: R${totalEmployeePayments.toFixed(2)}
- Recent Payments (30 days): ${recentEmployeePayments.length} payments totaling R${recentEmployeePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0).toFixed(2)}
- Average Payment: R${employeePayments.length > 0 ? (totalEmployeePayments / employeePayments.length).toFixed(2) : "0.00"}

${employeePayments
  .slice(0, 10)
  .map(
    (p: any) => `
Payment #${p.id}:
- Amount: R${p.amount.toFixed(2)}
- Employee: ${p.employee?.name || "Unknown"} (${p.employee?.employeeNumber || "No ID"})
- Department: ${p.employee?.department?.name || "No Department"}
- Position: ${p.employee?.position || "Not specified"}
- Status: ${p.employee?.status || "Unknown"}
- Payment Type: ${p.type}
- Payment Date: ${new Date(p.payDate).toLocaleDateString()}
- Payment Status: ${p.status}
- Description: ${p.description || "No description"}
- Currency: ${p.currency}
- Transaction: ${p.transactionId ? `Linked to transaction ${p.transactionId}` : "No linked transaction"}
- Created By: User ${p.createdBy}
`
  )
  .join("\n")}

Payment Type Breakdown:
${Object.entries(
  employeePayments.reduce((acc: any, p: any) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {})
)
  .map(([type, count]) => `- ${type}: ${count} payments`)
  .join("\n")}

Payment Status Breakdown:
${Object.entries(
  employeePayments.reduce((acc: any, p: any) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {})
)
  .map(([status, count]) => `- ${status}: ${count} payments`)
  .join("\n")}

Top 5 Employees by Total Payments:
${Object.entries(
  employeePayments.reduce((acc: any, p: any) => {
    const empName = p.employee?.lastName + p.employee?.firstName || "Unknown";
    acc[empName] = (acc[empName] || 0) + Number(p.amount);
    return acc;
  }, {})
)
  .sort((a: any, b: any) => b[1] - a[1])
  .slice(0, 5)
  .map(([name, total]) => `- ${name}: R${Number(total).toFixed(2)}`)
  .join("\n")}

Department Payment Summary:
${Object.entries(
  employeePayments.reduce((acc: any, p: any) => {
    const deptName = p.employee?.department?.name || "No Department";
    acc[deptName] = (acc[deptName] || 0) + Number(p.amount);
    return acc;
  }, {})
)
  .map(([dept, total]) => `- ${dept}: R${Number(total).toFixed(2)}`)
  .join("\n")}

    === DEPARTMENTS (${departments.length}) ===
    ${departments.map((d: any) => `- ${d.name} (${d.status}): ${d.employees.length} employees, ${d.budgets.length} budgets`).join("\n")}

    === CATEGORY (${categories.length}) ===
   ${categories
     .map(
       (c: any) => `- ${c.name} (${c.type})  
   • Transactions: ${c.transactions.length}  
   • Amounts: ${c.transactions.map((i: any) => i.amount).join(", ")}`
     )
     .join("\n\n")}

    === EMPLOYEES (${employees.length}) ===
    Status Summary:
    - ACTIVE: ${employees.filter((e: any) => e.status === "ACTIVE").length}
    - INACTIVE: ${employees.filter((e: any) => e.status === "INACTIVE").length}
    - ON LEAVE: ${employees.filter((e: any) => e.status === "ON_LEAVE").length}
    `;

    // Add more specific context based on the prompt
    if (/client/i.test(prompt)) {
      contextData += `\n\nCLIENT DETAILS:\n${clients
        .map(
          (c: any) => `
      Client: ${c.name} (${c.clientNumber})
      Status: ${c.status}
      Type: ${c.type}
      Contact: ${c.email} | ${c.phone}
      Invoices: ${c.invoices.length} (${c.invoices.filter((i: any) => i.status === "PAID").length} paid)
      Quotations: ${c.quotations.length}
      Projects: ${c.projects.length}
      Credit Limit: R${c.creditLimit?.toFixed(2) || "0.00"}
      `
        )
        .join("\n")}`;
    }

    if (/project/i.test(prompt)) {
      contextData += `\n\nPROJECT DETAILS:\n${projects
        .map(
          (p: any) => `
      Project: ${p.title} (${p.projectNumber})
      Description: ${p.description || "No description"}
      Status: ${p.status}, Priority: ${p.priority}
      Client: ${p.client?.name || "None"}
      Manager: ${p.manager?.name || "None"}
      Team: ${p.teamMembers.map((tm: any) => tm.user.name).join(", ")}
      Budget: R${p.budget || "0.00"} (Spent: R${p.budgetSpent || "0.00"})
      Progress: ${calculateProjectProgress(p.tasks)}%
      Tasks: ${p.tasks.length} (${p.tasks.filter((t: any) => t.status === "COMPLETED").length} completed)
      Timeline: ${p.startDate ? new Date(p.startDate).toLocaleDateString() : "No start date"} - ${p.endDate ? new Date(p.endDate).toLocaleDateString() : "No end date"}
      Invoices: ${p.invoices.length}
      Time Entries: ${p.timeEntries.length}
      `
        )
        .join("\n")}`;
    }

    if (/financial|revenue|payment/i.test(prompt)) {
      contextData += `\n\nFINANCIAL DETAILS:\n`;

      // Add transaction details
      contextData += `RECENT TRANSACTIONS:\n${transactions
        .slice(0, 10)
        .map(
          (t: any) => `
      - ${t.id}: R${t.amount} (${t.type}) for ${t.description || "No description"} on ${new Date(t.date).toLocaleDateString()}
        Category: ${t.category?.name || "None"}, Department: ${t.department?.name || "None"}
      `
        )
        .join("")}`;
    }

    if (/employee|payment|salary/i.test(prompt)) {
      contextData += `\n\nEMPLOYEE PAYMENT DETAILS:\n${employeePayments
        .map(
          (p: any) => `
      Payment: R${p.amount.toFixed(2)} to ${p.employee?.name || "Unknown"}
      Type: ${p.type}, Status: ${p.status}
      Date: ${new Date(p.payDate).toLocaleDateString()}
      Description: ${p.description || "No description"}
      Employee Department: ${p.employee?.department?.name || "None"}
      `
        )
        .join("\n")}`;
    }

    const fullPrompt = `User Query: ${prompt}\n\nSystem Context:\n${contextData}\n\nPlease provide a detailed response based on the above information. Focus on the data that the user has permission to access.`;

    const result = await chatSession.sendMessage(fullPrompt);
    const AiResponse = await result.response.text();

    return NextResponse.json({
      result: AiResponse,
      context: {
        clientCount: clients.length,
        invoiceCount: invoices.length,
        projectCount: projects.length,
        departmentCount: departments.length,
        employeeCount: employees.length,
        paymentCount: employeePayments.length,
        financialSummary: {
          netRevenue: totalRevenue,
          totalIncome,
          totalExpenses,
          totalEmployeePayments,
          incomeTransactionCount: incomeTransactions.length,
          expenseTransactionCount: expenseTransactions.length,
          paymentCount: employeePayments.length,
          totalOverdueAmount,
          recentPaymentsTotal: recentPayments.reduce(
            (sum: number, p: any) => sum + Number(p.amount),
            0
          ),
          recentEmployeePaymentsTotal: recentEmployeePayments.reduce(
            (sum: number, p: any) => sum + Number(p.amount),
            0
          ),
        },
        userRole: user.role,
        userPermissions: user.permissions,
        accessibleProjects: userProjectIds.length,
      },
    });
  } catch (error) {
    console.error("[AI_API_ERROR]", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
