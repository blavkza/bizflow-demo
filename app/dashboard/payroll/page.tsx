"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import StatsCard from "./_components/Stats-Card";
import TableFilter from "./_components/Table-Filter";
import PayrollHistory from "./_components/Payroll-History";
import Loading from "./_components/loading";
import { UserPermission, UserRole } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Payroll } from "@/types/payroll";

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
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("employees");

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
    }
  };

  const fetchPayrolls = async () => {
    try {
      const response = await axios.get("/api/payroll/history");
      // If the API returns the new structure with payrolls array
      if (response.data.payrolls) {
        setPayrolls(response.data.payrolls);
      } else {
        // If it returns just the array directly
        setPayrolls(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch payrolls:", err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEmployees(), fetchPayrolls()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employees">
              Employees ({employees.length})
            </TabsTrigger>
            <TabsTrigger value="payrolls">
              Payroll History ({payrolls.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            <TableFilter
              initialEmployees={employees}
              fetchEmployees={fetchEmployees}
              canManagePayroll={canManagePayroll}
              hasFullAccess={hasFullAccess}
              canViewEmployee={canViewEmployee}
            />
          </TabsContent>

          <TabsContent value="payrolls" className="space-y-4">
            <PayrollHistory
              initialPayrolls={payrolls}
              fetchPayrolls={fetchPayrolls}
              hasFullAccess={hasFullAccess}
              canManagePayroll={canManagePayroll}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
