"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";
import { SidebarItermsSkeleton } from "./SidebarItermsSkeleton";
import { useNotifications } from "@/contexts/notification-context";
import { Project } from "@/types/sidebar";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { SidebarItems } from "./sidebar/sidebar-items";
import { UserPermission, User } from "@prisma/client";

async function fetchProjectData(): Promise<Project[]> {
  const response = await fetch("/api/projects");
  if (!response.ok) throw new Error("Failed to fetch Projects data");
  return response.json();
}

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

export default function AppSidebar() {
  const { userId } = useAuth();
  const { unreadCount } = useNotifications();

  const {
    data: userData,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: fetchProjectData,
    refetchInterval: 10000,
    enabled: !!userId,
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["sidebar-stats"],
    queryFn: async () => {
      const response = await fetch("/api/sidebar/stats");
      if (!response.ok) throw new Error("Failed to fetch sidebar stats");
      return response.json();
    },
    refetchInterval: 30000,
  });

  React.useEffect(() => {
    if (userError) {
      console.error("Failed to fetch user data:", userError);
      toast.error("Failed to load user information");
    }

    if (projectsError) {
      console.error("Failed to fetch projects:", projectsError);
      toast.error("Failed to fetch projects");
    }

    if (statsError) {
      console.error("Failed to fetch sidebar stats:", statsError);
    }
  }, [userError, projectsError, statsError]);

  if (!userId || isLoadingUser || isLoadingProjects) {
    return <SidebarItermsSkeleton />;
  }

  if (!userData) {
    return <div>NOT AUTHENTICATED</div>;
  }

  return (
    <div>
      <SidebarItems
        role={userData?.role}
        projects={projects}
        permissions={userData?.permissions || []}
        unreadCount={unreadCount}
        userId={userData?.id}
        pendingToolRequests={stats?.toolRequests || 0}
        pendingToolReturns={stats?.toolReturns || 0}
        pendingToolMaintenance={stats?.toolMaintenance || 0}
        pendingEmergencyCallOuts={stats?.emergencyCallOuts || 0}
        pendingLeaveRequests={stats?.leaveRequests || 0}
        pendingOvertimeRequests={stats?.overtimeRequests || 0}
        overdueInvoices={stats?.overdueInvoices || 0}
        overdueQuotations={stats?.overdueQuotations || 0}
        pendingRefunds={stats?.pendingRefunds || 0}
      />
    </div>
  );
}
