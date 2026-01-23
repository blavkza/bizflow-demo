"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Layers, List, FileDown } from "lucide-react";
import { InvoiceProps, InvoiceStatus } from "@/types/invoice";
import { StatusBadge } from "./StatusBadge";
import { InvoiceActions } from "./InvoiceActions";
import { useRouter } from "next/navigation";
import { InvoiceReportGenerator } from "@/lib/invoiceReportGenerator";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PDFGenerator } from "@/lib/pdfGenerator";

interface HeaderProps {
  invoice: InvoiceProps;
  canDeleteInvoice: boolean;
  canEditInvoice: boolean;
  hasFullAccess: boolean;
  combineServices: boolean;
  onToggleCombineServices: (value: boolean) => void;
}

export default function Header({
  invoice,
  canDeleteInvoice,
  canEditInvoice,
  hasFullAccess,
  combineServices,
  onToggleCombineServices,
}: HeaderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isPrintingPDF, setIsPrintingPDF] = useState(false);
  const router = useRouter();
  const { companyInfo } = useCompanyInfo();

  const handlePrintInvoice = async () => {
    setIsPrintingPDF(true);
    try {
      const invoiceReportHTML =
        InvoiceReportGenerator.generateInvoiceReportHTML(
          invoice,
          companyInfo,
          combineServices
        );

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
      setIsPrintingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      if (!companyInfo) {
        toast.error("Company information not available");
        return;
      }

      await PDFGenerator.downloadInvoicePDF(invoice, companyInfo, {
        combineServices,
        type: "invoice",
      });
      toast.success("Invoice PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setIsDownloadingPDF(false);
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
        <div className="flex items-center space-x-4">
          {/* Combined Services Toggle */}
          <div className="flex items-center gap-3">
            {combineServices ? (
              <Layers className="h-4 w-4 text-muted-foreground" />
            ) : (
              <List className="h-4 w-4 text-muted-foreground" />
            )}

            <Switch
              checked={combineServices}
              onCheckedChange={onToggleCombineServices}
              id="combine-services"
            />

            <Label
              htmlFor="combine-services"
              className="hidden md:inline cursor-pointer"
            >
              {combineServices ? "Combined View" : "List View"}
            </Label>
          </div>

          <InvoiceActions
            combineServices={combineServices}
            invoice={invoice}
            isGeneratingPdf={isGenerating}
            onDownloadPdf={handleDownloadPDF}
            onPrint={handlePrintInvoice}
            canEditInvoice={canEditInvoice}
            canDeleteInvoice={canDeleteInvoice}
            hasFullAccess={hasFullAccess}
          />
        </div>
      </div>
    </div>
  );
}
