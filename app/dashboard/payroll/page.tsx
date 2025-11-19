// app/workers/page.tsx
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
import { Payroll, WorkerWithDetails } from "@/types/payroll";

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
  const [workers, setWorkers] = useState<WorkerWithDetails[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("workers");

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
  }, [isLoading, canViewPayroll, hasFullAccess, router]);

  const fetchWorkers = async () => {
    try {
      const response = await axios.get("/api/payroll");
      setWorkers(response.data);
    } catch (err) {
      console.error("Failed to fetch workers:", err);
      setError("Failed to load workers data");
    }
  };

  const fetchPayrolls = async () => {
    try {
      const response = await axios.get("/api/payroll/history");
      if (response.data.payrolls) {
        setPayrolls(response.data.payrolls);
      } else {
        setPayrolls(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch payrolls:", err);
      setError("Failed to load payroll history");
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchWorkers(), fetchPayrolls()]);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Calculate counts for display
  const employeesCount = workers.filter(
    (worker) => !worker.isFreelancer
  ).length;
  const freelancersCount = workers.filter(
    (worker) => worker.isFreelancer
  ).length;
  const totalWorkersCount = workers.length;

  if (loading)
    return (
      <div className="p-6">
        <Loading />
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="font-semibold">Error</h3>
          <p>{error}</p>
          <button
            onClick={fetchAllData}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );

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
        <StatsCard employees={workers} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="workers">
              All Workers ({totalWorkersCount})
              <span className="ml-2 text-xs text-muted-foreground">
                {employeesCount}E + {freelancersCount}F
              </span>
            </TabsTrigger>
            <TabsTrigger value="payrolls">
              Payroll History ({payrolls.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workers" className="space-y-4">
            <TableFilter
              initialEmployees={workers}
              fetchEmployees={fetchWorkers}
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
