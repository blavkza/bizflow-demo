// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";

// Simplified Type definitions that match Prisma results
interface DashboardInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: any;
  paidAmount: any;
  status: string;
  dueDate?: Date | null;
  createdAt: Date;
  client?: {
    name: string;
  };
}

interface DashboardExpense {
  id: string;
  description: string;
  totalAmount: any;
  status: string;
  dueDate?: Date | null;
  createdAt: Date;
  category?: {
    name: string;
  };
}

interface DashboardPayment {
  id: string;
  amount: any;
  paymentDate: Date;
  invoice?: {
    invoiceNumber: string;
  };
}

interface DashboardQuotation {
  id: string;
  quotationNumber: string;
  totalAmount: any;
  status: string;
  validUntil: Date;
  client?: {
    name: string;
  };
}

interface DashboardProject {
  id: string;
  title: string;
  status: string;
  budget: any;
  endDate?: Date | null;
  createdAt: Date;
  tasks: DashboardTask[];
  client?: {
    name: string;
  };
}

interface DashboardTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: Date | null;
  progress?: number | null;
  createdAt: Date;
  assignees: any[];
  project?: {
    title: string;
  };
}

interface DashboardEmployee {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  timeEntries: any[];
}

interface DashboardFreeLancer {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  reliable?: boolean | null;
  timeEntries: any[];
}

interface DashboardTimeEntry {
  id: string;
  date: Date;
  employee?: any;
  freeLancer?: any;
}

interface DashboardLeaveRequest {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date;
  employee?: any;
  freeLancer?: any;
}

interface DashboardTransaction {
  id: string;
  amount: any;
  type: string;
  date: Date;
  description: string;
  category?: string;
}

interface Alert {
  id: string;
  type: "invoice" | "expense" | "quotation" | "project" | "payroll" | "task";
  title: string;
  description: string;
  dueDate?: string;
  daysRemaining: number;
  priority?: "low" | "medium" | "high" | "critical";
}

// Helper function to safely convert Decimal to number
function convertDecimalToNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    return value.toNumber();
  }
  return 0;
}

