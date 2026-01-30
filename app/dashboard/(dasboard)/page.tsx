"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import WelcomeHeader from "./_components/welcome-header";
import FinancialTabs from "./_components/financial-tabs";
import CashFlowCard from "./_components/cash-flow-card";
import RecentTransactionsCard from "./_components/recent-transactions-card";
import MetricCards from "./_components/metric-cards";
import { QuickActions } from "@/components/quick-actions";
import { UserPermission, UserRole } from "@prisma/client";
import Loader from "./_components/loader";
import AlertsHorizontal from "./_components/alerts-horizontal";
import FinancialSummary from "./_components/financial-summary";
import ProjectSummary from "./_components/project-summary";
import TaskSummary from "./_components/task-summary";
import EmployeeSummary from "./_components/employee-summary";
import FreelancerSummary from "./_components/freelancer-summary";
import { BreakControl } from "./_components/break-control";

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardData();

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];

  const hasFullAccess = data?.currentUser?.role
    ? hasRole(data?.currentUser?.role, fullAccessRoles)
    : false;

  const canViewDashboard = data?.currentUser?.permissions?.includes(
    UserPermission.SYSTEMS_DASHBOARD
  );

  // Check for granular dashboard permissions
  const canViewFinances =
    hasFullAccess ||
    data?.currentUser?.permissions?.includes(UserPermission.DASHBOARD_FINANCES);
  const canViewProjects =
    hasFullAccess ||
    data?.currentUser?.permissions?.includes(UserPermission.DASHBOARD_PROJECTS);
  const canViewTasks =
    hasFullAccess ||
    data?.currentUser?.permissions?.includes(UserPermission.DASHBOARD_TASKs);
  const canViewWorks =
    hasFullAccess ||
    data?.currentUser?.permissions?.includes(UserPermission.DASHBOARD_WORKS);

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
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!isLoading && !canViewDashboard && !hasFullAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
          <h3 className="text-lg font-medium">
            You Don't Have Permission to Access Dashboard
          </h3>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator for access.
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

  // Check if user has any dashboard section permissions
  const hasAnyDashboardAccess =
    canViewFinances || canViewProjects || canViewTasks || canViewWorks;

  if (!hasAnyDashboardAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500" />
          <h3 className="text-lg font-medium">
            No Dashboard Sections Available
          </h3>
          <p className="text-sm text-muted-foreground">
            You don't have permission to view any dashboard sections. Please
            contact your administrator.
          </p>
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
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <AlertsHorizontal isLoading={isLoading} data={data} />

        <WelcomeHeader
          isLoading={isLoading}
          data={data}
          canViewFinances={canViewFinances}
        />

        {canViewFinances && (
          <FinancialSummary isLoading={isLoading} data={data} />
        )}

        {canViewProjects && (
          <ProjectSummary isLoading={isLoading} data={data} />
        )}

        {canViewTasks && <TaskSummary isLoading={isLoading} data={data} />}

        {canViewWorks && (
          <>
            <EmployeeSummary isLoading={isLoading} data={data} />
            <FreelancerSummary isLoading={isLoading} data={data} />
          </>
        )}

        {(canViewFinances || canViewProjects || canViewTasks) && (
          <div className="grid gap-4 md:grid-cols-7">
            <div className="md:col-span-5">
              <FinancialTabs
                isLoading={isLoading}
                data={data}
                canViewFinances={canViewFinances}
                canViewProjects={canViewProjects}
                canViewTasks={canViewTasks}
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              {canViewFinances && (
                <CashFlowCard isLoading={isLoading} data={data} />
              )}
              {data?.currentUser?.employeeId && (
                <BreakControl employeeId={data.currentUser.employeeId} />
              )}
              <QuickActions isLoading={isLoading} data={data} />
            </div>
          </div>
        )}

        {canViewFinances && (
          <div className="grid gap-4 md:grid-cols-2">
            <RecentTransactionsCard isLoading={isLoading} data={data} />
            <MetricCards isLoading={isLoading} data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
