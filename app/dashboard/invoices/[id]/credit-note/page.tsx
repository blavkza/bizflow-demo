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

export default function CreditNotePage({
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

  // Function to create credit note from modified items

  const handleSubmitSuccess = () => {};

  const handleCancel = () => {
    router.push(`/dashboard/invoices/${id}`);
  };

  if (isLoading) {
    return <SkeletonInvoiceForm />;
  }

  if (!invoiceData) {
    return <div className="flex justify-center p-8">Invoice not found</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={handleCancel}
          aria-label="Back to invoices"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Create Credit Note for Invoice #{invoiceData.invoiceNumber}
          </h1>
          <p className="text-muted-foreground mt-1">
            Modify items to create a credit note
          </p>
        </div>
      </div>

      <div className="overflow-hidden">
        <InvoiceForm
          type="creditNote"
          data={{ invoice: invoiceData }}
          onCancel={handleCancel}
          onSubmitSuccess={handleSubmitSuccess}
        />
      </div>
    </div>
  );
}
