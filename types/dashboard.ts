// types/dashboard.ts
export interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number | string | Decimal;
  status: string;
  dueDate?: string | Date;
  createdAt: string | Date;
  client?: {
    name: string;
  };
  items: any[];
}

export interface Expense {
  id: string;
  description: string;
  totalAmount: number | string | Decimal;
  status: string;
  dueDate?: string | Date;
  createdAt: string | Date;
  category?: {
    name: string;
  };
  vendor?: {
    name: string;
  };
}

export interface Payment {
  id: string;
  amount: number | string | Decimal;
  paymentDate: string | Date;
  invoice?: {
    invoiceNumber: string;
  };
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  totalAmount: number | string | Decimal;
  status: string;
  validUntil: string | Date;
  client?: {
    name: string;
  };
  items: any[];
}

export interface Project {
  id: string;
  title: string;
  status: string;
  budget: number | string | Decimal;
  endDate?: string | Date;
  createdAt: string | Date;
  client?: {
    name: string;
  };
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | Date;
  progress?: number;
  createdAt: string | Date;
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  project?: {
    title: string;
  };
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  department?: {
    name: string;
  };
  timeEntries: TimeEntry[];
}

export interface FreeLancer {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  reliable?: boolean;
  department?: {
    name: string;
  };
  timeEntries: TimeEntry[];
}

export interface TimeEntry {
  id: string;
  date: string | Date;
  employee?: Employee;
  freeLancer?: FreeLancer;
}

export interface LeaveRequest {
  id: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date;
  employee?: Employee;
  freeLancer?: FreeLancer;
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

// For Decimal type from Prisma
export type Decimal = {
  toNumber: () => number;
};

// Dashboard response types
export interface DashboardData {
  financialSummary: FinancialSummary;
  projectSummary: ProjectSummary;
  taskSummary: TaskSummary;
  employeeSummary: EmployeeSummary;
  freelancerSummary: FreelancerSummary;
  recentTransactions: RecentTransaction[];
  taskMetrics: TaskMetrics;
  performanceMetrics: PerformanceMetrics;
  overviewChartData: ChartData;
  alerts: Alert[];
  recentTasks: RecentTask[];
  recentInvoices: RecentInvoice[];
  recentExpenses: RecentExpense[];
  allTasks: RecentTask[];
  chartSummaries: ChartSummaries;
  invoiceChartData: ChartData;
  expenseChartData: ChartData;
  quotationChartData: ChartData;
  revenueChartData: ChartData;
}

export interface FinancialSummary {
  totalInvoicesAmount: number;
  paidInvoicesCount: number;
  overdueInvoicesCount: number;
  overdueInvoicesAmount: number;
  totalExpensesAmount: number;
  paidExpensesCount: number;
  paidExpensesAmount: number;
  pendingExpensesCount: number;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  yearlyRevenue: number;
  netProfit: number;
  grossRevenue: number;
  profitMargin: number;
  invoiceChange: number;
  expenseChange: number;
  revenueChange: number;
  profitChange: number;
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
  totalChange: number;
  reliableChange: number;
  onDutyChange: number;
  offDutyChange: number;
}

export interface RecentTransaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string | Date;
  status: string;
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

export interface ChartData {
  labels: string[];
  incomeData: number[];
  expensesData: number[];
}

export interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | Date;
  assignee: string;
  progress: number;
  project: string;
}

export interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: string;
  dueDate?: string | Date;
}

export interface RecentExpense {
  id: string;
  description: string;
  category: string;
  totalAmount: number;
  status: string;
  dueDate?: string | Date;
}

export interface ChartSummaries {
  invoice: ChartSummary;
  expense: ChartSummary;
  quotation: ChartSummary;
  revenue: ChartSummary;
}

export interface ChartSummary {
  [key: string]: number;
}
