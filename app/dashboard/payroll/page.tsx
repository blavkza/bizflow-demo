"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import StatsCard from "./_components/Stats-Card";
import TableFilter from "./_components/Table-Filter";
import Loading from "./_components/loading";
import { UserPermission, UserRole } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

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

export default function WorkersPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const canViewPayroll = data?.permissions?.includes(
    UserPermission.PAYROLL_VIEW
  );

  const canManagePayroll = data?.permissions?.includes(
    UserPermission.PAYROLL_MANAGE
  );

  const canViewEmployee = data?.permissions?.includes(
    UserPermission.EMPLOYEES_VIEW
  );

  useEffect(() => {
    if (!isLoading && canViewPayroll === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewPayroll, hasFullAccess]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/payroll");
      setEmployees(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  if (loading)
    return (
      <div className="p-6">
        <Loading />
      </div>
    );
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Workers & Payroll</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <StatsCard employees={employees} />
        <TableFilter
          initialEmployees={employees}
          fetchEmployees={fetchEmployees}
          canManagePayroll={canManagePayroll}
          hasFullAccess={hasFullAccess}
          canViewEmployee={canViewEmployee}
        />
      </div>
    </div>
  );
}
