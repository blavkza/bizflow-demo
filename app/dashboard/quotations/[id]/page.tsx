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
import { ConvertToInvoiceDialog } from "./_components/ConvertToInvoiceDialog";
import QuotationDetailLoading from "./_components/loading";

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

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/quotations/${id}`);
      setQuotation(response.data);
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
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Quotation not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <QuotationHeader quotation={quotation} refresh={fetchQuotation} />

      <KeyMetrics quotation={quotation} />

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="client">Client Info</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <QuotationInfoCard quotation={quotation} />
            <TermsCard quotation={quotation} />
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="border rounded-lg">
            <ItemsTable quotation={quotation} />
          </div>
        </TabsContent>

        <TabsContent value="client" className="space-y-4">
          <ClientInfoCard quotation={quotation} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
