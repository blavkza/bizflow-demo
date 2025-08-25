"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { User } from "@prisma/client";

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

export function useDashboardData() {
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
    refetchInterval: 30000,
  });

  const {
    data,
    isLoading: isLoadingDashboardData,
    error: dashboardError,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
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

  return {
    data: { ...data, currentUser },
    isLoading: isLoadingDashboardData || loadingUser,
    error: dashboardError || userError,
  };
}
