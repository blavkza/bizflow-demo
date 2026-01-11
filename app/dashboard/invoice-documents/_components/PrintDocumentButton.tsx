// app/dashboard/invoice-documents/_components/PrintDocumentButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { InvoiceDocumentReportGenerator } from "@/lib/invoice-document-report-generator";
import { InvoiceDocumentWithRelations } from "@/types/invoice-document";

interface PrintDocumentButtonProps {
  document: InvoiceDocumentWithRelations;
  documentType: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export function PrintDocumentButton({
  document,
  documentType,
  size = "sm",
  variant = "outline",
}: PrintDocumentButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const handlePrintDocument = async () => {
    setIsGenerating(true);
    setPrintingId(document.id);

    try {
      const documentHTML =
        InvoiceDocumentReportGenerator.generateInvoiceDocumentHTML(
          document,
          null
        );

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(documentHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }
    } catch (error) {
      console.error("Error printing document:", error);
      toast.error("Failed to generate document report");
    } finally {
      setIsGenerating(false);
      setPrintingId(null);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrintDocument}
      disabled={isGenerating}
      aria-label={`Print ${documentType}`}
    >
      <Printer
        className={`mr-2 h-4 w-4 ${isGenerating ? "animate-pulse" : ""}`}
      />
      {isGenerating ? "Generating..." : "Print"}
    </Button>
  );
}
