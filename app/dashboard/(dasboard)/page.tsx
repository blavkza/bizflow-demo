"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { OverviewChart } from "@/components/overview-chart";
import { RecentTransactions } from "@/components/recent-transactions";
import { QuickActions } from "@/components/quick-actions";
import { AlertTriangle, Activity, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "./_components/stat-card";
import { CashFlowItem } from "./_components/cash-flow-item";
import { EventItem } from "./_components/event-item";
import { MetricCard } from "./_components/metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchDashboardData() {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 100000,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
          <h3 className="text-lg font-medium">Error loading dashboard</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
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
        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            isLoading={isLoading}
            title="Total Revenue"
            value={data?.stats.totalRevenue.amount}
            change={data?.stats.totalRevenue.change}
            icon="dollar"
            formatter={formatCurrency}
          />
          <StatCard
            isLoading={isLoading}
            title="Expenses"
            value={data?.stats.expenses.amount}
            change={data?.stats.expenses.change}
            icon="credit-card"
            formatter={formatCurrency}
          />
          <StatCard
            isLoading={isLoading}
            title="Net Profit"
            value={data?.stats.netProfit.amount}
            change={data?.stats.netProfit.change}
            icon="trending-up"
            formatter={formatCurrency}
          />
          <StatCard
            isLoading={isLoading}
            title="Active Employees"
            value={data?.stats.activeEmployees.count}
            change={data?.stats.activeEmployees.change}
            icon="users"
          />
        </div>

        {/* Cash Flow Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Cash Flow Forecast
            </CardTitle>
            <CardDescription>Projected cash flow</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <CashFlowItem
                  label="Next Month"
                  amount={data?.cashFlow.nextMonth.amount}
                  progress={data?.cashFlow.nextMonth.progress}
                  formatter={formatCurrency}
                />
                <CashFlowItem
                  label="Quarter End"
                  amount={data?.cashFlow.quarterEnd.amount}
                  progress={data?.cashFlow.quarterEnd.progress}
                  formatter={formatCurrency}
                />
                <CashFlowItem
                  label="Year End"
                  amount={data?.cashFlow.yearEnd.amount}
                  progress={data?.cashFlow.yearEnd.progress}
                  formatter={formatCurrency}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-7">
          <div className="md:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <OverviewChart
                    labels={data?.overviewChartData.labels}
                    incomeData={data?.overviewChartData.incomeData}
                    expensesData={data?.overviewChartData.expensesData}
                  />
                )}
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used actions</CardDescription>
              </CardHeader>
              <CardContent>
                <QuickActions />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading
                  ? [1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-2 h-2 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))
                  : data?.upcomingEvents.map((event: any, index: number) => (
                      <EventItem
                        key={index}
                        title={event.title}
                        date={event.date}
                        type={event.type}
                      />
                    ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <RecentTransactions
                transactions={data?.recentTransactions}
                formatter={formatCurrency}
              />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            isLoading={isLoading}
            title="Invoice Collection Rate"
            value={data?.performanceMetrics.collectionRate}
            progress={data?.performanceMetrics.collectionRate}
            icon="check-circle"
            description={`Based on ${data?.performanceMetrics.paidInvoicesCount} paid invoices`}
          />
          <MetricCard
            isLoading={isLoading}
            title="Expense vs Income"
            value={data?.performanceMetrics.expenseRatio}
            progress={data?.performanceMetrics.expenseRatio}
            icon="trending-up"
            description={
              data?.performanceMetrics.expenseRatio > 100
                ? "Expenses exceed income"
                : "Healthy ratio"
            }
          />
          <MetricCard
            isLoading={isLoading}
            title="Quotation Conversion"
            value={data?.performanceMetrics.conversionRate}
            progress={data?.performanceMetrics.conversionRate}
            icon="users"
            description="Based on latest quotations"
          />
        </div>
      </div>
    </SidebarInset>
  );
}
