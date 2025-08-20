"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { SidebarItermsSkeleton } from "./SidebarItermsSkeleton";
import { useNotifications } from "@/contexts/notification-context";
import { Project } from "@/types/sidebar";
import { SidebarItems } from "./sidebarItems";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

async function fetchProjectData() {
  const response = await fetch("/api/projects");
  if (!response.ok) throw new Error("Failed to fetch Projects data");
  return response.json();
}

export default function AppSidebar() {
  const { userId } = useAuth();
  const [role, setRole] = useState<string>("VIEWER");
  const [id, setid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { unreadCount } = useNotifications();

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

  const fetchUserRole = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/users/role?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user role");
      }
      const data = await response.json();

      setRole(data.role);
      setid(data.id);
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRole("VIEWER");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchUserRole();
  }, [userId]);

  useEffect(() => {
    if (projectsError) {
      toast.error("Failed to fetch projects");
    }
  }, [projectsError]);

  if (!userId || loading) {
    return <SidebarItermsSkeleton />;
  }

  if (!role) {
    return <div>NOT AUTHENTICATED</div>;
  }

  return (
    <div>
      <SidebarItems
        role={role}
        projects={projects}
        unreadCount={unreadCount}
        userId={id}
      />
    </div>
  );
}
