"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { User, UserPermission, UserRole } from "@prisma/client";

interface DashboardData {
  stats: {
    totalRevenue: { amount: number; change: number };
    expenses: { amount: number; change: number };
    netProfit: { amount: number; change: number };
    activeEmployees: { count: number; change: number };
  };
  projectMetrics: {
    activeProjects: number;
    completedProjects: number;
    pendingProjects: number;
    overdueProjects: number;
    topProjects: any[];
  };
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    statusDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
    avgCompletionTime: number;
    onTimeCompletionRate: number;
    weeklyDueTasks: number;
  };
  employeeSummary: {
    activeEmployees: number;
    onDutyToday: number;
    offDutyToday: number;
    onLeave: number;
  };
  freelancerSummary: {
    totalFreelancers: number;
    reliableFreelancers: number;
    onDutyToday: number;
    offDutyToday: number;
  };
  financialSummary: {
    totalInvoices: number;
    paidInvoices: number;
    totalExpenses: number;
    paidExpenses: number;
  };
  recentTransactions: any[];
  performanceMetrics: {
    collectionRate: number;
    expenseRatio: number;
    conversionRate: number;
    paidInvoicesCount: number;
    invoicesLength: number;
  };
  overviewChartData: {
    labels: string[];
    incomeData: number[];
    expensesData: number[];
  };
  alerts: Array<{
    id: string;
    type: "invoice" | "expense" | "quotation" | "project" | "payroll" | "task";
    title: string;
    description: string;
    dueDate?: string;
    daysRemaining: number;
  }>;
  recentTasks: any[];
  chartSummaries: Record<string, any>;
  invoiceChartData: any;
  expenseChartData: any;
  quotationChartData: any;
  revenueChartData: any;
}

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch dashboard data");
  }
  return response.json();
}

async function fetchUserData(userId: string): Promise<User> {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch user data");
  }
  return response.json();
}

async function fetchDashboardSettings(userId: string) {
  const response = await fetch(`/api/dashboard/settings?userId=${userId}`);
  if (!response.ok) {
    // If settings don't exist yet, return default settings
    if (response.status === 404) {
      return getDefaultSettings();
    }
    throw new Error("Failed to fetch dashboard settings");
  }
  return response.json();
}

function getDefaultSettings() {
  return {
    showFinancialSummary: true,
    showProjectSummary: true,
    showTaskSummary: true,
    showEmployeeSummary: true,
    showFreelancerSummary: true,
    defaultChartType: "BAR" as const,
    showInvoiceChart: true,
    showExpenseChart: true,
    showQuotationChart: true,
    showRevenueChart: true,
    showDueDateAlerts: true,
    showPayrollAlerts: true,
    showTaskAlerts: true,
  };
}

// Check if user has permission to view dashboard
function hasDashboardPermission(user: User | null): boolean {
  if (!user) return false;

  const fullAccessRoles: UserRole[] = [UserRole.CHIEF_EXECUTIVE_OFFICER];

  const hasFullAccess = fullAccessRoles.includes(user.role as UserRole);
  const hasDashboardPermission = user.permissions?.includes(
    UserPermission.SYSTEMS_DASHBOARD
  );

  return hasFullAccess || hasDashboardPermission;
}

export function useDashboardData() {
  const { userId } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  // Fetch user data, dashboard data, and settings in parallel
  const queries = useQueries({
    queries: [
      {
        queryKey: ["user", userId],
        queryFn: () => fetchUserData(userId!),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      {
        queryKey: ["dashboard"],
        queryFn: fetchDashboardData,
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchInterval: 30000,
      },
      {
        queryKey: ["dashboard-settings", userId],
        queryFn: () => fetchDashboardSettings(userId!),
        enabled: !!userId,
        staleTime: 10 * 60 * 1000, // 10 minutes
      },
    ],
  });

  const [userQuery, dashboardQuery, settingsQuery] = queries;

  // Set current user and check permissions
  useEffect(() => {
    if (userQuery.data) {
      const user = userQuery.data;
      setCurrentUser(user);
      setHasAccess(hasDashboardPermission(user));
    }
  }, [userQuery.data]);

  // Error handling with specific messages
  useEffect(() => {
    if (userQuery.error) {
      toast.error("Failed to load user profile");
      console.error("User data error:", userQuery.error);
    }

    if (dashboardQuery.error) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard data error:", dashboardQuery.error);
    }

    if (settingsQuery.error) {
      toast.error("Failed to load dashboard settings");
      console.error("Settings error:", settingsQuery.error);
    }
  }, [userQuery.error, dashboardQuery.error, settingsQuery.error]);

  // Combined loading state
  const isLoading =
    userQuery.isLoading || dashboardQuery.isLoading || settingsQuery.isLoading;

  // Combined error state
  const error = userQuery.error || dashboardQuery.error || settingsQuery.error;

  // Transform data for the dashboard
  const transformedData = {
    ...dashboardQuery.data,
    currentUser,
    settings: settingsQuery.data || getDefaultSettings(),
    hasAccess,
  };

  return {
    data: transformedData,
    isLoading,
    error,
    refetch: () => {
      userQuery.refetch();
      dashboardQuery.refetch();
      settingsQuery.refetch();
    },
    isRefetching:
      userQuery.isRefetching ||
      dashboardQuery.isRefetching ||
      settingsQuery.isRefetching,
  };
}

// Additional hook for real-time updates on specific metrics
export function useDashboardRealTimeUpdates(enabled: boolean = true) {
  const { data, refetch } = useDashboardData();

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      // Only refetch if the tab is visible
      if (!document.hidden) {
        refetch();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [enabled, refetch]);

  return { data, refetch };
}

// Hook for dashboard settings management
export function useDashboardSettings() {
  const { userId } = useAuth();

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-settings", userId],
    queryFn: () => fetchDashboardSettings(userId!),
    enabled: !!userId,
  });

  const updateSettings = async (newSettings: any) => {
    if (!userId) throw new Error("User not authenticated");

    const response = await fetch("/api/dashboard/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, ...newSettings }),
    });

    if (!response.ok) {
      throw new Error("Failed to update dashboard settings");
    }

    return response.json();
  };

  return {
    settings: settings || getDefaultSettings(),
    isLoading,
    error,
    updateSettings,
  };
}
