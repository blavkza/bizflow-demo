"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuotationForm } from "../../_components/QuotationForm";
import { QuotationWithRelations } from "@/types/quotation";
import { SkeletonInvoiceForm } from "../../../invoices/_components/SkeletonInvoiceForm";

export default function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [quotation, setQuotation] = useState<QuotationWithRelations | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await fetch(`/api/quotations/${id}`);
        if (!response.ok) throw new Error("Failed to fetch quotation");
        const data = await response.json();
        setQuotation(data);
      } catch (error) {
        toast.error("Failed to load quotation");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotation();
  }, [id]);

  const handleSubmitSuccess = () => {
    toast.success("Quotation updated successfully");
    router.push(`/dashboard/quotations/${id}`);
    router.refresh();
  };

  if (isLoading) {
    return <SkeletonInvoiceForm />;
  }

  if (!quotation) {
    return <div className="flex justify-center p-8">Quotation not found</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center gap-4 mb-6 ">
        <Button
          variant="outline"
          size="icon"
          asChild
          aria-label="Back to quotations"
        >
          <Link href={`/dashboard/quotations/${quotation.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          Update Quotation #{quotation.quotationNumber}
        </h1>
      </div>

      <div className=" overflow-hidden">
        <QuotationForm
          type="update"
          data={quotation}
          onCancel={() => router.push(`/dashboard/quotations/${id}`)}
          onSubmitSuccess={handleSubmitSuccess}
          quotationId={id}
        />
      </div>
    </div>
  );
}
