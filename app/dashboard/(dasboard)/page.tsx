// app/dashboard/(dashboard)/page.tsx
"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Settings, RefreshCw } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import WelcomeHeader from "./_components/welcome-header";
import AlertsHorizontal from "./_components/alerts-horizontal";
import FinancialSummary from "./_components/financial-summary";
import ProjectSummary from "./_components/project-summary";
import TaskSummary from "./_components/task-summary";
import EmployeeSummary from "./_components/employee-summary";
import FreelancerSummary from "./_components/freelancer-summary";
import FinancialCharts from "./_components/financial-charts";
import Loader from "./_components/loader";

export default function DashboardPage() {
  const { data, isLoading, error, refetch, isRefetching } = useDashboardData();

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
          <h3 className="text-lg font-medium">Error loading dashboard</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="mt-4"
            disabled={isRefetching}
          >
            {isRefetching ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 mt-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              /* Open settings dialog */
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Horizontal Alerts above Welcome Header */}
        <AlertsHorizontal isLoading={isLoading} data={data} />

        {/* Welcome Header with Finance Focus */}
        <WelcomeHeader isLoading={isLoading} data={data} />

        {/* All Summary Rows */}
        <FinancialSummary isLoading={isLoading} data={data} />
        <ProjectSummary isLoading={isLoading} data={data} />
        <TaskSummary isLoading={isLoading} data={data} />
        <EmployeeSummary isLoading={isLoading} data={data} />
        <FreelancerSummary isLoading={isLoading} data={data} />

        {/* Financial Charts - Overall Financial View */}
        <FinancialCharts isLoading={isLoading} data={data} />
      </div>
    </div>
  );
}
