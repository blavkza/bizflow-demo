"use client";

import { useEffect, useState } from "react";
import Header from "./_components/Header";
import InvoicesFilterTable from "./_components/Invoices-Filter-Table";
import Stats from "./_components/Stats";
import Loading from "./_components/loading";
import { FullInvoice } from "@/types/invoice";
import { UserPermission, UserRole } from "@prisma/client";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<FullInvoice[] | []>([]);
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

    fetchInvoices();
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
        <Stats invoices={invoices} />

        <InvoicesFilterTable invoices={invoices} />
      </div>
    </div>
  );
}
