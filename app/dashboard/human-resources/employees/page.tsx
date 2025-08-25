"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import EmployeesPageWrapper from "./_components/EmployeesPageWrapper";
import EmployeesLoading from "./_components/loading";
import { UserPermission, UserRole } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email?: string;
  phone: string;
  position: string;
  department: string;
  status: string;
  workType: string;
  salary: number;
  location: string;
  startDate: string;
  manager: string;
  avatar: string | null;
}

interface Department {
  id: string;
  name: string;
}

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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
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

  const canViewEmployees = data?.permissions?.includes(
    UserPermission.EMPLOYEES_VIEW
  );

  const canCreateEmployees = data?.permissions?.includes(
    UserPermission.EMPLOYEES_CREATE
  );

  useEffect(() => {
    if (!isLoading && canViewEmployees === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewEmployees, hasFullAccess]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employees");
      setEmployees(response.data.employees);
      setDepartments(response.data.departments);
      setStatuses(response.data.statuses);
      setWorkTypes(response.data.workTypes);
    } catch (err) {
      setError("Failed to fetch employees");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <EmployeesLoading />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-6 text-red-500">{error}</div>;
  }

  return (
    <EmployeesPageWrapper
      employees={employees}
      departments={departments}
      initialStatuses={statuses}
      initialWorkTypes={workTypes}
      fetchEmployees={fetchEmployees}
      canCreateEmployees={canCreateEmployees}
      canViewEmployees={canViewEmployees}
      hasFullAccess={hasFullAccess}
    />
  );
}
