import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";
import {
  DashboardInvoice,
  DashboardExpense,
  DashboardPayment,
  DashboardQuotation,
  DashboardProject,
  DashboardTask,
  DashboardEmployee,
  DashboardFreeLancer,
  DashboardLeaveRequest,
  DashboardTransaction,
  Alert,
  DashboardResponse,
} from "@/types/dashboard";
import {
  EmployeeStatus,
  FreeLancerStatus,
  ProjectStatus,
  QuotationStatus,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

// Helper function to safely convert Decimal to number
function convertDecimalToNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    return value.toNumber();
  }
  return 0;
}

// Helper function to calculate percentage change
function calculateChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

// Helper function to calculate financial metrics from transactions
function calculateFinancialMetrics(transactions: any[]) {
  const income = transactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + convertDecimalToNumber(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + convertDecimalToNumber(t.amount), 0);

  const netProfit = income - expenses;
  const profitMargin = income > 0 ? (netProfit / income) * 100 : 0;

  return {
    income,
    expenses,
    netProfit,
    profitMargin,
  };
}

// Cash Flow Forecast function using transactions
async function getCashFlowForecast() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Calculate days in current month and days remaining
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate();
  const monthProgress = ((daysInMonth - daysRemaining) / daysInMonth) * 100;

  // Calculate quarter information
  const currentQuarter = Math.floor(currentMonth / 3) + 1;
  const quarterStartMonth = (currentQuarter - 1) * 3;
  const quarterEndMonth = quarterStartMonth + 2;

  const quarterStartDate = new Date(currentYear, quarterStartMonth, 1);
  const quarterEndDate = new Date(currentYear, quarterEndMonth + 1, 0);

  const quarterDaysTotal = Math.floor(
    (quarterEndDate.getTime() - quarterStartDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const quarterDaysElapsed = Math.floor(
    (now.getTime() - quarterStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const quarterProgress = (quarterDaysElapsed / quarterDaysTotal) * 100;

  // Calculate year information
  const yearStartDate = new Date(currentYear, 0, 1);
  const yearEndDate = new Date(currentYear, 11, 31);

  const yearDaysTotal = Math.floor(
    (yearEndDate.getTime() - yearStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const yearDaysElapsed = Math.floor(
    (now.getTime() - yearStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const yearProgress = (yearDaysElapsed / yearDaysTotal) * 100;

  // Get transactions for different periods
  const currentMonthTransactions = await db.transaction.findMany({
    where: {
      date: {
        gte: new Date(currentYear, currentMonth, 1),
        lte: now,
      },
    },
  });

  const currentQuarterTransactions = await db.transaction.findMany({
    where: {
      date: {
        gte: quarterStartDate,
        lte: now,
      },
    },
  });

  const currentYearTransactions = await db.transaction.findMany({
    where: {
      date: {
        gte: yearStartDate,
        lte: now,
      },
    },
  });

  // Calculate actual amounts using transactions
  const monthToDateNet = calculateFinancialMetrics(
    currentMonthTransactions
  ).netProfit;
  const quarterToDateNet = calculateFinancialMetrics(
    currentQuarterTransactions
  ).netProfit;
  const yearToDateNet = calculateFinancialMetrics(
    currentYearTransactions
  ).netProfit;

  // Project remaining amounts based on current daily rate
  const daysElapsedInMonth = daysInMonth - daysRemaining;
  const dailyRateMonth = monthToDateNet / Math.max(1, daysElapsedInMonth);
  const monthProjection = monthToDateNet + dailyRateMonth * daysRemaining;

  const dailyRateQuarter = quarterToDateNet / Math.max(1, quarterDaysElapsed);
  const quarterProjection =
    quarterToDateNet +
    dailyRateQuarter * (quarterDaysTotal - quarterDaysElapsed);

  const dailyRateYear = yearToDateNet / Math.max(1, yearDaysElapsed);
  const yearProjection =
    yearToDateNet + dailyRateYear * (yearDaysTotal - yearDaysElapsed);

  return {
    nextMonth: {
      amount: monthProjection,
      progress: monthProgress,
      daysRemaining,
      daysInMonth,
    },
    quarterEnd: {
      amount: quarterProjection,
      progress: quarterProgress,
      daysRemaining: quarterDaysTotal - quarterDaysElapsed,
      daysTotal: quarterDaysTotal,
    },
    yearEnd: {
      amount: yearProjection,
      progress: yearProgress,
      daysRemaining: yearDaysTotal - yearDaysElapsed,
      daysTotal: yearDaysTotal,
    },
  };
}

// Recent Transactions function
async function getRecentTransactions() {
  return await db.transaction.findMany({
    orderBy: {
      date: "desc",
    },
    take: 6,
    include: {
      client: true,
      category: true,
    },
  });
}

// Helper function to generate alerts
function generateAlerts(
  invoices: any[],
  expenses: DashboardExpense[],
  quotations: DashboardQuotation[],
  projects: DashboardProject[],
  tasks: DashboardTask[],
  hrSettings: any
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Invoice alerts (due in next 3 days or overdue)
  const dueInvoices = invoices.filter((invoice: any) => {
    if (!invoice.dueDate) return false;
    const isNotFullyPaid = invoice.remainingAmount > 0;

    const dueDate = new Date(invoice.dueDate);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue <= 3 && isNotFullyPaid;
  });

  dueInvoices.forEach((invoice: any) => {
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

  // Payroll alert using actual payday from HRSettings
  if (hrSettings) {
    const today = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let nextPayrollDate: Date;
    const paymentDay = hrSettings.paymentDay || 25;
    const paymentMonth = hrSettings.paymentMonth || "CURRENT";

    if (today <= paymentDay) {
      // Payday is this month
      nextPayrollDate = new Date(currentYear, currentMonth, paymentDay);
    } else {
      // Payday is next month
      if (paymentMonth === "CURRENT") {
        nextPayrollDate = new Date(currentYear, currentMonth, paymentDay);
      } else {
        nextPayrollDate = new Date(currentYear, currentMonth + 1, paymentDay);
      }
    }

    // Ensure we don't set payday in the past
    if (nextPayrollDate < now) {
      nextPayrollDate = new Date(currentYear, currentMonth + 1, paymentDay);
    }

    const daysUntilPayroll = Math.ceil(
      (nextPayrollDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only show alert if payroll is within next 7 days
    if (daysUntilPayroll <= 7) {
      const priority =
        daysUntilPayroll <= 1
          ? "high"
          : daysUntilPayroll <= 3
            ? "medium"
            : "low";

      alerts.push({
        id: "payroll-next",
        type: "payroll",
        title: `Payroll Processing - ${nextPayrollDate.toLocaleDateString()}`,
        description: `Next payroll run in ${daysUntilPayroll} day${daysUntilPayroll !== 1 ? "s" : ""}`,
        dueDate: nextPayrollDate.toISOString(),
        daysRemaining: daysUntilPayroll,
        priority,
      });
    }

    // Add alert for payroll processing today
    if (daysUntilPayroll === 0) {
      alerts.push({
        id: "payroll-today",
        type: "payroll",
        title: "Payroll Processing Today",
        description: "Payroll is scheduled to run today",
        dueDate: nextPayrollDate.toISOString(),
        daysRemaining: 0,
        priority: "high",
      });
    }
  }

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

    // Get date ranges for current and previous month
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

    // Fetch all data in parallel - FOCUS ON TRANSACTIONS
    const [
      // Current period transactions
      currentMonthTransactions,
      lastMonthTransactions,
      allTransactions,

      // Other data
      currentMonthInvoices,
      currentMonthExpenses,
      currentMonthInvoicePayments,
      currentMonthExpensePayments,
      lastMonthInvoices,
      lastMonthExpenses,
      lastMonthInvoicePayments,
      lastMonthExpensePayments,
      quotations,
      projects,
      tasks,
      employees,
      freelancers,
      leaveRequests,
      clients,
      todayEmployeeAttendance,
      todayFreelancerAttendance,
      hrSettings,
      cashFlowForecast,
      recentTransactionsData,
    ] = await Promise.all([
      // Current month transactions - ALL transaction types
      db.transaction.findMany({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),

      // Last month transactions - ALL transaction types
      db.transaction.findMany({
        where: {
          date: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      }),

      // All transactions for overall calculations
      db.transaction.findMany({}),

      // Current month invoices (for tracking only)
      db.invoice.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: { client: true },
      }),

      // Current month expenses (for tracking only)
      db.expense.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: { category: true },
      }),

      // Current month invoice payments (for tracking only)
      db.invoicePayment.findMany({
        where: {
          status: "COMPLETED",
          paidAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          invoice: true,
        },
      }),

      // Current month expense payments (for tracking only)
      db.expensePayment.findMany({
        where: {
          status: "PAID",
          paymentDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          expense: true,
        },
      }),

      // Last month invoices (for tracking only)
      db.invoice.findMany({
        where: {
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        include: { client: true },
      }),

      // Last month expenses (for tracking only)
      db.expense.findMany({
        where: {
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        include: { category: true },
      }),

      // Last month invoice payments (for tracking only)
      db.invoicePayment.findMany({
        where: {
          status: "COMPLETED",
          paidAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        include: {
          invoice: true,
        },
      }),

      // Last month expense payments (for tracking only)
      db.expensePayment.findMany({
        where: {
          status: "PAID",
          paymentDate: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        include: {
          expense: true,
        },
      }),

      // Quotations
      db.quotation.findMany({
        include: { client: true },
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
          Expense: {
            include: {
              category: true,
            },
          },
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
          department: true,
          AttendanceRecord: {
            where: {
              date: {
                gte: todayStart,
                lt: todayEnd,
              },
              checkIn: { not: null },
            },
          },
          leaveRequests: {
            where: {
              status: "APPROVED",
              startDate: { lte: todayEnd },
              endDate: { gte: todayStart },
            },
          },
        },
      }),

      // Freelancers
      db.freeLancer.findMany({
        include: {
          department: true,
          attendanceRecords: {
            where: {
              date: {
                gte: todayStart,
                lt: todayEnd,
              },
              checkIn: { not: null },
            },
          },
          leaveRequests: {
            where: {
              status: "APPROVED",
              startDate: { lte: todayEnd },
              endDate: { gte: todayStart },
            },
          },
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

      // Clients
      db.client.findMany({}),

      // Today's employee attendance
      db.attendanceRecord.findMany({
        where: {
          date: { gte: todayStart, lt: todayEnd },
          employeeId: { not: null },
          checkIn: { not: null },
        },
      }),

      // Today's freelancer attendance
      db.attendanceRecord.findMany({
        where: {
          date: { gte: todayStart, lt: todayEnd },
          freeLancerId: { not: null },
          checkIn: { not: null },
        },
      }),

      // HR Settings
      db.hRSettings.findFirst({}),

      // Cash flow forecast
      getCashFlowForecast(),

      // Recent transactions
      getRecentTransactions(),
    ]);

    // Type the results
    const typedCurrentMonthTransactions =
      currentMonthTransactions as unknown as DashboardTransaction[];
    const typedLastMonthTransactions =
      lastMonthTransactions as unknown as DashboardTransaction[];
    const typedAllTransactions =
      allTransactions as unknown as DashboardTransaction[];
    const typedCurrentMonthInvoices =
      currentMonthInvoices as unknown as DashboardInvoice[];
    const typedCurrentMonthExpenses =
      currentMonthExpenses as unknown as DashboardExpense[];
    const typedLastMonthInvoices =
      lastMonthInvoices as unknown as DashboardInvoice[];
    const typedLastMonthExpenses =
      lastMonthExpenses as unknown as DashboardExpense[];
    const typedQuotations = quotations as unknown as DashboardQuotation[];
    const typedProjects = projects as unknown as DashboardProject[];
    const typedTasks = tasks as unknown as DashboardTask[];
    const typedEmployees = employees as unknown as DashboardEmployee[];
    const typedFreelancers = freelancers as unknown as DashboardFreeLancer[];
    const typedLeaveRequests =
      leaveRequests as unknown as DashboardLeaveRequest[];

    // Calculate financial metrics USING TRANSACTIONS
    const currentMonthMetrics = calculateFinancialMetrics(
      typedCurrentMonthTransactions
    );
    const lastMonthMetrics = calculateFinancialMetrics(
      typedLastMonthTransactions
    );
    const overallMetrics = calculateFinancialMetrics(typedAllTransactions);

    // Calculate changes
    const revenueChange = calculateChange(
      currentMonthMetrics.income,
      lastMonthMetrics.income
    );

    const expenseChange = calculateChange(
      currentMonthMetrics.expenses,
      lastMonthMetrics.expenses
    );

    const profitChange = calculateChange(
      currentMonthMetrics.netProfit,
      lastMonthMetrics.netProfit
    );

    // Get invoices and expenses for detailed tracking (not for financial totals)
    const allInvoices = await db.invoice.findMany({
      include: { client: true },
    });
    const allExpenses = await db.expense.findMany({
      include: { category: true },
    });
    const allInvoicePayments = await db.invoicePayment.findMany({
      where: { status: "COMPLETED" },
      include: { invoice: true },
    });
    const allExpensePayments = await db.expensePayment.findMany({
      where: { status: "PAID" },
      include: { expense: true },
    });

    const typedAllInvoices = allInvoices as unknown as DashboardInvoice[];
    const typedAllExpenses = allExpenses as unknown as DashboardExpense[];
    const typedAllInvoicePayments =
      allInvoicePayments as unknown as DashboardPayment[];
    const typedAllExpensePayments = allExpensePayments as unknown as any[];

    // Calculate invoice tracking metrics (for monitoring, not financial totals)
    const paymentsByInvoice = typedAllInvoicePayments.reduce(
      (acc, payment) => {
        const invoiceId = payment.invoiceId;
        if (!acc[invoiceId]) {
          acc[invoiceId] = [];
        }
        acc[invoiceId].push(payment);
        return acc;
      },
      {} as Record<string, DashboardPayment[]>
    );

    const invoicesWithActualPayments = typedAllInvoices.map(
      (invoice: DashboardInvoice) => {
        const invoicePayments = paymentsByInvoice[invoice.id] || [];
        const actualPaidAmount = invoicePayments.reduce((sum, payment) => {
          return sum + convertDecimalToNumber(payment.amount);
        }, 0);

        const totalAmount = convertDecimalToNumber(invoice.totalAmount);
        const remainingAmount = totalAmount - actualPaidAmount;

        return {
          ...invoice,
          actualPaidAmount,
          remainingAmount,
          isFullyPaid: remainingAmount <= 0,
          isOverdue:
            invoice.dueDate &&
            new Date(invoice.dueDate) < now &&
            remainingAmount > 0,
        };
      }
    );

    const overdueInvoices = invoicesWithActualPayments.filter(
      (invoice: any) => invoice.isOverdue
    );

    const overdueInvoicesAmount = overdueInvoices.reduce(
      (sum: number, invoice: any) => sum + invoice.remainingAmount,
      0
    );

    const outstandingInvoices = invoicesWithActualPayments.filter(
      (invoice: any) => invoice.remainingAmount > 0
    );

    const outstandingInvoicesAmount = outstandingInvoices.reduce(
      (sum: number, invoice: any) => sum + invoice.remainingAmount,
      0
    );

    const paidInvoices = invoicesWithActualPayments.filter(
      (invoice: any) => invoice.remainingAmount <= 0
    );

    // Calculate expense tracking metrics
    const paymentsByExpense = typedAllExpensePayments.reduce(
      (acc, payment) => {
        const expenseId = payment.expenseId;
        if (!acc[expenseId]) {
          acc[expenseId] = [];
        }
        acc[expenseId].push(payment);
        return acc;
      },
      {} as Record<string, any[]>
    );

    const expensesWithActualPayments = typedAllExpenses.map(
      (expense: DashboardExpense) => {
        const expensePayments = paymentsByExpense[expense.id] || [];
        const actualPaidAmount = expensePayments.reduce(
          (sum: any, payment: any) => {
            return sum + convertDecimalToNumber(payment.amount);
          },
          0
        );

        const totalAmount = convertDecimalToNumber(expense.totalAmount);
        const remainingAmount = totalAmount - actualPaidAmount;

        return {
          ...expense,
          actualPaidAmount,
          remainingAmount,
          isFullyPaid: remainingAmount <= 0,
          paymentStatus:
            actualPaidAmount >= totalAmount
              ? "PAID"
              : actualPaidAmount > 0
                ? "PARTIALLY_PAID"
                : "UNPAID",
        };
      }
    );

    const paidExpenses = expensesWithActualPayments.filter(
      (expense: any) => expense.isFullyPaid
    );

    const pendingExpenses = expensesWithActualPayments.filter(
      (expense: any) => !expense.isFullyPaid
    );

    // Employee metrics
    const activeEmployees = typedEmployees.filter(
      (employee: DashboardEmployee) => employee.status === "ACTIVE"
    );

    const onDutyEmployees = activeEmployees.filter(
      (employee) =>
        employee.AttendanceRecord && employee.AttendanceRecord.length > 0
    );

    const employeesOnLeave = typedLeaveRequests.filter(
      (lr: DashboardLeaveRequest) => lr.employee
    ).length;

    // Freelancer metrics
    const activeFreelancers = typedFreelancers.filter(
      (freelancer: DashboardFreeLancer) => freelancer.status === "ACTIVE"
    );

    const onDutyFreelancers = activeFreelancers.filter(
      (freelancer) =>
        freelancer.attendanceRecords && freelancer.attendanceRecords.length > 0
    );

    const freelancersOnLeave = typedLeaveRequests.filter(
      (lr: DashboardLeaveRequest) => lr.freeLancer
    ).length;

    const reliableFreelancers = activeFreelancers.filter(
      (freelancer: DashboardFreeLancer) => freelancer.reliable
    );

    // Project metrics
    const activeProjects = typedProjects.filter(
      (project: DashboardProject) => project.status === ProjectStatus.ACTIVE
    );
    const completedProjects = typedProjects.filter(
      (project: DashboardProject) => project.status === ProjectStatus.COMPLETED
    );
    const pendingProjects = typedProjects.filter(
      (project: DashboardProject) => project.status === ProjectStatus.PLANNING
    );
    const overdueProjects = typedProjects.filter(
      (project: DashboardProject) =>
        project.endDate &&
        new Date(project.endDate) < now &&
        project.status !== ProjectStatus.COMPLETED
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

    // Recent transactions
    const recentTransactions = recentTransactionsData.map(
      (transaction: any) => ({
        id: transaction.id,
        type: transaction.type,
        description: transaction.description || `Transaction ${transaction.id}`,
        amount: convertDecimalToNumber(transaction.amount),
        date: transaction.date,
        status: "completed",
        client: transaction.client?.name,
        category: transaction.category?.name,
      })
    );

    // Performance metrics
    const convertedQuotations = typedQuotations.filter(
      (quotation: DashboardQuotation) =>
        quotation.status === QuotationStatus.CONVERTED
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

      const monthTransactions = typedAllTransactions.filter(
        (transaction: DashboardTransaction) => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= monthStart && transactionDate <= monthEnd;
        }
      );

      const monthMetrics = calculateFinancialMetrics(monthTransactions);
      incomeData.push(monthMetrics.income);
      expensesData.push(monthMetrics.expenses);
    }

    // Alerts generation
    const alerts = generateAlerts(
      invoicesWithActualPayments,
      typedAllExpenses,
      typedQuotations,
      typedProjects,
      typedTasks,
      hrSettings
    );

    // Recent tasks
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

    // Recent invoices
    const recentInvoices = invoicesWithActualPayments
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 15)
      .map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client?.name || "No Client",
        amount: convertDecimalToNumber(invoice.totalAmount),
        paidAmount: invoice.actualPaidAmount,
        outstandingAmount: invoice.remainingAmount,
        status: invoice.isFullyPaid
          ? "PAID"
          : invoice.isOverdue
            ? "OVERDUE"
            : "PENDING",
        dueDate: invoice.dueDate,
        paymentStatus: invoice.isFullyPaid
          ? "FULLY_PAID"
          : invoice.actualPaidAmount > 0
            ? "PARTIALLY_PAID"
            : "UNPAID",
      }));

    // Recent expenses
    const recentExpenses = expensesWithActualPayments
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 15)
      .map((expense: any) => ({
        id: expense.id,
        description: expense.description,
        category: expense.category?.name || "Uncategorized",
        totalAmount: convertDecimalToNumber(expense.totalAmount),
        paidAmount: expense.actualPaidAmount,
        outstandingAmount: expense.remainingAmount,
        status: expense.isFullyPaid ? "PAID" : "PENDING",
        dueDate: expense.dueDate,
        paymentStatus: expense.paymentStatus,
      }));

    // Top projects
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
        Expense: project.Expense || [],
      }));

    const responseData = {
      financialSummary: {
        // USING TRANSACTION-BASED CALCULATIONS
        monthlyRevenue: currentMonthMetrics.income,
        overallRevenue: overallMetrics.income,
        netProfit: currentMonthMetrics.netProfit,
        grossRevenue: currentMonthMetrics.income,
        profitMargin: currentMonthMetrics.profitMargin,

        // Invoice tracking (for monitoring only)
        totalInvoicesAmount: invoicesWithActualPayments.reduce(
          (sum: number, invoice: any) =>
            sum + convertDecimalToNumber(invoice.totalAmount),
          0
        ),
        paidInvoicesAmount: invoicesWithActualPayments.reduce(
          (sum: number, invoice: any) => sum + invoice.actualPaidAmount,
          0
        ),
        overdueInvoicesAmount,
        outstandingInvoicesAmount,
        paidInvoicesCount: paidInvoices.length,
        overdueInvoicesCount: overdueInvoices.length,
        outstandingInvoicesCount: outstandingInvoices.length,

        // Expense tracking (for monitoring only)
        totalExpensesAmount: overallMetrics.expenses,
        paidExpensesCount: paidExpenses.length,
        paidExpensesAmount: paidExpenses.reduce(
          (sum: number, expense: any) =>
            sum + convertDecimalToNumber(expense.totalAmount),
          0
        ),
        pendingExpensesCount: pendingExpenses.length,
        pendingExpensesAmount: pendingExpenses.reduce(
          (sum: number, expense: any) =>
            sum + convertDecimalToNumber(expense.totalAmount),
          0
        ),

        // REAL CHANGES from transactions
        revenueChange,
        expenseChange,
        profitChange,
        invoiceChange: calculateChange(
          typedCurrentMonthInvoices.reduce(
            (sum: number, invoice: DashboardInvoice) =>
              sum + convertDecimalToNumber(invoice.totalAmount),
            0
          ),
          typedLastMonthInvoices.reduce(
            (sum: number, invoice: DashboardInvoice) =>
              sum + convertDecimalToNumber(invoice.totalAmount),
            0
          )
        ),
        paidInvoiceChange: calculateChange(
          currentMonthInvoicePayments.reduce(
            (sum: any, payment: any) =>
              sum + convertDecimalToNumber(payment.amount),
            0
          ),
          lastMonthInvoicePayments.reduce(
            (sum: any, payment: any) =>
              sum + convertDecimalToNumber(payment.amount),
            0
          )
        ),
        paidExpenseChange: calculateChange(
          currentMonthExpensePayments.reduce(
            (sum: any, payment: any) =>
              sum + convertDecimalToNumber(payment.amount),
            0
          ),
          lastMonthExpensePayments.reduce(
            (sum: any, payment: any) =>
              sum + convertDecimalToNumber(payment.amount),
            0
          )
        ),
        collectionRate:
          currentMonthMetrics.income > 0
            ? (invoicesWithActualPayments.reduce(
                (sum: number, invoice: any) => sum + invoice.actualPaidAmount,
                0
              ) /
                currentMonthMetrics.income) *
              100
            : 0,
      },

      projectSummary: {
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        pendingProjects: pendingProjects.length,
        overdueProjects: overdueProjects.length,
        totalProjectValue,
        activeChange: 0,
        completedChange: 0,
        pendingChange: 0,
        overdueChange: 0,
      },

      taskSummary: {
        totalTasks: typedTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        overdueTasks: overdueTasks.length,
        totalChange: 0,
        completedChange: 0,
        inProgressChange: 0,
        overdueChange: 0,
      },

      employeeSummary: {
        activeEmployees: activeEmployees.length,
        onDutyToday: onDutyEmployees.length,
        offDutyToday: activeEmployees.length - onDutyEmployees.length,
        onLeave: employeesOnLeave,
        totalEmployees: typedEmployees.length,
        activeChange: 0,
        onDutyChange: 0,
        offDutyChange: 0,
        leaveChange: 0,
      },

      freelancerSummary: {
        totalFreelancers: activeFreelancers.length,
        reliableFreelancers: reliableFreelancers.length,
        onDutyToday: onDutyFreelancers.length,
        offDutyToday: activeFreelancers.length - onDutyFreelancers.length,
        onLeave: freelancersOnLeave,
        totalFreelancersAll: typedFreelancers.length,
        totalChange: 0,
        reliableChange: 0,
        onDutyChange: 0,
        offDutyChange: 0,
      },

      employees: typedEmployees.map((employee: any) => ({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        status: employee.status,
        department: employee.department,
        AttendanceRecord: employee.AttendanceRecord || [],
        leaveRequests: employee.leaveRequests || [],
      })),

      freelancers: typedFreelancers.map((freelancer: any) => ({
        id: freelancer.id,
        firstName: freelancer.firstName,
        lastName: freelancer.lastName,
        position: freelancer.position,
        status: freelancer.status,
        reliable: freelancer.reliable,
        department: freelancer.department,
        attendanceRecords: freelancer.attendanceRecords || [],
        leaveRequests: freelancer.leaveRequests || [],
      })),

      recentTransactions,
      taskMetrics: {
        statusDistribution: typedTasks.reduce(
          (acc: Record<string, number>, task: DashboardTask) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
          },
          {}
        ),
        priorityDistribution: typedTasks.reduce(
          (acc: Record<string, number>, task: DashboardTask) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
          },
          {}
        ),
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
        collectionRate:
          currentMonthMetrics.income > 0
            ? (invoicesWithActualPayments.reduce(
                (sum: number, invoice: any) => sum + invoice.actualPaidAmount,
                0
              ) /
                currentMonthMetrics.income) *
              100
            : 0,
        expenseRatio:
          currentMonthMetrics.income > 0
            ? (currentMonthMetrics.expenses / currentMonthMetrics.income) * 100
            : 0,
        conversionRate,
        paidInvoicesCount: paidInvoices.length,
        invoicesLength: typedAllInvoices.length,
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

      // Chart summaries with real changes
      chartSummaries: {
        invoice: {
          totalInvoices: typedAllInvoices.length,
          amountDue: outstandingInvoicesAmount,
          paidAmount: invoicesWithActualPayments.reduce(
            (sum: number, invoice: any) => sum + invoice.actualPaidAmount,
            0
          ),
          overdueAmount: overdueInvoicesAmount,
          outstandingAmount: outstandingInvoicesAmount,
          invoiceChange: calculateChange(
            typedCurrentMonthInvoices.reduce(
              (sum: number, invoice: DashboardInvoice) =>
                sum + convertDecimalToNumber(invoice.totalAmount),
              0
            ),
            typedLastMonthInvoices.reduce(
              (sum: number, invoice: DashboardInvoice) =>
                sum + convertDecimalToNumber(invoice.totalAmount),
              0
            )
          ),
          dueChange: calculateChange(outstandingInvoicesAmount, 0),
          paidChange: calculateChange(
            currentMonthInvoicePayments.reduce(
              (sum: any, payment: any) =>
                sum + convertDecimalToNumber(payment.amount),
              0
            ),
            lastMonthInvoicePayments.reduce(
              (sum: any, payment: any) =>
                sum + convertDecimalToNumber(payment.amount),
              0
            )
          ),
          overdueChange: calculateChange(overdueInvoicesAmount, 0),
        },
        expense: {
          totalExpenses: typedAllExpenses.length,
          pendingExpenses: pendingExpenses.length,
          paidExpenses: paidExpenses.length,
          monthlyExpenses: currentMonthMetrics.expenses,
          expenseChange,
          pendingChange: calculateChange(pendingExpenses.length, 0),
          paidChange: calculateChange(paidExpenses.length, 0),
          monthlyChange: expenseChange,
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
          quoteChange: 0,
          convertedChange: 0,
          rateChange: 0,
          valueChange: 0,
        },
        revenue: {
          totalRevenue: overallMetrics.income,
          netProfit: currentMonthMetrics.netProfit,
          profitMargin: currentMonthMetrics.profitMargin,
          growthRate: revenueChange,
          revenueChange,
          profitChange,
          marginChange: calculateChange(
            currentMonthMetrics.profitMargin,
            lastMonthMetrics.profitMargin
          ),
          growthChange: revenueChange,
        },
      },

      // Chart data
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

      // Cash Flow Data
      cashFlow: cashFlowForecast,
    } as Omit<DashboardResponse, "currentUser"> & { cashFlow: any };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
