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

  React.useEffect(() => {
    if (userError) {
      console.error("Failed to fetch user data:", userError);
      toast.error("Failed to load user information");
    }

    if (projectsError) {
      console.error("Failed to fetch projects:", projectsError);
      toast.error("Failed to fetch projects");
    }
  }, [userError, projectsError]);

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
      />
    </div>
  );
}
