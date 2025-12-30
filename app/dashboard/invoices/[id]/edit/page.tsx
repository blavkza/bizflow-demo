"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { use, useEffect, useState } from "react";
import { Invoice, Client, InvoiceItem, GeneralSetting } from "@prisma/client";
import InvoiceForm from "../../new/_components/Invoice-Form";
import { SkeletonInvoiceForm } from "../../_components/SkeletonInvoiceForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface InvoiceWithRelations extends Invoice {
  client: Client;
  items: InvoiceItem[];
  creator: {
    name: string;
    GeneralSetting: GeneralSetting | null;
  };
}

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceWithRelations | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  console.log(invoiceData);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${id}`);
        if (!response.ok) throw new Error("Failed to fetch invoice");
        const data = await response.json();
        setInvoiceData(data);
      } catch (error) {
        toast.error("Failed to load invoice");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleSubmitSuccess = () => {
    toast.success("Invoice updated successfully");
    router.push(`/dashboard/invoices/${id}`);
    router.refresh();
  };

  if (isLoading) {
    return <SkeletonInvoiceForm />;
  }

  if (!invoiceData) {
    return <div className="flex justify-center p-8">Invoice not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          aria-label="Back to invoices"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          Edit Invoice #{invoiceData.invoiceNumber}
        </h1>
      </div>

      <div className="  overflow-hidden">
        <InvoiceForm
          type="update"
          data={{ invoice: invoiceData }}
          onCancel={() => router.push(`/dashboard/invoices/${id}`)}
          onSubmitSuccess={handleSubmitSuccess}
        />
      </div>
    </div>
  );
}
