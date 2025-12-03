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

// Cash Flow Forecast function (your provided function)
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

  // Get current month's transactions
  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const currentMonthTransactions = await db.transaction.findMany({
    where: {
      date: {
        gte: currentMonthStart,
        lte: now,
      },
    },
  });

  // Get current quarter's transactions
  const currentQuarterTransactions = await db.transaction.findMany({
    where: {
      date: {
        gte: quarterStartDate,
        lte: now,
      },
    },
  });

  // Get current year's transactions
  const currentYearTransactions = await db.transaction.findMany({
    where: {
      date: {
        gte: yearStartDate,
        lte: now,
      },
    },
  });

  // Calculate actual amounts
  const calculateNet = (transactions: any[]) => {
    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return income - expenses;
  };

  const monthToDateNet = calculateNet(currentMonthTransactions);
  const quarterToDateNet = calculateNet(currentQuarterTransactions);
  const yearToDateNet = calculateNet(currentYearTransactions);

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

// Recent Transactions function (your provided function)
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

  // FIXED: Payroll alert using actual payday from HRSettings
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

    // Fetch all data in parallel including the new functions
    const [
      currentMonthInvoices,
      currentMonthExpenses,
      currentMonthInvoicePayments,
      currentMonthExpensePayments,
      currentMonthTransactions,
      lastMonthInvoices,
      lastMonthExpenses,
      lastMonthInvoicePayments,
      lastMonthExpensePayments,
      lastMonthTransactions,
      allTransactions, // NEW: Get all transactions for income/expense calculations
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
      allTimeExpenseTransactions, // <--- ADDED ALL TIME EXPENSE TRANSACTIONS
    ] = await Promise.all([
      // Current month invoices
      db.invoice.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: { client: true },
      }),

      // Current month expenses
      db.expense.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: { category: true },
      }),

      // Current month invoice payments
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

      // Current month expense payments
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

      // Current month transactions
      db.transaction.findMany({
        where: {
          type: "INCOME",
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),

      // Last month invoices
      db.invoice.findMany({
        where: {
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        include: { client: true },
      }),

      // Last month expenses
      db.expense.findMany({
        where: {
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        include: { category: true },
      }),

      // Last month invoice payments
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

      // Last month expense payments
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

      // Last month transactions
      db.transaction.findMany({
        where: {
          type: "INCOME",
          date: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      }),

      // NEW: All transactions for income/expense calculations
      db.transaction.findMany({
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth() - 5, 1), // Last 6 months for charts
          },
        },
        orderBy: {
          date: "asc",
        },
      }),

      // Other data
      db.quotation.findMany({
        include: { client: true },
      }),

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

      db.task.findMany({
        include: {
          assignees: true,
          project: true,
        },
      }),

      // Employees with AttendanceRecord for today
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

      // Freelancers with attendanceRecords for today
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

      // Leave requests for today
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

      db.client.findMany({}),

      db.attendanceRecord.findMany({
        where: {
          date: { gte: todayStart, lt: todayEnd },
          employeeId: { not: null },
          checkIn: { not: null },
        },
      }),

      db.attendanceRecord.findMany({
        where: {
          date: { gte: todayStart, lt: todayEnd },
          freeLancerId: { not: null },
          checkIn: { not: null },
        },
      }),

      db.hRSettings.findFirst({}),

      // Add the new function calls
      getCashFlowForecast(),
      getRecentTransactions(),

      // <--- NEW QUERY FOR ALL-TIME EXPENSE TRANSACTIONS --->
      db.transaction.findMany({
        where: {
          type: TransactionType.EXPENSE, // Filter by EXPENSE type
        },
      }),
      // <--- END NEW QUERY --->
    ]);

    // Type the results
    const typedCurrentMonthInvoices =
      currentMonthInvoices as unknown as DashboardInvoice[];
    const typedCurrentMonthExpenses =
      currentMonthExpenses as unknown as DashboardExpense[];
    const typedCurrentMonthInvoicePayments =
      currentMonthInvoicePayments as unknown as DashboardPayment[];
    const typedCurrentMonthExpensePayments =
      currentMonthExpensePayments as unknown as any[];
    const typedCurrentMonthTransactions =
      currentMonthTransactions as unknown as DashboardTransaction[];
    const typedLastMonthInvoices =
      lastMonthInvoices as unknown as DashboardInvoice[];
    const typedLastMonthExpenses =
      lastMonthExpenses as unknown as DashboardExpense[];
    const typedLastMonthInvoicePayments =
      lastMonthInvoicePayments as unknown as DashboardPayment[];
    const typedLastMonthExpensePayments =
      lastMonthExpensePayments as unknown as any[];
    const typedLastMonthTransactions =
      lastMonthTransactions as unknown as DashboardTransaction[];
    const typedAllTransactions =
      allTransactions as unknown as DashboardTransaction[]; // NEW
    const typedQuotations = quotations as unknown as DashboardQuotation[];
    const typedProjects = projects as unknown as DashboardProject[];
    const typedTasks = tasks as unknown as DashboardTask[];
    const typedEmployees = employees as unknown as DashboardEmployee[];
    const typedFreelancers = freelancers as unknown as DashboardFreeLancer[];
    const typedLeaveRequests =
      leaveRequests as unknown as DashboardLeaveRequest[];

    // <--- NEW TYPING --->
    const typedAllTimeExpenseTransactions =
      allTimeExpenseTransactions as unknown as DashboardTransaction[];
    // <--- END NEW TYPING --->

    // NEW: Calculate income and expenses from transactions for WelcomeHeader and charts
    const currentMonthIncomeFromTransactions = typedAllTransactions
      .filter((transaction: DashboardTransaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate >= monthStart &&
          transactionDate <= monthEnd &&
          transaction.type === "INCOME"
        );
      })
      .reduce(
        (sum: number, transaction: DashboardTransaction) =>
          sum + convertDecimalToNumber(transaction.amount),
        0
      );

    const currentMonthExpensesFromTransactions = typedAllTransactions
      .filter((transaction: DashboardTransaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate >= monthStart &&
          transactionDate <= monthEnd &&
          transaction.type === "EXPENSE"
        );
      })
      .reduce(
        (sum: number, transaction: DashboardTransaction) =>
          sum + convertDecimalToNumber(transaction.amount),
        0
      );

    const allTimeIncomeFromTransactions = typedAllTransactions
      .filter(
        (transaction: DashboardTransaction) => transaction.type === "INCOME"
      )
      .reduce(
        (sum: number, transaction: DashboardTransaction) =>
          sum + convertDecimalToNumber(transaction.amount),
        0
      );

    const allTimeExpensesFromTransactions = typedAllTransactions
      .filter(
        (transaction: DashboardTransaction) => transaction.type === "EXPENSE"
      )
      .reduce(
        (sum: number, transaction: DashboardTransaction) =>
          sum + convertDecimalToNumber(transaction.amount),
        0
      );

    const lastMonthIncomeFromTransactions = typedAllTransactions
      .filter((transaction: DashboardTransaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate >= lastMonthStart &&
          transactionDate <= lastMonthEnd &&
          transaction.type === "INCOME"
        );
      })
      .reduce(
        (sum: number, transaction: DashboardTransaction) =>
          sum + convertDecimalToNumber(transaction.amount),
        0
      );

    const lastMonthExpensesFromTransactions = typedAllTransactions
      .filter((transaction: DashboardTransaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate >= lastMonthStart &&
          transactionDate <= lastMonthEnd &&
          transaction.type === "EXPENSE"
        );
      })
      .reduce(
        (sum: number, transaction: DashboardTransaction) =>
          sum + convertDecimalToNumber(transaction.amount),
        0
      );

    // Calculate current month metrics (KEEP ORIGINAL FOR OTHER COMPONENTS)
    const currentMonthTotalInvoicesAmount = typedCurrentMonthInvoices.reduce(
      (sum: number, invoice: DashboardInvoice) =>
        sum + convertDecimalToNumber(invoice.totalAmount),
      0
    );

    const currentMonthTotalPaidInvoicesAmount =
      typedCurrentMonthInvoicePayments.reduce(
        (sum, payment) => sum + convertDecimalToNumber(payment.amount),
        0
      );

    const currentMonthTotalExpensesAmount = typedCurrentMonthExpenses.reduce(
      (sum: number, expense: DashboardExpense) =>
        sum + convertDecimalToNumber(expense.totalAmount),
      0
    );

    const currentMonthTotalPaidExpensesAmount =
      typedCurrentMonthExpensePayments.reduce(
        (sum, payment) => sum + convertDecimalToNumber(payment.amount),
        0
      );

    const currentMonthRevenue = typedCurrentMonthTransactions.reduce(
      (sum: number, transaction: DashboardTransaction) =>
        sum + convertDecimalToNumber(transaction.amount),
      0
    );

    // Calculate last month metrics (KEEP ORIGINAL FOR OTHER COMPONENTS)
    const lastMonthTotalInvoicesAmount = typedLastMonthInvoices.reduce(
      (sum: number, invoice: DashboardInvoice) =>
        sum + convertDecimalToNumber(invoice.totalAmount),
      0
    );

    const lastMonthTotalPaidInvoicesAmount =
      typedLastMonthInvoicePayments.reduce(
        (sum, payment) => sum + convertDecimalToNumber(payment.amount),
        0
      );

    const lastMonthTotalExpensesAmount = typedLastMonthExpenses.reduce(
      (sum: number, expense: DashboardExpense) =>
        sum + convertDecimalToNumber(expense.totalAmount),
      0
    );

    const lastMonthTotalPaidExpensesAmount =
      typedLastMonthExpensePayments.reduce(
        (sum, payment) => sum + convertDecimalToNumber(payment.amount),
        0
      );

    const lastMonthRevenue = typedLastMonthTransactions.reduce(
      (sum: number, transaction: DashboardTransaction) =>
        sum + convertDecimalToNumber(transaction.amount),
      0
    );

    // Calculate real changes (USE TRANSACTIONS FOR WELCOMEHEADER)
    const invoiceChange = calculateChange(
      currentMonthTotalInvoicesAmount,
      lastMonthTotalInvoicesAmount
    );

    const paidInvoiceChange = calculateChange(
      currentMonthTotalPaidInvoicesAmount,
      lastMonthTotalPaidInvoicesAmount
    );

    const expenseChange = calculateChange(
      currentMonthTotalExpensesAmount,
      lastMonthTotalExpensesAmount
    );

    const paidExpenseChange = calculateChange(
      currentMonthTotalPaidExpensesAmount,
      lastMonthTotalPaidExpensesAmount
    );

    const revenueChange = calculateChange(
      currentMonthIncomeFromTransactions, // USE TRANSACTIONS FOR WELCOMEHEADER
      lastMonthIncomeFromTransactions
    );

    // Calculate current month net profit (USE TRANSACTIONS FOR WELCOMEHEADER)
    const currentMonthNetProfitFromTransactions =
      allTimeIncomeFromTransactions - currentMonthExpensesFromTransactions;

    const allNetProfitFromTransactions =
      allTimeIncomeFromTransactions - allTimeExpensesFromTransactions;

    const lastMonthNetProfitFromTransactions =
      lastMonthIncomeFromTransactions - lastMonthExpensesFromTransactions;

    const profitChangeFromTransactions = calculateChange(
      currentMonthNetProfitFromTransactions,
      lastMonthNetProfitFromTransactions
    );

    // KEEP ORIGINAL FOR OTHER COMPONENTS
    const currentMonthNetProfit =
      currentMonthRevenue - currentMonthTotalExpensesAmount;
    const lastMonthNetProfit = lastMonthRevenue - lastMonthTotalExpensesAmount;
    const profitChange = calculateChange(
      currentMonthNetProfit,
      lastMonthNetProfit
    );

    // Get all invoices and expenses for detailed calculations
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

    // Calculate detailed metrics using all data
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

    // Calculate overall totals
    const totalInvoicesAmount = invoicesWithActualPayments.reduce(
      (sum: number, invoice: any) =>
        sum + convertDecimalToNumber(invoice.totalAmount),
      0
    );

    const totalPaidInvoicesAmount = invoicesWithActualPayments.reduce(
      (sum: number, invoice: any) => sum + invoice.actualPaidAmount,
      0
    );

    const paidInvoices = invoicesWithActualPayments.filter(
      (invoice: any) => invoice.remainingAmount <= 0
    );

    const paidInvoicesCount = paidInvoices.length;

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

    const partiallyPaidInvoices = invoicesWithActualPayments.filter(
      (invoice: any) =>
        invoice.actualPaidAmount > 0 && invoice.remainingAmount > 0
    );

    const partiallyPaidInvoicesCount = partiallyPaidInvoices.length;
    const partiallyPaidInvoicesAmount = partiallyPaidInvoices.reduce(
      (sum: number, invoice: any) => sum + invoice.actualPaidAmount,
      0
    );

    const totalExpensesAmount = expensesWithActualPayments.reduce(
      (sum: number, expense: any) =>
        sum + convertDecimalToNumber(expense.totalAmount),
      0
    );

    const paidExpenses = expensesWithActualPayments.filter(
      (expense: any) => expense.isFullyPaid
    );

    const paidExpensesCount = paidExpenses.length;
    const paidExpensesAmount = expensesWithActualPayments.reduce(
      (sum: number, expense: any) => sum + expense.actualPaidAmount,
      0
    );

    const pendingExpenses = expensesWithActualPayments.filter(
      (expense: any) => !expense.isFullyPaid
    );

    const pendingExpensesCount = pendingExpenses.length;
    const pendingExpensesAmount = pendingExpenses.reduce(
      (sum: number, expense: any) =>
        sum + convertDecimalToNumber(expense.totalAmount),
      0
    );

    const partiallyPaidExpenses = expensesWithActualPayments.filter(
      (expense: any) => expense.actualPaidAmount > 0 && !expense.isFullyPaid
    );

    const partiallyPaidExpensesCount = partiallyPaidExpenses.length;
    const partiallyPaidExpensesAmount = partiallyPaidExpenses.reduce(
      (sum: number, expense: any) => sum + expense.actualPaidAmount,
      0
    );

    // Calculate overall revenue from all transactions (USE TRANSACTIONS)
    const overallRevenueFromTransactions = typedAllTransactions
      .filter(
        (transaction: DashboardTransaction) => transaction.type === "INCOME"
      )
      .reduce(
        (sum: number, transaction: DashboardTransaction) =>
          sum + convertDecimalToNumber(transaction.amount),
        0
      );

    // <--- NEW CALCULATION FOR ALL-TIME EXPENSE TRANSACTIONS --->
    const allTimeTotalExpensesAmount = typedAllTimeExpenseTransactions.reduce(
      (sum: number, transaction: DashboardTransaction) =>
        sum + convertDecimalToNumber(transaction.amount),
      0
    );
    // <--- END NEW CALCULATION --->

    // Employee metrics
    // --- HELPER FUNCTION: Defined inside GET to access 'todayStart' and 'todayEnd' ---
    const checkIsOnLeaveToday = (record: any) => {
      if (!record.leaveRequests || record.leaveRequests.length === 0)
        return false;

      return record.leaveRequests.some((leave: any) => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        // Check strict overlap with "Today"
        return (
          leave.status === "APPROVED" &&
          leaveStart <= todayEnd &&
          leaveEnd >= todayStart
        );
      });
    };

    // --- EMPLOYEE METRICS ---
    const activeEmployees = typedEmployees.filter(
      (employee: DashboardEmployee) => employee.status === "ACTIVE"
    );

    // 1. On Duty: Has checked in today
    const onDutyEmployees = activeEmployees.filter(
      (employee) =>
        employee.AttendanceRecord && employee.AttendanceRecord.length > 0
    );

    // 2. On Leave: Strictly verified against today's date
    const employeesOnLeave = activeEmployees.filter((employee) =>
      checkIsOnLeaveToday(employee)
    ).length;

    // 3. Off Duty: Active AND No Check-in AND Not On Leave
    const offDutyEmployees = activeEmployees.filter((employee) => {
      const hasCheckedIn =
        employee.AttendanceRecord && employee.AttendanceRecord.length > 0;
      const isOnLeave = checkIsOnLeaveToday(employee);

      // They are off duty if they haven't checked in AND are not on approved leave
      return !hasCheckedIn && !isOnLeave;
    });

    // --- FREELANCER METRICS ---
    const activeFreelancers = typedFreelancers.filter(
      (freelancer: DashboardFreeLancer) => freelancer.status === "ACTIVE"
    );

    // 1. On Duty
    const onDutyFreelancers = activeFreelancers.filter(
      (freelancer) =>
        freelancer.attendanceRecords && freelancer.attendanceRecords.length > 0
    );

    // 2. On Leave
    const freelancersOnLeave = activeFreelancers.filter((freelancer) =>
      checkIsOnLeaveToday(freelancer)
    ).length;

    // 3. Off Duty
    const offDutyFreelancers = activeFreelancers.filter((freelancer) => {
      const hasCheckedIn =
        freelancer.attendanceRecords && freelancer.attendanceRecords.length > 0;
      const isOnLeave = checkIsOnLeaveToday(freelancer);

      return !hasCheckedIn && !isOnLeave;
    });

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

    // Use the new recent transactions function instead of the old one
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
    const collectionRate =
      totalInvoicesAmount > 0
        ? (totalPaidInvoicesAmount / totalInvoicesAmount) * 100
        : 0;
    const expenseRatio =
      currentMonthIncomeFromTransactions > 0 // USE TRANSACTIONS
        ? (currentMonthExpensesFromTransactions /
            currentMonthIncomeFromTransactions) *
          100
        : 0;
    const convertedQuotations = typedQuotations.filter(
      (quotation: DashboardQuotation) =>
        quotation.status === QuotationStatus.CONVERTED
    );
    const conversionRate =
      typedQuotations.length > 0
        ? (convertedQuotations.length / typedQuotations.length) * 100
        : 0;

    // NEW: Chart data using transactions for income and expenses
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

      const monthIncome = typedAllTransactions
        .filter((transaction: DashboardTransaction) => {
          const transactionDate = new Date(transaction.date);
          return (
            transactionDate >= monthStart &&
            transactionDate <= monthEnd &&
            transaction.type === "INCOME"
          );
        })
        .reduce(
          (sum: number, transaction: DashboardTransaction) =>
            sum + convertDecimalToNumber(transaction.amount),
          0
        );

      const monthExpenses = typedAllTransactions
        .filter((transaction: DashboardTransaction) => {
          const transactionDate = new Date(transaction.date);
          return (
            transactionDate >= monthStart &&
            transactionDate <= monthEnd &&
            transaction.type === "EXPENSE"
          );
        })
        .reduce(
          (sum: number, transaction: DashboardTransaction) =>
            sum + convertDecimalToNumber(transaction.amount),
          0
        );

      incomeData.push(monthIncome);
      expensesData.push(monthExpenses);
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
        totalInvoicesAmount,
        paidInvoicesCount,
        paidInvoicesAmount: totalPaidInvoicesAmount,
        overdueInvoicesCount: overdueInvoices.length,
        overdueInvoicesAmount,
        outstandingInvoicesCount: outstandingInvoices.length,
        outstandingInvoicesAmount,
        partiallyPaidInvoicesCount: partiallyPaidInvoicesCount,
        partiallyPaidAmount: partiallyPaidInvoicesAmount,

        totalExpensesAmount,
        paidExpensesCount,
        paidExpensesAmount,
        pendingExpensesCount: pendingExpensesCount,
        pendingExpensesAmount,
        partiallyPaidExpensesCount: partiallyPaidExpensesCount,
        partiallyPaidExpensesAmount,

        // <--- ADDED NEW FIELD --->
        allTimeTotalExpensesAmount,
        // <--- END ADDED NEW FIELD --->

        // USE TRANSACTIONS FOR WELCOMEHEADER AND CHARTS
        monthlyRevenue: currentMonthIncomeFromTransactions,
        overallRevenue: overallRevenueFromTransactions,
        quarterlyRevenue: currentMonthIncomeFromTransactions * 3,
        yearlyRevenue: currentMonthIncomeFromTransactions * 12,
        netProfit: allNetProfitFromTransactions,
        grossRevenue: allTimeIncomeFromTransactions,
        profitMargin:
          currentMonthIncomeFromTransactions > 0
            ? (currentMonthNetProfitFromTransactions /
                currentMonthIncomeFromTransactions) *
              100
            : 0,

        // KEEP ORIGINAL FOR OTHER COMPONENTS
        monthlyRevenueOriginal: currentMonthRevenue,
        overallRevenueOriginal: currentMonthRevenue, // This was using wrong calculation before
        netProfitOriginal: currentMonthNetProfit,

        // REAL CHANGES - use transactions for WelcomeHeader
        invoiceChange,
        paidInvoiceChange,
        expenseChange,
        paidExpenseChange,
        revenueChange: revenueChange, // From transactions
        profitChange: profitChangeFromTransactions, // From transactions
        collectionRate,
      },

      // Project Summary
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

      // Task Summary
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

      // Employee Summary
      employeeSummary: {
        activeEmployees: activeEmployees.length,
        onDutyToday: onDutyEmployees.length,
        offDutyToday: offDutyEmployees.length,
        onLeave: employeesOnLeave,
        totalEmployees: typedEmployees.length,
        activeChange: 0,
        onDutyChange: 0,
        offDutyChange: 0,
        leaveChange: 0,
      },

      // Freelancer Summary
      freelancerSummary: {
        totalFreelancers: activeFreelancers.length,
        reliableFreelancers: reliableFreelancers.length,
        onDutyToday: onDutyFreelancers.length,
        offDutyToday: offDutyFreelancers.length,
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
        collectionRate,
        expenseRatio, // Now uses transactions
        conversionRate,
        paidInvoicesCount: paidInvoices.length,
        invoicesLength: typedAllInvoices.length,
      },

      projectMetrics: {
        topProjects,
      },

      overviewChartData: {
        labels: chartLabels,
        incomeData, // From transactions
        expensesData, // From transactions
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
          amountDue: totalInvoicesAmount - totalPaidInvoicesAmount,
          paidAmount: totalPaidInvoicesAmount,
          overdueAmount: overdueInvoicesAmount,
          outstandingAmount: outstandingInvoicesAmount,
          invoiceChange,
          dueChange: calculateChange(
            totalInvoicesAmount - totalPaidInvoicesAmount,
            lastMonthTotalInvoicesAmount - lastMonthTotalPaidInvoicesAmount
          ),
          paidChange: paidInvoiceChange,
          overdueChange: calculateChange(overdueInvoicesAmount, 0),
        },
        expense: {
          totalExpenses: typedAllExpenses.length,
          pendingExpenses: pendingExpensesCount,
          paidExpenses: paidExpensesCount,
          monthlyExpenses: currentMonthExpensesFromTransactions, // Use transactions
          expenseChange,
          pendingChange: calculateChange(pendingExpensesCount, 0),
          paidChange: paidExpenseChange,
          monthlyChange: calculateChange(
            currentMonthExpensesFromTransactions,
            lastMonthExpensesFromTransactions
          ),
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
          totalRevenue: overallRevenueFromTransactions, // Use transactions
          netProfit: currentMonthNetProfitFromTransactions, // Use transactions
          profitMargin:
            currentMonthIncomeFromTransactions > 0
              ? (currentMonthNetProfitFromTransactions /
                  currentMonthIncomeFromTransactions) *
                100
              : 0,
          growthRate: revenueChange,
          revenueChange: revenueChange, // From transactions
          profitChange: profitChangeFromTransactions, // From transactions
          marginChange: calculateChange(
            (currentMonthNetProfitFromTransactions /
              currentMonthIncomeFromTransactions) *
              100,
            (lastMonthNetProfitFromTransactions /
              lastMonthIncomeFromTransactions) *
              100
          ),
          growthChange: revenueChange,
        },
      },

      // Chart data - USE TRANSACTIONS
      invoiceChartData: {
        labels: chartLabels,
        incomeData: incomeData, // From transactions
        expensesData: Array(6).fill(0),
      },
      expenseChartData: {
        labels: chartLabels,
        incomeData: expensesData, // From transactions
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
        incomeData, // From transactions
        expensesData, // From transactions
      },

      // Cash Flow Data - using your provided function
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
