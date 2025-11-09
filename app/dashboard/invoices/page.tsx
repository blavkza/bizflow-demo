"use client";

import { useEffect, useState } from "react";
import Header from "./_components/Header";
import InvoicesFilterTable from "./_components/Invoices-Filter-Table";
import RecurringInvoicesTable from "./_components/RecurringInvoicesTable";
import Stats from "./_components/Stats";
import RecurringStats from "./_components/RecurringStats";
import Loading from "./_components/loading";
import { FullInvoice } from "@/types/invoice";
import { UserPermission, UserRole } from "@prisma/client";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecurringInvoice } from "@prisma/client";

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

async function fetchRecurringInvoices(): Promise<RecurringInvoice[]> {
  const response = await fetch("/api/invoices/recurring");
  if (!response.ok) {
    throw new Error("Failed to fetch recurring invoices");
  }
  return response.json();
}

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<FullInvoice[] | []>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<
    RecurringInvoice[] | []
  >([]);
  const [loading, setLoading] = useState(true);
  const [recurringLoading, setRecurringLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("regular");

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

  const canViewInvoices = data?.permissions?.includes(
    UserPermission.INVOICES_VIEW
  );

  const canCreateInvoice = data?.permissions?.includes(
    UserPermission.INVOICES_CREATE
  );

  useEffect(() => {
    if (!isLoading && canViewInvoices === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewInvoices, hasFullAccess]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/invoices/all-invoices");

        if (!response.ok) {
          throw new Error("Failed to fetch invoices");
        }

        const data = await response.json();
        setInvoices(data);
      } catch (err) {
        setError("Failed to fetch invoices");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecurringData = async () => {
      try {
        const data = await fetchRecurringInvoices();
        setRecurringInvoices(data);
      } catch (err) {
        console.error("Failed to fetch recurring invoices:", err);
      } finally {
        setRecurringLoading(false);
      }
    };

    fetchInvoices();
    fetchRecurringData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!invoices) {
    return <div className="p-6">No invoice data available</div>;
  }

  return (
    <div className="p-6">
      <Header
        canCreateInvoice={canCreateInvoice}
        hasFullAccess={hasFullAccess}
      />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="regular">
              Regular Invoices ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="recurring">
              Recurring Invoices ({recurringInvoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="regular" className="space-y-4">
            <Stats invoices={invoices} />
            <InvoicesFilterTable invoices={invoices} />
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4">
            <RecurringStats recurringInvoices={recurringInvoices} />
            <RecurringInvoicesTable
              recurringInvoices={recurringInvoices}
              loading={recurringLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
