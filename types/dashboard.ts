import { UserPermission, UserRole } from "@prisma/client";

// Simplified Type definitions that match Prisma results
export interface DashboardInvoice {
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

export interface DashboardExpense {
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

export interface DashboardPayment {
  id: string;
  amount: any;
  paymentDate: Date;
  invoice?: {
    invoiceNumber: string;
  };
  invoiceId: string;
}

export interface DashboardQuotation {
  id: string;
  quotationNumber: string;
  totalAmount: any;
  status: string;
  validUntil: Date;
  client?: {
    name: string;
  };
}

export interface DashboardProject {
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
  Expense?: DashboardExpense[];
}

export interface DashboardTask {
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

export interface DashboardEmployee {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  position?: string;
  department?: {
    name: string;
  };
  AttendanceRecord: any[];
  leaveRequests: any[];
}

export interface DashboardFreeLancer {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  position?: string;
  reliable?: boolean | null;
  department?: {
    name: string;
  };
  attendanceRecords: any[];
  leaveRequests: any[];
}

export interface DashboardTimeEntry {
  id: string;
  date: Date;
  employee?: any;
  freeLancer?: any;
}

export interface DashboardLeaveRequest {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date;
  employee?: any;
  freeLancer?: any;
}

export interface DashboardTransaction {
  id: string;
  amount: any;
  type: string;
  date: Date;
  description: string;
  category?: string;
}

export interface Alert {
  id: string;
  type: "invoice" | "expense" | "quotation" | "project" | "payroll" | "task";
  title: string;
  description: string;
  dueDate?: string;
  daysRemaining: number;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  role: UserRole;
  permissions: UserPermission[];
}

export interface CashFlowData {
  nextMonth: {
    amount: number;
    progress: number;
  };
  quarterEnd: {
    amount: number;
    progress: number;
  };
  yearEnd: {
    amount: number;
    progress: number;
  };
}

export interface FinancialSummary {
  totalInvoicesAmount: number;
  paidInvoicesCount: number;
  paidInvoicesAmount: number;
  overdueInvoicesCount: number;
  overdueInvoicesAmount: number;
  outstandingInvoicesCount: number;
  outstandingInvoicesAmount: number;
  partiallyPaidInvoicesCount: number;
  partiallyPaidAmount: number;

  totalExpensesAmount: number;
  paidExpensesCount: number;
  paidExpensesAmount: number;
  pendingExpensesCount: number;
  pendingExpensesAmount: number;
  partiallyPaidExpensesCount: number;
  partiallyPaidExpensesAmount: number;

  monthlyRevenue: number;
  overallRevenue: number;
  quarterlyRevenue: number;
  yearlyRevenue: number;
  netProfit: number;
  grossRevenue: number;
  profitMargin: number;

  invoiceChange: number;
  paidInvoiceChange: number;
  expenseChange: number;
  paidExpenseChange: number;
  revenueChange: number;
  profitChange: number;

  collectionRate: number;
}

export interface ProjectSummary {
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  overdueProjects: number;
  totalProjectValue: number;
  activeChange: number;
  completedChange: number;
  pendingChange: number;
  overdueChange: number;
}

export interface TaskSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalChange: number;
  completedChange: number;
  inProgressChange: number;
  overdueChange: number;
}

export interface EmployeeSummary {
  activeEmployees: number;
  onDutyToday: number;
  offDutyToday: number;
  onLeave: number;
  totalEmployees: number;
  activeChange: number;
  onDutyChange: number;
  offDutyChange: number;
  leaveChange: number;
}

export interface FreelancerSummary {
  totalFreelancers: number;
  reliableFreelancers: number;
  onDutyToday: number;
  offDutyToday: number;
  onLeave: number;
  totalFreelancersAll: number;
  totalChange: number;
  reliableChange: number;
  onDutyChange: number;
  offDutyChange: number;
}

export interface TaskMetrics {
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  avgCompletionTime: number;
  onTimeCompletionRate: number;
  weeklyDueTasks: number;
}

export interface PerformanceMetrics {
  collectionRate: number;
  expenseRatio: number;
  conversionRate: number;
  paidInvoicesCount: number;
  invoicesLength: number;
}

export interface ProjectMetrics {
  topProjects: any[];
}

export interface OverviewChartData {
  labels: string[];
  incomeData: number[];
  expensesData: number[];
}

export interface ChartSummary {
  invoice: {
    totalInvoices: number;
    amountDue: number;
    paidAmount: number;
    overdueAmount: number;
    outstandingAmount: number;
    invoiceChange: number;
    dueChange: number;
    paidChange: number;
    overdueChange: number;
  };
  expense: {
    totalExpenses: number;
    pendingExpenses: number;
    paidExpenses: number;
    monthlyExpenses: number;
    expenseChange: number;
    pendingChange: number;
    paidChange: number;
    monthlyChange: number;
  };
  quotation: {
    totalQuotations: number;
    convertedQuotations: number;
    conversionRate: number;
    totalValue: number;
    quoteChange: number;
    convertedChange: number;
    rateChange: number;
    valueChange: number;
  };
  revenue: {
    totalRevenue: number;
    netProfit: number;
    profitMargin: number;
    growthRate: number;
    revenueChange: number;
    profitChange: number;
    marginChange: number;
    growthChange: number;
  };
}

export interface ChartData {
  labels: string[];
  incomeData: number[];
  expensesData: number[];
}

export interface DashboardResponse {
  // Current user data with all required properties
  currentUser: DashboardUser;

  // Summary sections
  financialSummary: FinancialSummary;
  projectSummary: ProjectSummary;
  taskSummary: TaskSummary;
  employeeSummary: EmployeeSummary;
  freelancerSummary: FreelancerSummary;

  // Employee and freelancer data
  employees: DashboardEmployee[];
  freelancers: DashboardFreeLancer[];

  // Recent data
  recentTransactions: any[];
  recentTasks: any[];
  recentInvoices: any[];
  recentExpenses: any[];
  allTasks: any[];

  // Metrics and analytics
  taskMetrics: TaskMetrics;
  performanceMetrics: PerformanceMetrics;
  projectMetrics: ProjectMetrics;

  // Charts and visualizations
  overviewChartData: OverviewChartData;
  invoiceChartData: ChartData;
  expenseChartData: ChartData;
  quotationChartData: ChartData;
  revenueChartData: ChartData;

  // Alerts and notifications
  alerts: Alert[];

  // Chart summaries for different views
  chartSummaries: ChartSummary;

  cashFlow: CashFlowData;
}
