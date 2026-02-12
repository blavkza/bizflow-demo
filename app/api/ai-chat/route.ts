import { NextResponse } from "next/server";
import db from "@/lib/db";
import { chatSession } from "@/configs/AiModel";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { prompt, sessionId } = await req.json();

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
      (permission) => permission === "SYSTEMS_AI",
    );

    if (!hasAIPermission && user.role !== "CHIEF_EXECUTIVE_OFFICER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Get or create chat session
    let chatSessionRecord;
    if (sessionId) {
      // Update existing session
      chatSessionRecord = await db.chatSession.findUnique({
        where: {
          id: sessionId,
          userId: user.id,
        },
      });

      if (!chatSessionRecord) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 },
        );
      }
    } else {
      // Create new session
      chatSessionRecord = await db.chatSession.create({
        data: {
          title: "New Chat",
          messages: [],
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });
    }

    // Add user message to session
    const userMessage = { content: prompt, role: "user" as const };
    const updatedMessages = [
      ...(chatSessionRecord.messages as any[]),
      userMessage,
    ];

    // Update session with user message
    await db.chatSession.update({
      where: { id: chatSessionRecord.id },
      data: {
        messages: updatedMessages,
        title:
          updatedMessages.length === 1
            ? prompt.slice(0, 30) + (prompt.length > 30 ? "..." : "")
            : chatSessionRecord.title,
        updatedAt: new Date(),
      },
    });

    // Get all project IDs user has access to (as manager or team member)
    const managedProjectIds = user.Project.map((p) => p.id);
    const teamMemberProjectIds = user.projectTeams.map((pt) => pt.projectId);
    const userProjectIds = [
      ...new Set([...managedProjectIds, ...teamMemberProjectIds]),
    ];

    const userManagedDepartmentIds = user.managedDepartments.map((d) => d.id);

    // Helper function to check project access
    const hasProjectAccess = (
      projectId: string | null | undefined,
    ): boolean => {
      if (!projectId) return false;
      if (user.role === "CHIEF_EXECUTIVE_OFFICER") return true;
      return userProjectIds.includes(projectId);
    };

    // Helper function to check department access
    const hasDepartmentAccess = (
      departmentId: string | null | undefined,
    ): boolean => {
      if (!departmentId) return false;
      if (user.role === "CHIEF_EXECUTIVE_OFFICER") return true;
      return userManagedDepartmentIds.includes(departmentId);
    };

    // Helper function to check general permission
    const hasPermission = (requiredPermission: string): boolean => {
      if (user.role === "CHIEF_EXECUTIVE_OFFICER") return true;
      return user.permissions.some(
        (permission) => permission === requiredPermission,
      );
    };

    // Determine which data to fetch based on the prompt
    const promptLower = prompt.toLowerCase();

    // Initialize data variables with empty arrays
    let clients: any[] = [];
    let invoices: any[] = [];
    let transactions: any[] = [];
    let quotations: any[] = [];
    let departments: any[] = [];
    let employees: any[] = [];
    let employeePayments: any[] = [];
    let categories: any[] = [];
    let products: any[] = [];
    let projects: any[] = [];
    let tools: any[] = [];
    let loans: any[] = [];
    let lenders: any[] = [];
    let refunds: any[] = [];
    let expenses: any[] = [];
    let payrolls: any[] = [];
    let attendance: any[] = [];
    let leaves: any[] = [];
    let kpis: any[] = [];
    let targets: any[] = [];
    let shopProducts: any[] = [];
    let orders: any[] = [];
    let sales: any[] = [];
    let vendors: any[] = [];
    let callouts: any[] = [];
    let freelancers: any[] = [];
    let tasks: any[] = [];

    // Data fetching promises
    const dataFetchers: Promise<any>[] = [];

    // Always fetch user context and basic info
    let contextData = `
    SYSTEM DATA OVERVIEW (as of ${currentDate.toLocaleDateString()}):

    USER CONTEXT:
    - Role: ${user.role}
    - Name: ${user.name}
    - Email: ${user.email}
    - Managed Departments: ${user.managedDepartments.map((d) => d.name).join(", ")}
    - Managed Projects: ${user.Project.map((p) => p.title).join(", ")}
    - Team Member Projects: ${user.projectTeams.map((pt) => pt.project.title).join(", ")}
    `;

    // Check what data to fetch based on prompt keywords
    const fetchClients = /client|customer|account/i.test(promptLower);
    const fetchInvoices =
      /invoice|billing|payment|revenue|income|overdue|outstanding/i.test(
        promptLower,
      );
    const fetchTransactions =
      /transaction|expense|financial|revenue|income|expense/i.test(promptLower);
    const fetchQuotations = /quotation|quote|proposal|estimate/i.test(
      promptLower,
    );
    const fetchDepartments = /department|team|division|unit/i.test(promptLower);
    const fetchEmployees = /employee|staff|personnel|team member|salary/i.test(
      promptLower,
    );
    const fetchEmployeePayments = /payment|salary|payroll|compensation/i.test(
      promptLower,
    );
    const fetchCategories = /category|classification|type|group/i.test(
      promptLower,
    );
    const fetchProducts = /product|item|inventory|stock/i.test(promptLower);
    const fetchProjects = /project|task|milestone|deliverable/i.test(
      promptLower,
    );
    const fetchTools = /tool|equipment|asset|maintenance/i.test(promptLower);
    const fetchLoans = /loan|lending|borrow|debt|lender/i.test(promptLower);
    const fetchRefunds = /refund|return|reimbursement/i.test(promptLower);
    const fetchExpenses = /expense|spending|cost|expenditure/i.test(
      promptLower,
    );
    const fetchPayroll = /payroll|salary|wage|compensation/i.test(promptLower);
    const fetchAttendance =
      /attendance|check-in|check-out|present|absent/i.test(promptLower);
    const fetchLeaves = /leave|vacation|absence|time off/i.test(promptLower);
    const fetchPerformance = /performance|kpi|target|goal|metric/i.test(
      promptLower,
    );
    const fetchShop = /shop|pos|sale|order|customer order/i.test(promptLower);
    const fetchVendors = /vendor|supplier|provider/i.test(promptLower);
    const fetchCallouts = /callout|emergency|urgent|call-out/i.test(
      promptLower,
    );
    const fetchFreelancers = /freelancer|contractor|consultant/i.test(
      promptLower,
    );
    const fetchTasks = /task|todo|assignment|subtask/i.test(promptLower);

    // If no specific data is requested, fetch a basic set
    const fetchAllData =
      !fetchClients &&
      !fetchInvoices &&
      !fetchTransactions &&
      !fetchQuotations &&
      !fetchDepartments &&
      !fetchEmployees &&
      !fetchEmployeePayments &&
      !fetchCategories &&
      !fetchProducts &&
      !fetchProjects &&
      !fetchTools &&
      !fetchLoans &&
      !fetchRefunds &&
      !fetchExpenses &&
      !fetchPayroll &&
      !fetchAttendance &&
      !fetchLeaves &&
      !fetchPerformance &&
      !fetchShop &&
      !fetchVendors &&
      !fetchCallouts &&
      !fetchFreelancers &&
      !fetchTasks;

    // CLIENTS
    if (fetchClients || fetchAllData) {
      if (
        user.role === "CHIEF_EXECUTIVE_OFFICER" ||
        hasPermission("Clients_VIEW")
      ) {
        dataFetchers.push(
          db.client
            .findMany({
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
            .then((result) => {
              clients = result;
              return result;
            }),
        );
      }
    }

    // INVOICES
    if (fetchInvoices || fetchAllData) {
      if (
        user.role === "CHIEF_EXECUTIVE_OFFICER" ||
        hasPermission("INVOICES_VIEW")
      ) {
        dataFetchers.push(
          db.invoice
            .findMany({
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
            .then((result) => {
              invoices = result;
              return result;
            }),
        );
      }
    }

    // TRANSACTIONS
    if (fetchTransactions || fetchAllData) {
      if (
        user.role === "CHIEF_EXECUTIVE_OFFICER" ||
        hasPermission("TRANSACTIONS_VIEW")
      ) {
        dataFetchers.push(
          db.transaction
            .findMany({
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

              orderBy: { date: "desc" },
            })
            .then((result) => {
              transactions = result;
              return result;
            }),
        );
      }
    }

    // QUOTATIONS
    if (fetchQuotations || fetchAllData) {
      if (
        user.role === "CHIEF_EXECUTIVE_OFFICER" ||
        hasPermission("QUOTATIONS_VIEW")
      ) {
        dataFetchers.push(
          db.quotation
            .findMany({
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
            })
            .then((result) => {
              quotations = result;
              return result;
            }),
        );
      }
    }

    // DEPARTMENTS
    if (fetchDepartments || fetchAllData) {
      if (
        user.role === "CHIEF_EXECUTIVE_OFFICER" ||
        hasPermission("DEPARTMENT_VIEW")
      ) {
        dataFetchers.push(
          db.department
            .findMany({
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
            })
            .then((result) => {
              departments = result;
              return result;
            }),
        );
      }
    }

    // EMPLOYEES
    if (fetchEmployees || fetchAllData) {
      if (
        user.role === "CHIEF_EXECUTIVE_OFFICER" ||
        hasPermission("EMPLOYEES_VIEW")
      ) {
        dataFetchers.push(
          db.employee
            .findMany({
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
            })
            .then((result) => {
              employees = result;
              return result;
            }),
        );
      }
    }

    // EMPLOYEE PAYMENTS
    if (fetchEmployeePayments || fetchAllData) {
      if (
        user.role === "CHIEF_EXECUTIVE_OFFICER" ||
        hasPermission("PAYMENTS_VIEW")
      ) {
        dataFetchers.push(
          db.payment
            .findMany({
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

              orderBy: { payDate: "desc" },
            })
            .then((result) => {
              employeePayments = result;
              return result;
            }),
        );
      }
    }

    // CATEGORIES
    if (fetchCategories || fetchAllData) {
      if (
        user.role === "CHIEF_EXECUTIVE_OFFICER" ||
        hasPermission("CATEGORY_VIEW")
      ) {
        dataFetchers.push(
          db.category
            .findMany({
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
            .then((result) => {
              categories = result;
              return result;
            }),
        );
      }
    }

    // PRODUCTS
    if (fetchProducts || fetchAllData) {
      if (
        user.role === "CHIEF_EXECUTIVE_OFFICER" ||
        hasPermission("INVENTORY_VIEW")
      ) {
        dataFetchers.push(
          db.product.findMany().then((result) => {
            products = result;
            return result;
          }),
        );
      }
    }

    // PROJECTS (with detailed inclusion)
    if (fetchProjects || fetchAllData) {
      if (
        user.role === "CHIEF_EXECUTIVE_OFFICER" ||
        hasPermission("PROJECTS_VIEW")
      ) {
        dataFetchers.push(
          db.project
            .findMany({
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
                      OR: [
                        { id: { in: userProjectIds } },
                        { managerId: user.id },
                      ],
                    }
                  : undefined,
            })
            .then((result) => {
              projects = result;
              return result;
            }),
        );
      }
    }

    // Execute all data fetching promises
    await Promise.all(dataFetchers);

    // Calculate financial metrics if relevant data was fetched
    let financialSummary = {};

    if (
      fetchInvoices ||
      fetchTransactions ||
      fetchEmployeePayments ||
      fetchAllData
    ) {
      const invoicePayments = transactions.flatMap(
        (t: any) => t.invoice?.payments ?? [],
      );
      const totalEmployeePayments = employeePayments.reduce(
        (sum: number, p: any) => sum + Number(p.amount),
        0,
      );

      const incomeTransactions = transactions.filter(
        (t: any) => t.type === "INCOME",
      );
      const totalIncome = incomeTransactions.reduce(
        (sum: number, t: any) => sum + Number(t.amount),
        0,
      );
      const expenseTransactions = transactions.filter(
        (t: any) => t.type === "EXPENSE",
      );
      const totalExpenses = expenseTransactions.reduce(
        (sum: number, t: any) => sum + Number(t.amount),
        0,
      );
      const totalRevenue = totalIncome - totalExpenses;

      const overdueInvoices = invoices.filter(
        (inv: any) =>
          inv.status === "OVERDUE" ||
          (new Date(inv.dueDate) < currentDate && inv.status !== "PAID"),
      );

      const totalOverdueAmount = overdueInvoices.reduce(
        (sum: number, inv: any) =>
          sum + (Number(inv.totalAmount) - Number(inv.amount)),
        0,
      );

      const recentPayments = invoicePayments.filter((p: any) => {
        const paymentDate = new Date(p.paidAt ?? "");
        const diffDays = Math.ceil(
          Math.abs(currentDate.getTime() - paymentDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return diffDays <= 30;
      });

      const recentEmployeePayments = employeePayments.filter((p: any) => {
        const paymentDate = new Date(p.payDate ?? "");
        const diffDays = Math.ceil(
          Math.abs(currentDate.getTime() - paymentDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return diffDays <= 30;
      });

      financialSummary = {
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
          0,
        ),
        recentEmployeePaymentsTotal: recentEmployeePayments.reduce(
          (sum: number, p: any) => sum + Number(p.amount),
          0,
        ),
      };

      contextData += `
      === FINANCIAL SUMMARY ===
      - Total Income: R${totalIncome.toFixed(2)} (from ${incomeTransactions.length} income transactions)
      - Total Expenses: R${totalExpenses.toFixed(2)} (from ${expenseTransactions.length} expense transactions)
      - Employee Payments: R${totalEmployeePayments.toFixed(2)} (${employeePayments.length} payments)
      - Net Revenue: R${totalRevenue.toFixed(2)}
      - Overdue Amount: R${totalOverdueAmount.toFixed(2)}
      - Recent Invoice Payments (30 days): R${recentPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0).toFixed(2)}
      - Recent Employee Payments (30 days): R${recentEmployeePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0).toFixed(2)}
      `;
    }

    // Add relevant sections based on fetched data
    if (clients.length > 0) {
      contextData += `
      === CLIENTS (${clients.length}) ===
      ${clients.map((c: any) => `- ${c.name} (${c.status}): ${c.invoices.length} invoices, ${c.quotations.length} quotations, ${c.projects.length} projects`).join("\n")}
      `;
    }

    if (projects.length > 0) {
      const calculateProjectProgress = (tasks: any[]): number => {
        if (!tasks || tasks.length === 0) return 0;

        const completedTasks = tasks.filter(
          (task: any) => task.status === "COMPLETED",
        );
        return Math.round((completedTasks.length / tasks.length) * 100);
      };

      contextData += `
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
      `,
        )
        .join("\n")}
      `;
    }

    if (invoices.length > 0) {
      const overdueInvoices = invoices.filter(
        (inv: any) =>
          inv.status === "OVERDUE" ||
          (new Date(inv.dueDate) < currentDate && inv.status !== "PAID"),
      );

      contextData += `
      === INVOICES (${invoices.length}) ===
      Status Summary:
      - DRAFT: ${invoices.filter((i: any) => i.status === "DRAFT").length}
      - SENT: ${invoices.filter((i: any) => i.status === "SENT").length}
      - PAID: ${invoices.filter((i: any) => i.status === "PAID").length}
      - PARTIALLY PAID: ${invoices.filter((i: any) => i.status === "PARTIALLY_PAID").length}
      - CANCELLED: ${invoices.filter((i: any) => i.status === "CANCELLED").length}
      - OVERDUE: ${overdueInvoices.length}

      Detailed Invoices:
      ${invoices
        .slice(0, 10)
        .map(
          (inv: any) => `
      Invoice #${inv.invoiceNumber}:
      - Client: ${inv.client?.name || "No client"}
      - Project: ${inv.Project?.title || "No project"}
      - Amount: R${Number(inv.totalAmount).toFixed(2)}
      - Paid: R${Number(inv.amount).toFixed(2)}
      - Balance: R${(Number(inv.totalAmount) - Number(inv.amount)).toFixed(2)}
      - Status: ${inv.status}
      - Issue Date: ${new Date(inv.issueDate).toLocaleDateString()}
      - Due Date: ${new Date(inv.dueDate).toLocaleDateString()}
      - Payment Terms: ${inv.paymentTerms}
      - Items: ${inv.items.length} line items
      - Payments: ${inv.payments.length} payments
      ${inv.status === "OVERDUE" ? `- OVERDUE BY: ${Math.ceil((currentDate.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days` : ""}
      `,
        )
        .join("\n")}
      `;
    }

    if (quotations.length > 0) {
      contextData += `
      === QUOTATIONS (${quotations.length}) ===  
      Status Summary:
      - DRAFT: ${quotations.filter((q: any) => q.status === "DRAFT").length}
      - SENT: ${quotations.filter((q: any) => q.status === "SENT").length}
      - APPROVED: ${quotations.filter((q: any) => q.status === "APPROVED").length}
      - CONVERTED: ${quotations.filter((q: any) => q.status === "CONVERTED").length} 
      - REJECTED: ${quotations.filter((q: any) => q.status === "REJECTED").length}
      - CANCELLED: ${quotations.filter((q: any) => q.status === "CANCELLED").length}

      Detailed Quotations:
      ${quotations
        .slice(0, 10)
        .map(
          (quote: any) => `
      Quotation #${quote.quotationNumber}:
      - Client: ${quote.client?.name || "No client"}
      - Project: ${quote.project?.title || "No project"}
      - Department: ${quote.Department?.name || "No department"}
      - Total Amount: R${Number(quote.totalAmount).toFixed(2)}
      - Status: ${quote.status}
      - Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}
      - Issue Date: ${new Date(quote.issueDate).toLocaleDateString()}
      - Items: ${quote.items.length} line items
      - Conversion: ${quote.convertedToInvoice ? "Converted to invoice" : "Not converted"}
      ${quote.convertedToProjectId ? `- Converted to Project ID: ${quote.convertedToProjectId}` : ""}
      `,
        )
        .join("\n")}
      `;
    }

    if (employeePayments.length > 0) {
      const recentEmployeePayments = employeePayments.filter((p: any) => {
        const paymentDate = new Date(p.payDate ?? "");
        const diffDays = Math.ceil(
          Math.abs(currentDate.getTime() - paymentDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return diffDays <= 30;
      });

      const totalEmployeePayments = employeePayments.reduce(
        (sum: number, p: any) => sum + Number(p.amount),
        0,
      );

      contextData += `
      === EMPLOYEE PAYMENTS (${employeePayments.length}) ===
      Status Summary:
      - Total Amount: R${totalEmployeePayments.toFixed(2)}
      - Recent Payments (30 days): ${recentEmployeePayments.length} payments totaling R${recentEmployeePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0).toFixed(2)}
      - Average Payment: R${employeePayments.length > 0 ? (totalEmployeePayments / employeePayments.length).toFixed(2) : "0.00"}

      ${employeePayments
        .slice(0, 5)
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
      `,
        )
        .join("\n")}
      `;
    }

    if (departments.length > 0) {
      contextData += `
      === DEPARTMENTS (${departments.length}) ===
      ${departments.map((d: any) => `- ${d.name} (${d.status}): ${d.employees.length} employees, ${d.budgets.length} budgets`).join("\n")}
      `;
    }

    if (categories.length > 0) {
      contextData += `
      === CATEGORY (${categories.length}) ===
      ${categories
        .map(
          (c: any) => `- ${c.name} (${c.type})  
      • Transactions: ${c.transactions.length}  
      • Amounts: ${c.transactions.map((i: any) => i.amount).join(", ")}`,
        )
        .join("\n\n")}
      `;
    }

    if (employees.length > 0) {
      contextData += `
      === EMPLOYEES (${employees.length}) ===
      Status Summary:
      - ACTIVE: ${employees.filter((e: any) => e.status === "ACTIVE").length}
      - INACTIVE: ${employees.filter((e: any) => e.status === "INACTIVE").length}
      - ON LEAVE: ${employees.filter((e: any) => e.status === "ON_LEAVE").length}
      `;
    }

    // Add more specific context based on the prompt
    if (fetchClients) {
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
      `,
        )
        .join("\n")}`;
    }

    if (fetchProjects) {
      const calculateProjectProgress = (tasks: any[]): number => {
        if (!tasks || tasks.length === 0) return 0;

        const completedTasks = tasks.filter(
          (task: any) => task.status === "COMPLETED",
        );
        return Math.round((completedTasks.length / tasks.length) * 100);
      };

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
      `,
        )
        .join("\n")}`;
    }

    if (fetchTransactions || fetchInvoices || fetchEmployeePayments) {
      contextData += `\n\nFINANCIAL DETAILS:\n`;

      // Add transaction details
      if (transactions.length > 0) {
        contextData += `RECENT TRANSACTIONS:\n${transactions
          .slice(0, 10)
          .map(
            (t: any) => `
        - ${t.id}: R${t.amount} (${t.type}) for ${t.description || "No description"} on ${new Date(t.payDate).toLocaleDateString()}
          Category: ${t.category?.name || "None"}, Department: ${t.department?.name || "None"}
        `,
          )
          .join("")}`;
      }
    }

    if (fetchEmployees || fetchEmployeePayments) {
      contextData += `\n\nEMPLOYEE PAYMENT DETAILS:\n${employeePayments
        .slice(0, 10)
        .map(
          (p: any) => `
      Payment: R${p.amount.toFixed(2)} to ${p.employee?.name || "Unknown"}
      Type: ${p.type}, Status: ${p.status}
      Date: ${new Date(p.payDate).toLocaleDateString()}
      Description: ${p.description || "No description"}
      Employee Department: ${p.employee?.department?.name || "None"}
      `,
        )
        .join("\n")}`;
    }

    const fullPrompt = `User Query: ${prompt}\n\nSystem Context:\n${contextData}\n\nPlease provide a detailed response based on the above information. Focus on the data that the user has permission to access.`;

    const result = await chatSession.sendMessage(fullPrompt);
    const AiResponse = await result.response.text();

    // Add AI response to session
    const aiMessage = { content: AiResponse, role: "ai" as const };
    const finalMessages = [...updatedMessages, aiMessage];

    await db.chatSession.update({
      where: { id: chatSessionRecord.id },
      data: {
        messages: finalMessages,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      result: AiResponse,
      sessionId: chatSessionRecord.id,
      context: {
        clientCount: clients.length,
        invoiceCount: invoices.length,
        projectCount: projects.length,
        departmentCount: departments.length,
        employeeCount: employees.length,
        paymentCount: employeePayments.length,
        financialSummary,
        userRole: user.role,
        userPermissions: user.permissions,
        accessibleProjects: userProjectIds.length,
        fetchedDataTypes: {
          clients: fetchClients || fetchAllData,
          invoices: fetchInvoices || fetchAllData,
          transactions: fetchTransactions || fetchAllData,
          quotations: fetchQuotations || fetchAllData,
          departments: fetchDepartments || fetchAllData,
          employees: fetchEmployees || fetchAllData,
          employeePayments: fetchEmployeePayments || fetchAllData,
          categories: fetchCategories || fetchAllData,
          products: fetchProducts || fetchAllData,
          projects: fetchProjects || fetchAllData,
        },
      },
    });
  } catch (error) {
    console.error("[AI_API_ERROR]", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
