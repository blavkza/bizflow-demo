"use client";

import { useRouter } from "next/navigation";
import InvoiceForm from "./_components/Invoice-Form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserPermission, UserRole } from "@prisma/client";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

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

export default function CreateInvoicePage() {
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

  const canEditInvoice = data?.permissions?.includes(
    UserPermission.INVOICES_EDIT
  );

  useEffect(() => {
    if (
      !isLoading &&
      hasFullAccess === false &&
      canCreateInvoice === false &&
      canEditInvoice === false
    ) {
      router.push("/dashboard/invoices");
    }
  }, [isLoading, canEditInvoice, hasFullAccess]);

  const handleSubmitSuccess = () => {
    router.push("/dashboard/invoices");
    router.refresh();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create New Invoice</h1>
      </div>

      <div className="  overflow-hidden">
        <InvoiceForm
          type="create"
          onCancel={handleCancel}
          onSubmitSuccess={handleSubmitSuccess}
        />
      </div>
    </div>
  );
}
