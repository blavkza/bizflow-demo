"use client";

import TabsSection from "./_components/TabsSection";
import Header from "./_components/Header";
import axios from "axios";
import { use, useEffect, useState } from "react";
import { Department } from "@/types/department";
import { UserPermission, UserRole } from "@prisma/client";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Loading from "./_components/Loading";

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

export default function DepartmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [department, setDepartment] = useState<Department | null>(null);
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

  const canViewDepartments = data?.permissions?.includes(
    UserPermission.DEPARTMENT_VIEW
  );

  const canEditDepartments = data?.permissions?.includes(
    UserPermission.DEPARTMENT_EDIT
  );

  const canViewEmployees = data?.permissions?.includes(
    UserPermission.EMPLOYEES_VIEW
  );

  const canCreateEmployees = data?.permissions?.includes(
    UserPermission.EMPLOYEES_CREATE
  );

  useEffect(() => {
    if (!isLoading && canViewDepartments === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewDepartments, hasFullAccess]);

  const fetchDepartment = async () => {
    try {
      const response = await axios.get(`/api/departments/${id}`);
      setDepartment(response.data.department);
    } catch (err) {
      console.error("Failed to fetch department");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!department) {
    return <div>Department not found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header
        department={department}
        fetchDepartment={fetchDepartment}
        canEditDepartments={canEditDepartments}
        hasFullAccess={hasFullAccess}
      />
      <TabsSection
        department={department}
        canCreateEmployees={canCreateEmployees}
        canViewEmployees={canViewEmployees}
        hasFullAccess={hasFullAccess}
        fetchDepartment={fetchDepartment}
        departmentId={id}
      />
    </div>
  );
}
