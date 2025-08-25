"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import WelcomeHeader from "./_components/welcome-header";
import StatsGrid from "./_components/stats-grid";
import FinancialTabs from "./_components/financial-tabs";
import CashFlowCard from "./_components/cash-flow-card";
import RecentTransactionsCard from "./_components/recent-transactions-card";
import MetricCards from "./_components/metric-cards";
import { QuickActions } from "@/components/quick-actions";
import { UserPermission, UserRole } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import Loader from "./_components/loader";
import { useEffect } from "react";

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

  if (!isLoading && canViewDashboard === false && hasFullAccess === false) {
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

  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <WelcomeHeader isLoading={isLoading} data={data} />
        <StatsGrid isLoading={isLoading} data={data} />

        <div className="grid gap-4 md:grid-cols-7">
          <div className="md:col-span-5">
            <FinancialTabs isLoading={isLoading} data={data} />
          </div>

          <div className="md:col-span-2 space-y-4">
            <CashFlowCard isLoading={isLoading} data={data} />
            <QuickActions isLoading={isLoading} data={data} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <RecentTransactionsCard isLoading={isLoading} data={data} />
          <MetricCards isLoading={isLoading} data={data} />
        </div>
      </div>
    </div>
  );
}
