"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SalesExportProps {
  searchTerm?: string;
  statusFilter?: string;
  paymentFilter?: string;
}

export default function SalesExport({
  searchTerm = "",
  statusFilter = "All",
  paymentFilter = "All",
}: SalesExportProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (paymentFilter !== "All")
        params.append("paymentStatus", paymentFilter);

      const response = await fetch(`/api/shop/sales/export?${params}`);

      if (!response.ok) {
        throw new Error("Failed to export sales");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      const contentDisposition = response.headers.get("content-disposition");
      let filename = `sales-export-${new Date().toISOString().split("T")[0]}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `Sales exported to ${filename}`,
      });
    } catch (error) {
      console.error("Error exporting sales:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export sales to Excel",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isExporting ? "Exporting..." : "Export Excel"}
    </Button>
  );
}
