"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { InvoiceProps, InvoiceStatus } from "@/types/invoice";
import { StatusBadge } from "./StatusBadge";
import { InvoiceActions } from "./InvoiceActions";
import { useRouter } from "next/navigation";
import { InvoiceReportGenerator } from "@/lib/invoiceReportGenerator";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { toast } from "sonner";

interface HeaderProps {
  invoice: InvoiceProps;
  canDeleteInvoice: boolean;
  canEditInvoice: boolean;
  hasFullAccess: boolean;
}

export default function Header({
  invoice,
  canDeleteInvoice,
  canEditInvoice,
  hasFullAccess,
}: HeaderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { companyInfo } = useCompanyInfo();

  const handlePrintInvoice = async () => {
    setIsGenerating(true);
    try {
      const invoiceReportHTML =
        InvoiceReportGenerator.generateInvoiceReportHTML(invoice, companyInfo);

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(invoiceReportHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        // Optional: Close the window after printing
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Failed to generate invoice report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <StatusBadge status={invoice.status as InvoiceStatus} />
              <span className="text-sm text-muted-foreground">
                Created on {new Date(invoice.issueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintInvoice}
            disabled={isGenerating}
            aria-label="Print invoice"
          >
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Print"}
          </Button>
          <InvoiceActions
            invoice={invoice}
            isGeneratingPdf={isGenerating}
            onDownloadPdf={handlePrintInvoice}
            canEditInvoice={canEditInvoice}
            canDeleteInvoice={canDeleteInvoice}
            hasFullAccess={hasFullAccess}
          />
        </div>
      </div>
    </div>
  );
}