// Helper function to generate alerts
function generateAlerts(
  invoices: DashboardInvoice[],
  expenses: DashboardExpense[],
  quotations: DashboardQuotation[],
  projects: DashboardProject[],
  tasks: DashboardTask[]
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Invoice alerts (due in next 3 days or overdue)
  const dueInvoices = invoices.filter((invoice: DashboardInvoice) => {
    if (!invoice.dueDate) return false;
    const totalAmount = convertDecimalToNumber(invoice.totalAmount);
    const paidAmount = convertDecimalToNumber(invoice.paidAmount || 0);
    const isNotFullyPaid = paidAmount < totalAmount;

    const dueDate = new Date(invoice.dueDate);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue <= 3 && isNotFullyPaid;
  });

  dueInvoices.forEach((invoice: DashboardInvoice) => {
    const dueDate = new Date(invoice.dueDate!);
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    alerts.push({
      id: `invoice-${invoice.id}`,
      type: "invoice",
      title: `Invoice ${invoice.invoiceNumber} ${daysRemaining < 0 ? "Overdue" : "Due Soon"}`,
      description: `Amount: R ${convertDecimalToNumber(invoice.totalAmount).toLocaleString()}`,
      dueDate: invoice.dueDate?.toISOString(),
      daysRemaining,
      priority:
        daysRemaining < 0
          ? "critical"
          : daysRemaining === 0
            ? "high"
            : "medium",
    });
  });

  // Expense alerts (due in next 3 days)
  const dueExpenses = expenses.filter((expense: DashboardExpense) => {
    if (!expense.dueDate || expense.status === "PAID") return false;
    const dueDate = new Date(expense.dueDate);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue <= 3;
  });

  dueExpenses.forEach((expense: DashboardExpense) => {
    const dueDate = new Date(expense.dueDate!);
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    alerts.push({
      id: `expense-${expense.id}`,
      type: "expense",
      title: `Expense Payment Due`,
      description: `${expense.description} - R ${convertDecimalToNumber(expense.totalAmount).toLocaleString()}`,
      dueDate: expense.dueDate?.toISOString(),
      daysRemaining,
      priority:
        daysRemaining <= 0
          ? "critical"
          : daysRemaining === 1
            ? "high"
            : "medium",
    });
  });

  // Quotation alerts (expiring in next 3 days)
  const expiringQuotations = quotations.filter(
    (quotation: DashboardQuotation) => {
      if (quotation.status !== "SENT") return false;
      const validUntil = new Date(quotation.validUntil);
      const daysUntilExpiry = Math.ceil(
        (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 3;
    }
  );

  expiringQuotations.forEach((quotation: DashboardQuotation) => {
    const validUntil = new Date(quotation.validUntil);
    const daysRemaining = Math.ceil(
      (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    alerts.push({
      id: `quotation-${quotation.id}`,
      type: "quotation",
      title: `Quotation Expiring Soon`,
      description: `Quotation ${quotation.quotationNumber} for ${quotation.client?.name || "Client"}`,
      dueDate: quotation.validUntil.toISOString(),
      daysRemaining,
      priority: daysRemaining <= 1 ? "high" : "medium",
    });
  });

  // Project alerts (ending in next 7 days or overdue)
  const endingProjects = projects.filter((project: DashboardProject) => {
    if (!project.endDate || project.status === "COMPLETED") return false;
    const endDate = new Date(project.endDate);
    const daysUntilEnd = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilEnd <= 7;
  });

  endingProjects.forEach((project: DashboardProject) => {
    const endDate = new Date(project.endDate!);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    alerts.push({
      id: `project-${project.id}`,
      type: "project",
      title: `Project ${project.title} ${daysRemaining < 0 ? "Overdue" : "Ending Soon"}`,
      description: `Due in ${Math.abs(daysRemaining)} days`,
      dueDate: project.endDate?.toISOString(),
      daysRemaining,
      priority:
        daysRemaining < 0 ? "critical" : daysRemaining <= 3 ? "high" : "medium",
    });
  });

  // Task alerts (due today or overdue)
  const dueTasks = tasks.filter((task: DashboardTask) => {
    if (!task.dueDate || task.status === "COMPLETED") return false;
    const dueDate = new Date(task.dueDate);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue <= 1;
  });

  dueTasks.forEach((task: DashboardTask) => {
    const dueDate = new Date(task.dueDate!);
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    alerts.push({
      id: `task-${task.id}`,
      type: "task",
      title: `Task Due: ${task.title}`,
      description: `Project: ${task.project?.title || "No Project"}`,
      dueDate: task.dueDate?.toISOString(),
      daysRemaining,
      priority: daysRemaining < 0 ? "critical" : "high",
    });
  });

  // Payroll alert (next payroll in 5 days)
  const nextPayroll = new Date(now);
  nextPayroll.setDate(now.getDate() + 5);

  alerts.push({
    id: "payroll-next",
    type: "payroll",
    title: "Payroll Processing",
    description: "Next payroll run in 5 days",
    dueDate: nextPayroll.toISOString(),
    daysRemaining: 5,
    priority: "medium",
  });

  // Sort alerts by priority and due date
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return alerts.sort((a, b) => {
    const aPriority =
      priorityOrder[a.priority as keyof typeof priorityOrder] || 3;
    const bPriority =
      priorityOrder[b.priority as keyof typeof priorityOrder] || 3;

    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.daysRemaining - b.daysRemaining;
  });
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all data in parallel
    const [
      invoices,
      expenses,
      quotations,
      projects,
      tasks,
      employees,
      freelancers,
      timeEntries,
      leaveRequests,
      payments,
      clients,
      transactions,
    ] = await Promise.all([
      // Invoices
      db.invoice.findMany({
        include: {
          client: true,
        },
      }),

      // Expenses
      db.expense.findMany({
        include: {
          category: true,
        },
      }),

      // Quotations
      db.quotation.findMany({
        include: {
          client: true,
        },
      }),

      // Projects
      db.project.findMany({
        include: {
          tasks: {
            include: {
              assignees: true,
              project: true,
            },
          },
          client: true,
        },
      }),

      // Tasks
      db.task.findMany({
        include: {
          assignees: true,
          project: true,
        },
      }),

      // Employees
      db.employee.findMany({
        include: {
          timeEntries: {
            where: {
              date: {
                gte: todayStart,
                lt: todayEnd,
              },
            },
          },
        },
      }),

      // Freelancers
      db.freeLancer.findMany({
        include: {
          timeEntries: {
            where: {
              date: {
                gte: todayStart,
                lt: todayEnd,
              },
            },
          },
        },
      }),

      // Time entries for today
      db.timeEntry.findMany({
        where: {
          date: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
        include: {
          employee: true,
          freeLancer: true,
        },
      }),

      // Leave requests
      db.leaveRequest.findMany({
        where: {
          startDate: { lte: todayEnd },
          endDate: { gte: todayStart },
          status: "APPROVED",
        },
        include: {
          employee: true,
          freeLancer: true,
        },
      }),

      // Payments
      db.invoicePayment.findMany({
        include: {
          invoice: true,
        },
      }),

      // Clients
      db.client.findMany({}),

      // Transactions - INCOME type only
      db.transaction.findMany({
        where: {
          type: "INCOME",
        },
      }),
    ]);

    // Type the results after fetching
    const typedInvoices = invoices as unknown as DashboardInvoice[];
    const typedExpenses = expenses as unknown as DashboardExpense[];
    const typedQuotations = quotations as unknown as DashboardQuotation[];
    const typedProjects = projects as unknown as DashboardProject[];
    const typedTasks = tasks as unknown as DashboardTask[];
    const typedEmployees = employees as unknown as DashboardEmployee[];
    const typedFreelancers = freelancers as unknown as DashboardFreeLancer[];
    const typedLeaveRequests =
      leaveRequests as unknown as DashboardLeaveRequest[];
    const typedPayments = payments as unknown as DashboardPayment[];
    const typedTransactions = transactions as unknown as DashboardTransaction[];

    // FIXED: Calculate Outstanding Invoices properly
    const outstandingInvoices = typedInvoices.filter(
      (invoice: DashboardInvoice) => {
        const totalAmount = convertDecimalToNumber(invoice.totalAmount);
        const paidAmount = convertDecimalToNumber(invoice.paidAmount || 0);
        return paidAmount < totalAmount; // Invoice is not fully paid
      }
    );

    const outstandingInvoicesAmount = outstandingInvoices.reduce(
      (sum: number, invoice: DashboardInvoice) => {
        const totalAmount = convertDecimalToNumber(invoice.totalAmount);
        const paidAmount = convertDecimalToNumber(invoice.paidAmount || 0);
        return sum + (totalAmount - paidAmount); // Calculate outstanding amount
      },
      0
    );

    // Calculate other invoice metrics
    const totalInvoicesAmount = typedInvoices.reduce(
      (sum: number, invoice: DashboardInvoice) =>
        sum + convertDecimalToNumber(invoice.totalAmount),
      0
    );

    const paidInvoices = typedInvoices.filter((invoice: DashboardInvoice) => {
      const totalAmount = convertDecimalToNumber(invoice.totalAmount);
      const paidAmount = convertDecimalToNumber(invoice.paidAmount || 0);
      return paidAmount >= totalAmount; // Fully paid
    });

    const paidInvoicesAmount = paidInvoices.reduce(
      (sum: number, invoice: DashboardInvoice) =>
        sum + convertDecimalToNumber(invoice.totalAmount),
      0
    );

    const overdueInvoices = typedInvoices.filter(
      (invoice: DashboardInvoice) => {
        const totalAmount = convertDecimalToNumber(invoice.totalAmount);
        const paidAmount = convertDecimalToNumber(invoice.paidAmount || 0);
        const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < now;
        return isOverdue && paidAmount < totalAmount; // Overdue AND not fully paid
      }
    );

    const overdueInvoicesAmount = overdueInvoices.reduce(
      (sum: number, invoice: DashboardInvoice) => {
        const totalAmount = convertDecimalToNumber(invoice.totalAmount);
        const paidAmount = convertDecimalToNumber(invoice.paidAmount || 0);
        return sum + (totalAmount - paidAmount); // Outstanding amount for overdue invoices
      },
      0
    );

    // Expense calculations
    const totalExpensesAmount = typedExpenses.reduce(
      (sum: number, expense: DashboardExpense) =>
        sum + convertDecimalToNumber(expense.totalAmount),
      0
    );

    const paidExpenses = typedExpenses.filter(
      (expense: DashboardExpense) => expense.status === "PAID"
    );
    const paidExpensesAmount = paidExpenses.reduce(
      (sum: number, expense: DashboardExpense) =>
        sum + convertDecimalToNumber(expense.totalAmount),
      0
    );

    const pendingExpenses = typedExpenses.filter(
      (expense: DashboardExpense) => expense.status === "PENDING"
    );

    // REVENUE CALCULATIONS - USING TRANSACTIONS OF TYPE INCOME
    const monthlyRevenue = typedTransactions
      .filter((transaction: DashboardTransaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      })
      .reduce(
        (sum: number, transaction: DashboardTransaction) =>
          sum + convertDecimalToNumber(transaction.amount),
        0
      );

    const lastMonthRevenue = typedTransactions
      .filter((transaction: DashboardTransaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd
        );
      })
      .reduce(
        (sum: number, transaction: DashboardTransaction) =>
          sum + convertDecimalToNumber(transaction.amount),
        0
      );

    // OVERALL REVENUE - SUM OF ALL INCOME TRANSACTIONS
    const overallRevenue = typedTransactions.reduce(
      (sum: number, transaction: DashboardTransaction) =>
        sum + convertDecimalToNumber(transaction.amount),
      0
    );

    const revenueChange =
      lastMonthRevenue > 0
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    const netProfit = monthlyRevenue - totalExpensesAmount;
    const lastMonthProfit = lastMonthRevenue - totalExpensesAmount * 0.9;
    const profitChange =
      lastMonthProfit > 0
        ? ((netProfit - lastMonthProfit) / lastMonthProfit) * 100
        : 0;

    // FIXED: Employee metrics using correct status enums
    const activeEmployees = typedEmployees.filter(
      (employee: DashboardEmployee) => employee.status === "ACTIVE"
    );

    const onDutyEmployees = typedEmployees.filter(
      (employee: DashboardEmployee) =>
        employee.status === "ACTIVE" &&
        employee.timeEntries &&
        employee.timeEntries.length > 0
    );

    const offDutyEmployees = typedEmployees.filter(
      (employee: DashboardEmployee) =>
        employee.status === "ACTIVE" &&
        (!employee.timeEntries || employee.timeEntries.length === 0)
    );

    const employeesOnLeave = typedLeaveRequests.filter(
      (lr: DashboardLeaveRequest) => lr.employee
    ).length;

    // FIXED: Freelancer metrics using correct status enums
    const activeFreelancers = typedFreelancers.filter(
      (freelancer: DashboardFreeLancer) => freelancer.status === "ACTIVE"
    );

    const onDutyFreelancers = typedFreelancers.filter(
      (freelancer: DashboardFreeLancer) =>
        freelancer.status === "ACTIVE" &&
        freelancer.timeEntries &&
        freelancer.timeEntries.length > 0
    );

    const offDutyFreelancers = typedFreelancers.filter(
      (freelancer: DashboardFreeLancer) =>
        freelancer.status === "ACTIVE" &&
        (!freelancer.timeEntries || freelancer.timeEntries.length === 0)
    );

    const reliableFreelancers = activeFreelancers.filter(
      (freelancer: DashboardFreeLancer) => freelancer.reliable
    );

    // Project metrics
    const activeProjects = typedProjects.filter(
      (project: DashboardProject) => project.status === "IN_PROGRESS"
    );
    const completedProjects = typedProjects.filter(
      (project: DashboardProject) => project.status === "COMPLETED"
    );
    const pendingProjects = typedProjects.filter(
      (project: DashboardProject) => project.status === "PENDING"
    );
    const overdueProjects = typedProjects.filter(
      (project: DashboardProject) =>
        project.endDate &&
        new Date(project.endDate) < now &&
        project.status !== "COMPLETED"
    );

    const totalProjectValue = typedProjects.reduce(
      (sum: number, project: DashboardProject) =>
        sum + convertDecimalToNumber(project.budget),
      0
    );

    // Task metrics
    const completedTasks = typedTasks.filter(
      (task: DashboardTask) => task.status === "COMPLETED"
    );
    const inProgressTasks = typedTasks.filter(
      (task: DashboardTask) => task.status === "IN_PROGRESS"
    );
    const overdueTasks = typedTasks.filter(
      (task: DashboardTask) =>
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== "COMPLETED"
    );

    const taskStatusDistribution = typedTasks.reduce(
      (acc: Record<string, number>, task: DashboardTask) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {}
    );

    const taskPriorityDistribution = typedTasks.reduce(
      (acc: Record<string, number>, task: DashboardTask) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {}
    );

    // Recent transactions (last 10 payments)
    const recentTransactions = typedPayments
      .sort(
        (a: DashboardPayment, b: DashboardPayment) =>
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      )
      .slice(0, 10)
      .map((payment: DashboardPayment) => ({
        id: payment.id,
        type: "payment",
        description: `Payment for ${payment.invoice?.invoiceNumber || "Invoice"}`,
        amount: convertDecimalToNumber(payment.amount),
        date: payment.paymentDate,
        status: "completed",
      }));

    // Performance metrics
    const collectionRate =
      totalInvoicesAmount > 0
        ? (paidInvoicesAmount / totalInvoicesAmount) * 100
        : 0;
    const expenseRatio =
      monthlyRevenue > 0 ? (totalExpensesAmount / monthlyRevenue) * 100 : 0;
    const convertedQuotations = typedQuotations.filter(
      (quotation: DashboardQuotation) => quotation.status === "ACCEPTED"
    );
    const conversionRate =
      typedQuotations.length > 0
        ? (convertedQuotations.length / typedQuotations.length) * 100
        : 0;

    // Chart data - Last 6 months USING TRANSACTIONS
    const chartLabels: string[] = [];
    const incomeData: number[] = [];
    const expensesData: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      chartLabels.push(
        date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      );

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthIncome = typedTransactions
        .filter((transaction: DashboardTransaction) => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= monthStart && transactionDate <= monthEnd;
        })
        .reduce(
          (sum: number, transaction: DashboardTransaction) =>
            sum + convertDecimalToNumber(transaction.amount),
          0
        );

      const monthExpenses = typedExpenses
        .filter((expense: DashboardExpense) => {
          const expenseDate = new Date(expense.createdAt);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce(
          (sum: number, expense: DashboardExpense) =>
            sum + convertDecimalToNumber(expense.totalAmount),
          0
        );

      incomeData.push(monthIncome);
      expensesData.push(monthExpenses);
    }

    // Alerts generation
    const alerts = generateAlerts(
      typedInvoices,
      typedExpenses,
      typedQuotations,
      typedProjects,
      typedTasks
    );

    // Recent tasks for detail view
    const recentTasks = typedTasks
      .sort(
        (a: DashboardTask, b: DashboardTask) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 20)
      .map((task: DashboardTask) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee:
          task.assignees && task.assignees.length > 0
            ? `${task.assignees[0]?.firstName || ""} ${task.assignees[0]?.lastName || ""}`.trim() ||
              "Unassigned"
            : "Unassigned",
        progress: task.progress || 0,
        project: task.project?.title || "No Project",
      }));

    // Recent invoices for detail view
    const recentInvoices = typedInvoices
      .sort(
        (a: DashboardInvoice, b: DashboardInvoice) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 15)
      .map((invoice: DashboardInvoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client?.name || "No Client",
        amount: convertDecimalToNumber(invoice.totalAmount),
        paidAmount: convertDecimalToNumber(invoice.paidAmount || 0),
        outstandingAmount:
          convertDecimalToNumber(invoice.totalAmount) -
          convertDecimalToNumber(invoice.paidAmount || 0),
        status: invoice.status,
        dueDate: invoice.dueDate,
      }));

    // Recent expenses for detail view
    const recentExpenses = typedExpenses
      .sort(
        (a: DashboardExpense, b: DashboardExpense) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 15)
      .map((expense: DashboardExpense) => ({
        id: expense.id,
        description: expense.description,
        category: expense.category?.name || "Uncategorized",
        totalAmount: convertDecimalToNumber(expense.totalAmount),
        status: expense.status,
        dueDate: expense.dueDate,
      }));

    // Top projects for detail view
    const topProjects = typedProjects
      .sort(
        (a: DashboardProject, b: DashboardProject) =>
          convertDecimalToNumber(b.budget) - convertDecimalToNumber(a.budget)
      )
      .slice(0, 10)
      .map((project: DashboardProject) => ({
        id: project.id,
        title: project.title,
        client: project.client?.name || "No Client",
        budget: convertDecimalToNumber(project.budget),
        status: project.status,
        endDate: project.endDate,
        tasks: project.tasks || [],
      }));

    const responseData = {
      // Current user data
      currentUser: {
        name: "User",
        avatar: null,
        createdAt: new Date().toISOString(),
      },

      // Financial Summary - WITH CORRECT OUTSTANDING INVOICES
      financialSummary: {
        totalInvoicesAmount,
        paidInvoicesCount: paidInvoices.length,
        overdueInvoicesCount: overdueInvoices.length,
        overdueInvoicesAmount,
        outstandingInvoicesCount: outstandingInvoices.length,
        outstandingInvoicesAmount, // This is what shows in WelcomeHeader
        totalExpensesAmount,
        paidExpensesCount: paidExpenses.length,
        paidExpensesAmount,
        pendingExpensesCount: pendingExpenses.length,
        monthlyRevenue,
        overallRevenue,
        quarterlyRevenue: monthlyRevenue * 3,
        yearlyRevenue: monthlyRevenue * 12,
        netProfit,
        grossRevenue: monthlyRevenue,
        profitMargin:
          monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0,
        invoiceChange: 12.5,
        expenseChange: -8.2,
        revenueChange,
        profitChange,
      },

      // Project Summary
      projectSummary: {
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        pendingProjects: pendingProjects.length,
        overdueProjects: overdueProjects.length,
        totalProjectValue,
        activeChange: 5.3,
        completedChange: 15.7,
        pendingChange: -2.1,
        overdueChange: 8.9,
      },

      // Task Summary
      taskSummary: {
        totalTasks: typedTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        overdueTasks: overdueTasks.length,
        totalChange: 10.2,
        completedChange: 25.5,
        inProgressChange: -5.3,
        overdueChange: 15.8,
      },

      // Employee Summary - WITH CORRECT STATUS FILTERING
      employeeSummary: {
        activeEmployees: activeEmployees.length,
        onDutyToday: onDutyEmployees.length,
        offDutyToday: offDutyEmployees.length,
        onLeave: employeesOnLeave,
        totalEmployees: typedEmployees.length,
        activeChange: 3.2,
        onDutyChange: 8.7,
        offDutyChange: -2.1,
        leaveChange: 12.5,
      },

      // Freelancer Summary - WITH CORRECT STATUS FILTERING
      freelancerSummary: {
        totalFreelancers: activeFreelancers.length,
        reliableFreelancers: reliableFreelancers.length,
        onDutyToday: onDutyFreelancers.length,
        offDutyToday: offDutyFreelancers.length,
        totalFreelancersAll: typedFreelancers.length,
        totalChange: 15.3,
        reliableChange: 22.1,
        onDutyChange: 18.7,
        offDutyChange: -5.2,
      },

      // Additional Data
      recentTransactions,
      taskMetrics: {
        statusDistribution: taskStatusDistribution,
        priorityDistribution: taskPriorityDistribution,
        avgCompletionTime: 7.5,
        onTimeCompletionRate: 78.3,
        weeklyDueTasks: typedTasks.filter((task: DashboardTask) => {
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return (
            task.dueDate &&
            new Date(task.dueDate) <= weekFromNow &&
            task.status !== "COMPLETED"
          );
        }).length,
      },

      performanceMetrics: {
        collectionRate,
        expenseRatio,
        conversionRate,
        paidInvoicesCount: paidInvoices.length,
        invoicesLength: typedInvoices.length,
      },

      projectMetrics: {
        topProjects,
      },

      overviewChartData: {
        labels: chartLabels,
        incomeData,
        expensesData,
      },

      alerts,
      recentTasks,
      recentInvoices,
      recentExpenses,
      allTasks: recentTasks,

      // Chart summaries for different views
      chartSummaries: {
        invoice: {
          totalInvoices: typedInvoices.length,
          amountDue: totalInvoicesAmount - paidInvoicesAmount,
          paidAmount: paidInvoicesAmount,
          overdueAmount: overdueInvoicesAmount,
          outstandingAmount: outstandingInvoicesAmount,
          invoiceChange: 12.5,
          dueChange: -8.3,
          paidChange: 15.7,
          overdueChange: 25.2,
        },
        expense: {
          totalExpenses: typedExpenses.length,
          pendingExpenses: pendingExpenses.length,
          paidExpenses: paidExpenses.length,
          monthlyExpenses: totalExpensesAmount,
          expenseChange: -8.2,
          pendingChange: 12.3,
          paidChange: 18.7,
          monthlyChange: -5.4,
        },
        quotation: {
          totalQuotations: typedQuotations.length,
          convertedQuotations: convertedQuotations.length,
          conversionRate,
          totalValue: typedQuotations.reduce(
            (sum: number, q: DashboardQuotation) =>
              sum + convertDecimalToNumber(q.totalAmount),
            0
          ),
          quoteChange: 8.9,
          convertedChange: 22.1,
          rateChange: 15.3,
          valueChange: 18.7,
        },
        revenue: {
          totalRevenue: overallRevenue,
          netProfit,
          profitMargin:
            monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0,
          growthRate: revenueChange,
          revenueChange,
          profitChange,
          marginChange: 3.2,
          growthChange: 8.7,
        },
      },

      // Chart data for different financial views
      invoiceChartData: {
        labels: chartLabels,
        incomeData: incomeData,
        expensesData: Array(6).fill(0),
      },
      expenseChartData: {
        labels: chartLabels,
        incomeData: expensesData,
        expensesData: Array(6).fill(0),
      },
      quotationChartData: {
        labels: chartLabels,
        incomeData: Array(6).fill(
          typedQuotations.reduce(
            (sum: number, q: DashboardQuotation) =>
              sum + convertDecimalToNumber(q.totalAmount),
            0
          ) / 6
        ),
        expensesData: Array(6).fill(0),
      },
      revenueChartData: {
        labels: chartLabels,
        incomeData,
        expensesData,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
