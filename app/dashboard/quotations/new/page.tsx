"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuotationForm } from "../_components/QuotationForm";

export default function CreateQuotationPage() {
  const router = useRouter();

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
