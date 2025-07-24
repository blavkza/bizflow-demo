"use client";

import { useRouter } from "next/navigation";
import InvoiceForm from "./_components/Invoice-Form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreateInvoicePage() {
  const router = useRouter();

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
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New Invoice</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <InvoiceForm
          type="create"
          onCancel={handleCancel}
          onSubmitSuccess={handleSubmitSuccess}
        />
      </div>
    </div>
  );
}
