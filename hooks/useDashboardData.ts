"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchDashboardData() {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
}

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 300000,
  });
}
