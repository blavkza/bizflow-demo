"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { QuotationWithRelations } from "@/types/quotation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuotationHeader } from "./_components/QuotationHeader";
import { KeyMetrics } from "./_components/KeyMetrics";
import { QuotationInfoCard } from "./_components/QuotationInfoCard";
import { TermsCard } from "./_components/TermsCard";
import { ItemsTable } from "./_components/ItemsTable";
import { ClientInfoCard } from "./_components/ClientInfoCard";
import { QuotationPreview } from "./_components/QuotationPreview";
import { DocumentPreview } from "./_components/DocumentPreview";
import QuotationDetailLoading from "./_components/loading";
import { UserPermission, UserRole } from "@prisma/client";
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

export default function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [quotation, setQuotation] = useState<QuotationWithRelations | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { userId } = useAuth();

  const { data, isLoading: isUserLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];

  const hasFullAccess = data?.role
    ? hasRole(data?.role, fullAccessRoles)
    : false;

  const canViewQuotations = data?.permissions?.includes(
    UserPermission.QUOTATIONS_VIEW
  );

  const canEditQuotations = data?.permissions?.includes(
    UserPermission.QUOTATIONS_EDIT
  );

  const canCreateInvoice = data?.permissions?.includes(
    UserPermission.INVOICES_CREATE
  );

  const canDeleteQuotations = data?.permissions?.includes(
    UserPermission.QUOTATIONS_DELETE
  );

  useEffect(() => {
    if (
      !isUserLoading &&
      canViewQuotations === false &&
      hasFullAccess === false
    ) {
      router.push("/dashboard");
    }
  }, [isUserLoading, canViewQuotations, hasFullAccess, router]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/quotations/${id}`);
      setQuotation(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch quotation:", err);
      setError("Failed to load quotation");
      toast.error("Failed to load quotation details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  if (loading) {
    return <QuotationDetailLoading />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 font-medium">{error}</div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Quotation not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <QuotationHeader
        canEditQuotations={canEditQuotations}
        hasFullAccess={hasFullAccess}
        canCreateInvoice={canCreateInvoice}
        canDeleteQuotations={canDeleteQuotations}
        quotation={quotation}
        refresh={fetchQuotation}
      />

      <KeyMetrics quotation={quotation} />

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Items & Totals</TabsTrigger>
          <TabsTrigger value="details">Details & Terms</TabsTrigger>
          <TabsTrigger value="client">Client Info</TabsTrigger>
          <TabsTrigger value="quotation-preview">Quotation Preview</TabsTrigger>
          <TabsTrigger value="document-preview">Document Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <ItemsTable quotation={quotation} />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <QuotationInfoCard quotation={quotation} />
            <TermsCard quotation={quotation} />
          </div>
        </TabsContent>

        <TabsContent value="client" className="space-y-4">
          <ClientInfoCard quotation={quotation} />
        </TabsContent>

        <TabsContent value="quotation-preview" className="space-y-4">
          <QuotationPreview quotation={quotation} />
        </TabsContent>

        {/*  <TabsContent value="document-preview" className="space-y-4">
          <DocumentPreview quotation={quotation} />
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
