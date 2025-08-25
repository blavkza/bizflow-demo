"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuotationForm } from "../_components/QuotationForm";
import { UserPermission, UserRole } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
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

export default function CreateQuotationPage() {
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

  const canCreateQuotation = data?.permissions?.includes(
    UserPermission.QUOTATIONS_CREATE
  );

  const canEditQuotation = data?.permissions?.includes(
    UserPermission.QUOTATIONS_EDIT
  );

  useEffect(() => {
    if (
      !isLoading &&
      hasFullAccess === false &&
      canCreateQuotation === false &&
      canEditQuotation === false
    ) {
      router.push("/dashboard/invoices");
    }
  }, [isLoading, hasFullAccess]);

  const handleSubmitSuccess = () => {
    router.push("/dashboard/quotations");
    router.refresh();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/quotations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New Quotation</h1>
      </div>

      <div className="rounded-lg shadow-md overflow-hidden">
        <QuotationForm
          type="create"
          onCancel={handleCancel}
          onSubmitSuccess={handleSubmitSuccess}
        />
      </div>
    </div>
  );
}
