// hooks/useUser.ts
import { useQuery } from "@tanstack/react-query";
import { User } from "@prisma/client";
import { useAuth } from "@clerk/nextjs";

async function fetchUserData(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  const data = await response.json();
  return data.user;
}

export function useUser(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
    gcTime: 2 * 60 * 1000,
  });
}

// Hook to get current authenticated user
export function useCurrentUser() {
  const { userId } = useAuth();
  return useUser(userId);
}

// Hook to get any user by ID
export function useUserById(userId: string | null | undefined) {
  return useUser(userId);
}
