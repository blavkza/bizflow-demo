"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { PDFGenerator } from "@/lib/pdfGenerator";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { toast } from "sonner";

interface MaintenancePDFButtonProps {
  maintenance: any;
}

export function MaintenancePDFButton({
  maintenance,
}: MaintenancePDFButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { companyInfo } = useCompanyInfo();

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      if (!companyInfo) {
        toast.error(
          "Company information not available. Please wait or check settings.",
        );
        return;
      }

      await PDFGenerator.downloadMaintenancePDF(maintenance, companyInfo, {
        combineServices: true, // Default
        type: "maintenance",
      });

      toast.success("Maintenance report downloaded successfully");
    } catch (error) {
      console.error("Error downloading maintenance PDF:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 font-bold text-xs uppercase"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isDownloading ? "Generating..." : "Download PDF"}
    </Button>
  );
}
