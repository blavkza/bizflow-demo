"use client";

import Header from "./_components/Header";
import InvoiceHeader from "./_components/Invoice-Hesder";
import NoteTermsCard from "./_components/NoteTerms-Card";
import InvoiceItems from "./_components/Invoice-Items";
import InvoiceSummary from "./_components/Invoice-Summury";
import InvoicePayments from "./_components/Invoice-Payments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoicePreview } from "./_components/InvoicePreview";

import { UserPermission, UserRole } from "@prisma/client";
import { useEffect, useState, use } from "react";
import { InvoiceProps } from "@/types/invoice";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Loader from "./_components/Loader";

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

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { userId } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceProps | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [combineServices, setCombineServices] = useState(true);

  const unwrappedParams = use(params);
  const invoiceId = unwrappedParams.id;

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
  const canEditInvoice = data?.permissions?.includes(
    UserPermission.INVOICES_EDIT
  );
  const canDeleteInvoice = data?.permissions?.includes(
    UserPermission.INVOICES_DELETE
  );

  useEffect(() => {
    if (!isLoading && canViewInvoices === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewInvoices, hasFullAccess, router]);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoadingInvoice(true);
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`);
        if (!response.ok) throw new Error("Failed to fetch invoice");
        const data = await response.json();
        setInvoice(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInvoice(false);
      }
    };
    if (invoiceId) fetchInvoice();
  }, [invoiceId]);

  const handleToggleCombineServices = (value: boolean) => {
    setCombineServices(value);
  };

  if (isLoading || loadingInvoice) return <Loader />;
  if (!canViewInvoices && !hasFullAccess) return null;
  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <Header
        invoice={invoice}
        canEditInvoice={canEditInvoice}
        canDeleteInvoice={canDeleteInvoice}
        hasFullAccess={hasFullAccess}
        combineServices={combineServices}
        onToggleCombineServices={handleToggleCombineServices}
      />

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details & Items</TabsTrigger>
          <TabsTrigger value="preview">Preview PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6">
            <InvoiceHeader invoice={invoice} />
            <InvoiceItems invoice={invoice} combineServices={combineServices} />
            <InvoicePayments invoice={invoice} />
            <NoteTermsCard
              notes={invoice.note}
              terms={invoice.terms}
              paymentTerms={invoice.paymentTerms}
            />
            <InvoiceSummary invoice={invoice} />
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <InvoicePreview invoice={invoice} combineServices={combineServices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
