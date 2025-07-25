import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch all data in parallel
    const [
      stats,
      cashFlow,
      recentTransactions,
      performanceMetrics,
      upcomingEvents,
      overviewChartData,
    ] = await Promise.all([
      getMainStats(),
      getCashFlowForecast(),
      getRecentTransactions(),
      getPerformanceMetrics(),
      getUpcomingEvents(),
      getOverviewChartData(),
    ]);

    return NextResponse.json({
      stats,
      cashFlow,
      recentTransactions,
      performanceMetrics,
      upcomingEvents,
      overviewChartData,
    });
  } catch (error) {
    console.error("[DASHBOARD_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

async function getMainStats() {
  // Get all transactions
  const allTransactions = await db.transaction.findMany();

  // Calculate all-time totals
  const allTimeRevenue = allTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const allTimeExpenses = allTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Get transactions from last month for percentage changes
  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const lastMonthTransactions = await db.transaction.findMany({
    where: {
      date: { gte: lastMonthStart, lte: lastMonthEnd },
    },
  });

  const lastMonthRevenue = lastMonthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate percentage changes (compared to last month)
  const revenueChange =
    lastMonthRevenue > 0
      ? ((allTimeRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

  const expensesChange =
    lastMonthExpenses > 0
      ? ((allTimeExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
      : 0;

  // Get active employees count
  const activeEmployees = await db.employee.count({
    where: {
      status: "ACTIVE",
    },
  });

  return {
    totalRevenue: {
      amount: allTimeRevenue,
      change: revenueChange,
    },
    expenses: {
      amount: allTimeExpenses,
      change: expensesChange,
    },
    netProfit: {
      amount: allTimeRevenue - allTimeExpenses,
      change:
        ((allTimeRevenue -
          allTimeExpenses -
          (lastMonthRevenue - lastMonthExpenses)) /
          (lastMonthRevenue - lastMonthExpenses)) *
          100 || 0,
    },
    activeEmployees: {
      count: activeEmployees,
      change: 0, // Placeholder
    },
  };
}

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

async function getRecentTransactions() {
  return await db.transaction.findMany({
    orderBy: {
      date: "desc",
    },
    take: 5,
    include: {
      client: true,
      category: true,
    },
  });
}

async function getPerformanceMetrics() {
  // Invoice collection rate
  const invoices = await db.invoice.findMany({
    where: {
      status: { in: ["PAID", "SENT", "OVERDUE"] },
    },
  });

  const paidInvoices = invoices.filter((i) => i.status === "PAID");
  const collectionRate =
    invoices.length > 0 ? (paidInvoices.length / invoices.length) * 100 : 0;

  // Expense vs Income
  const transactions = await db.transaction.findMany({
    where: {
      date: {
        gte: new Date(new Date().getFullYear(), 0, 1),
        lte: new Date(),
      },
    },
  });

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;

  // Quotation conversion rate
  const quotations = await db.quotation.findMany({
    where: {
      status: { not: "CANCELLED" },
    },
  });

  const acceptedQuotations = quotations.filter((q) => q.status === "CONVERTED");
  const conversionRate =
    quotations.length > 0
      ? (acceptedQuotations.length / quotations.length) * 100
      : 0;

  return {
    collectionRate,
    expenseRatio,
    conversionRate,
    paidInvoicesCount: paidInvoices.length,
  };
}

async function getUpcomingEvents() {
  const now = new Date();

  // Payroll processing - 25th of each month
  const payrollDate = new Date(now.getFullYear(), now.getMonth(), 25);
  if (payrollDate < now) {
    payrollDate.setMonth(payrollDate.getMonth() + 1);
  }

  // Tax filing - quarterly
  let taxFilingDate = new Date(
    now.getFullYear(),
    now.getMonth() + 3 - (now.getMonth() % 3),
    0
  );
  if (taxFilingDate < now) {
    taxFilingDate = new Date(
      now.getFullYear(),
      now.getMonth() + 6 - (now.getMonth() % 3),
      0
    );
  }

  // Monthly review - first Monday of next month
  const monthlyReviewDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  while (monthlyReviewDate.getDay() !== 1) {
    monthlyReviewDate.setDate(monthlyReviewDate.getDate() + 1);
  }

  return [
    {
      title: "Payroll Processing",
      date: payrollDate,
      type: "payroll",
    },
    {
      title: "Tax Filing Deadline",
      date: taxFilingDate,
      type: "tax",
    },
    {
      title: "Monthly Review",
      date: monthlyReviewDate,
      type: "review",
    },
  ];
}

async function getOverviewChartData() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const transactions = await db.transaction.findMany({
    where: {
      date: {
        gte: sixMonthsAgo,
        lte: now,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Group by month and type
  const monthlyData: Record<string, { income: number; expenses: number }> = {};

  transactions.forEach((t) => {
    const monthYear = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { income: 0, expenses: 0 };
    }

    if (t.type === "INCOME") {
      monthlyData[monthYear].income += Number(t.amount);
    } else {
      monthlyData[monthYear].expenses += Number(t.amount);
    }
  });

  // Convert to array format for chart
  const labels = [];
  const incomeData = [];
  const expensesData = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
    const monthName = date.toLocaleString("default", { month: "short" });

    labels.push(monthName);
    incomeData.push(monthlyData[monthYear]?.income || 0);
    expensesData.push(monthlyData[monthYear]?.expenses || 0);
  }

  return {
    labels,
    incomeData,
    expensesData,
  };
}
