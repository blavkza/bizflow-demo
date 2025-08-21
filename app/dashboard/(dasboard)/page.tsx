"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { OverviewChart } from "@/components/overview-chart";
import { RecentTransactions } from "@/components/recent-transactions";
import { QuickActions } from "@/components/quick-actions";
import {
  AlertTriangle,
  Activity,
  TrendingUp,
  FolderKanban,
  CheckSquare,
  Clock,
  CheckCircle,
  Folder,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "./_components/stat-card";
import { CashFlowItem } from "./_components/cash-flow-item";
import { MetricCard } from "./_components/metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User } from "@prisma/client";
import { calculateProjectProgress } from "../projects/[id]/utils";
import { getStatusColor } from "@/lib/invoiceUtils";

async function fetchDashboardData() {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
}

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch user data");
  return response.json();
}

export default function DashboardPage() {
  const { userId } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const {
    data: userData,
    isLoading: loadingUser,
    error: userError,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
  });

  const {
    data,
    isLoading: isLoadingDashboardData,
    error: dashboardError,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 100000,
  });

  useEffect(() => {
    if (userData) {
      setCurrentUser(userData);
    }
  }, [userData]);

  useEffect(() => {
    if (userError) {
      toast.error("Failed to fetch user");
    }
  }, [userError]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (dashboardError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
          <h3 className="text-lg font-medium">Error loading dashboard</h3>
          <p className="text-sm text-muted-foreground">
            {dashboardError.message}
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "LOW":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "default";
      case "PLANNING":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Welcome Header */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-4">
            {currentUser && (
              <CardHeader className="">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={currentUser?.avatar || "/placeholder-user.jpg"}
                      alt={currentUser?.name || "User"}
                    />
                    <AvatarFallback>
                      {getInitials(currentUser?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold">
                      Welcome, {currentUser?.name || "User"} 👋
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {currentUser?.createdAt
                        ? `Member since ${new Date(currentUser.createdAt).toLocaleDateString()}`
                        : "Loading..."}
                    </p>
                  </div>
                </div>
              </CardHeader>
            )}

            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 pt-5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-lg">
                    <FolderKanban className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Projects</p>
                    {isLoadingDashboardData ? (
                      <Loader2 className="h-6 w-6 animate-spin mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {data?.projectMetrics?.activeProjects || 0}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-lg">
                    <CheckSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Completed Projects</p>
                    {isLoadingDashboardData ? (
                      <Loader2 className="h-6 w-6 animate-spin mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {data?.projectMetrics?.completedProjects || 0}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Completed Tasks</p>
                    {isLoadingDashboardData ? (
                      <Loader2 className="h-6 w-6 animate-spin mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {data?.taskMetrics?.completedTasks || 0}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-lg">
                    <Clock className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Overdue Tasks</p>
                    {isLoadingDashboardData ? (
                      <Loader2 className="h-6 w-6 animate-spin mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {data?.taskMetrics?.overdueTasks || 0}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            isLoading={isLoadingDashboardData}
            title="Total Revenue"
            value={data?.stats?.totalRevenue?.amount}
            change={data?.stats?.totalRevenue?.change}
            icon="dollar"
            formatter={formatCurrency}
          />
          <StatCard
            isLoading={isLoadingDashboardData}
            title="Expenses"
            value={data?.stats?.expenses?.amount}
            change={data?.stats?.expenses?.change}
            icon="credit-card"
            formatter={formatCurrency}
          />
          <StatCard
            isLoading={isLoadingDashboardData}
            title="Net Profit"
            value={data?.stats?.netProfit?.amount}
            change={data?.stats?.netProfit?.change}
            icon="trending-up"
            formatter={formatCurrency}
          />
          <StatCard
            isLoading={isLoadingDashboardData}
            title="Active Employees"
            value={data?.stats?.activeEmployees?.count}
            change={data?.stats?.activeEmployees?.change}
            icon="users"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-7 ">
          <div className="md:col-span-5">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Financial Overview</TabsTrigger>
                <TabsTrigger value="projects">Project Performance</TabsTrigger>
                <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    {isLoadingDashboardData ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : (
                      <OverviewChart
                        labels={data?.overviewChartData?.labels || []}
                        incomeData={data?.overviewChartData?.incomeData || []}
                        expensesData={
                          data?.overviewChartData?.expensesData || []
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="projects">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Performance</CardTitle>
                    <CardDescription>
                      Project progress and budget utilization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDashboardData ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-2 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {data?.projectMetrics?.topProjects?.map(
                          (project: any) => (
                            <div key={project.id} className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text font-medium">
                                  {project.title}
                                </span>
                                <Badge
                                  className={getStatusColor(project.status)}
                                >
                                  {project.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                  Progress:{" "}
                                  {calculateProjectProgress(project.tasks)}% (
                                  {project.tasks.length} Task)
                                </span>
                                <span>
                                  Budget:{" "}
                                  {formatCurrency(
                                    Number(project.budgetSpent || 0)
                                  )}{" "}
                                  /{" "}
                                  {formatCurrency(Number(project.budget || 0))}
                                </span>
                              </div>
                              <Progress
                                value={calculateProjectProgress(project.tasks)}
                                className="h-2"
                              />
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="tasks">
                <Card>
                  <CardHeader>
                    <CardTitle>Task Analytics</CardTitle>
                    <CardDescription>
                      Task completion rates and distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDashboardData ? (
                      <div className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1  gap-6 pb-5">
                        {/* Status Distribution with Progress Bars */}
                        <div className="space-y-4 py-4">
                          <h4 className="text-lg uppercase">
                            Status Distribution
                          </h4>
                          {Object.entries(
                            data?.taskMetrics?.statusDistribution || {}
                          ).map(([status, count]) => {
                            const totalTasks = Object.values(
                              data?.taskMetrics?.statusDistribution || {}
                            ).reduce((a: number, b: number) => a + b, 0);
                            const percentage =
                              totalTasks > 0
                                ? Math.round(
                                    ((count as number) / totalTasks) * 100
                                  )
                                : 0;

                            return (
                              <div key={status} className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="capitalize font-medium">
                                    {status.toLowerCase().replace("_", " ")}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {count as number} ({percentage}%)
                                  </span>
                                </div>
                                <Progress
                                  value={percentage}
                                  className="h-2"
                                  indicatorClassName={
                                    status === "DONE"
                                      ? "bg-green-500"
                                      : status === "IN_PROGRESS"
                                        ? "bg-blue-500"
                                        : status === "TODO"
                                          ? "bg-gray-400"
                                          : "bg-amber-500"
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Priority Distribution with Color Coding */}
                        <div className="space-y-4">
                          <h4 className="text-lg uppercase">
                            Priority Distribution
                          </h4>
                          {Object.entries(
                            data?.taskMetrics?.priorityDistribution || {}
                          ).map(([priority, count]) => {
                            const totalTasks = Object.values(
                              data?.taskMetrics?.priorityDistribution || {}
                            ).reduce((a: number, b: number) => a + b, 0);
                            const percentage =
                              totalTasks > 0
                                ? Math.round(
                                    ((count as number) / totalTasks) * 100
                                  )
                                : 0;

                            return (
                              <div key={priority} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="capitalize font-medium flex items-center gap-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        priority === "URGENT"
                                          ? "bg-red-800"
                                          : priority === "MEDIUM"
                                            ? "bg-yellow-500"
                                            : priority === "HIGH"
                                              ? "bg-red-400"
                                              : "bg-green-500"
                                      }`}
                                    />
                                    {priority.toLowerCase()}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {count as number} ({percentage}%)
                                  </span>
                                </div>
                                <Progress
                                  value={percentage}
                                  className="h-2"
                                  indicatorClassName={
                                    priority === "HIGH"
                                      ? "bg-red-500"
                                      : priority === "MEDIUM"
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Cash Flow Forecast
                </CardTitle>
                <CardDescription>Projected cash flow</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDashboardData ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CashFlowItem
                      label="Next Month"
                      amount={data?.cashFlow?.nextMonth?.amount || 0}
                      progress={data?.cashFlow?.nextMonth?.progress || 0}
                      formatter={formatCurrency}
                    />
                    <CashFlowItem
                      label="Quarter End"
                      amount={data?.cashFlow?.quarterEnd?.amount || 0}
                      progress={data?.cashFlow?.quarterEnd?.progress || 0}
                      formatter={formatCurrency}
                    />
                    <CashFlowItem
                      label="Year End"
                      amount={data?.cashFlow?.yearEnd?.amount || 0}
                      progress={data?.cashFlow?.yearEnd?.progress || 0}
                      formatter={formatCurrency}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used actions</CardDescription>
              </CardHeader>
              <CardContent>
                <QuickActions />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDashboardData ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <RecentTransactions
                  transactions={data?.recentTransactions || []}
                  formatter={formatCurrency}
                />
              )}
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Tasks needing attention</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDashboardData ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.upcomingDeadlines?.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          task.priority === "HIGH"
                            ? "destructive"
                            : task.priority === "MEDIUM"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card> */}

          <div className="space-y-4">
            <MetricCard
              isLoading={isLoadingDashboardData}
              title="Invoice Collection Rate"
              value={data?.performanceMetrics?.collectionRate || 0}
              progress={data?.performanceMetrics?.collectionRate || 0}
              icon="check-circle"
              description={`Based on ${data?.performanceMetrics?.paidInvoicesCount || 0} paid invoices`}
            />
            <MetricCard
              isLoading={isLoadingDashboardData}
              title="Expense vs Income"
              value={data?.performanceMetrics?.expenseRatio || 0}
              progress={data?.performanceMetrics?.expenseRatio || 0}
              icon="trending-up"
              description={
                (data?.performanceMetrics?.expenseRatio || 0) > 100
                  ? "Expenses exceed income"
                  : "Healthy ratio"
              }
            />
            <MetricCard
              isLoading={isLoadingDashboardData}
              title="Quotation Conversion"
              value={data?.performanceMetrics?.conversionRate || 0}
              progress={data?.performanceMetrics?.conversionRate || 0}
              icon="users"
              description="Based on latest quotations"
            />
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
