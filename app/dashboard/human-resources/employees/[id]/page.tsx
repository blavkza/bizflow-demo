"use client";

import axios from "axios";
import Header from "./_components/Header";
import StatsCard from "./_components/Stats-Card";
import TabsSection from "./_components/TabsSection";
import { EmployeeWithDetails } from "@/types/employee";
import { use, useEffect, useState } from "react";
import { UserPermission, UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Loading from "./_components/loading";

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

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [employee, setEmployee] = useState<EmployeeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

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

  const canViewEmployees = data?.permissions?.includes(
    UserPermission.EMPLOYEES_VIEW
  );

  const canEditEmployees = data?.permissions?.includes(
    UserPermission.EMPLOYEES_EDIT
  );

  useEffect(() => {
    if (!isLoading && canViewEmployees === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewEmployees, hasFullAccess]);

  const fetchEmployee = async () => {
    try {
      const response = await axios.get(`/api/employees/${id}`);

      const data = response.data;

      setEmployee(data);
    } catch (err) {
      console.error("Failed to fetch employee", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!employee) {
    return <div>Department not found</div>;
  }

  return (
    <div className="space-y-4">
      <Header
        employee={employee}
        canEditEmployees={canEditEmployees}
        hasFullAccess={hasFullAccess}
        fetchEmployee={fetchEmployee}
      />
      <StatsCard employee={employee} />
      <TabsSection
        employee={employee}
        canEditEmployees={canEditEmployees}
        hasFullAccess={hasFullAccess}
        fetchEmployee={fetchEmployee}
      />
    </div>
  );
}
