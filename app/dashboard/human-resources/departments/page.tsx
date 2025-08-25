"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import DepartmentList from "./_components/department-list";
import Header from "./_components/header";
import { DepartmentWithRelations } from "./_components/department-list";
import DepartmentsLoading from "../../categories/_components/loading";
import { UserPermission, UserRole } from "@prisma/client";
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

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentWithRelations[]>([]);
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

  const canViewDepartments = data?.permissions?.includes(
    UserPermission.DEPARTMENT_VIEW
  );

  const canCreateDepartments = data?.permissions?.includes(
    UserPermission.DEPARTMENT_CREATE
  );

  useEffect(() => {
    if (!isLoading && canViewDepartments === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewDepartments, hasFullAccess]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("/api/departments/all-departments");
      setDepartments(response.data);
    } catch (err) {
      setError("Failed to fetch departments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <DepartmentsLoading />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header
        fetchDepartments={fetchDepartments}
        canCreateDepartments={canCreateDepartments}
        hasFullAccess={hasFullAccess}
      />
      <DepartmentList departments={departments} />
    </div>
  );
}
