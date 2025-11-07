"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExpensesExportProps {
  searchTerm?: string;
  statusFilter?: string;
  categoryFilter?: string;
  vendorFilter?: string;
}

export default function ExpensesExport({
  searchTerm = "",
  statusFilter = "all",
  categoryFilter = "all",
  vendorFilter = "all",
}: ExpensesExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (vendorFilter !== "all") params.append("vendor", vendorFilter);

      const response = await fetch(`/api/expenses/export?${params}`);

      if (!response.ok) {
        throw new Error("Failed to export expenses");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      const contentDisposition = response.headers.get("content-disposition");
      let filename = `expenses-export-${new Date().toISOString().split("T")[0]}.xlsx`;

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

      toast.success(`Expenses exported to ${filename}`);
    } catch (error) {
      console.error("Error exporting expenses:", error);
      toast.error("Failed to export expenses to Excel");
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
