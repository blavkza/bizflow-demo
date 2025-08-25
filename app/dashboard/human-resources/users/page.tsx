"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import Header from "./_components/header";
import StatsCard from "./_components/stats-card";
import Userslist from "./_components/users-list";
import { UserPermission, UserRole, UserStatus } from "@prisma/client";
import Loading from "./_components/loading";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { userId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];

  const hasFullAccess = data?.role
    ? hasRole(data?.role, fullAccessRoles)
    : false;

  const canViewUsers = data?.permissions?.includes(UserPermission.USERS_VIEW);

  const canCreateUsers = data?.permissions?.includes(
    UserPermission.USERS_CREATE
  );

  const canEditUsers = data?.permissions?.includes(UserPermission.USERS_EDIT);

  const canDeleteUsers = data?.permissions?.includes(
    UserPermission.USERS_DELETE
  );

  useEffect(() => {
    if (!isLoading && canViewUsers === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewUsers, hasFullAccess]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users/all-users");
      setUsers(response.data);
    } catch (err) {
      setError("Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header
        fetchUsers={fetchUsers}
        canCreateUsers={canCreateUsers}
        hasFullAccess={hasFullAccess}
      />
      <StatsCard users={users} />
      <Userslist
        users={users}
        fetchUsers={fetchUsers}
        hasFullAccess={hasFullAccess}
        canEditUsers={canEditUsers}
        canDeleteUsers={canDeleteUsers}
      />
    </div>
  );
}
