"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportProductsButtonProps {
  searchTerm?: string;
  categoryFilter?: string;
  statusFilter?: string;
}

export function ExportProductsButton({
  searchTerm = "",
  categoryFilter = "All Categories",
  statusFilter = "All Status",
}: ExportProductsButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (categoryFilter !== "All Categories")
        params.append("category", categoryFilter);
      if (statusFilter !== "All Status") params.append("status", statusFilter);

      const response = await fetch(`/api/shop/products/export?${params}`);

      if (!response.ok) {
        throw new Error("Failed to export products");
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `products-export-${new Date().toISOString().split("T")[0]}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `Products exported to ${filename}`,
      });
    } catch (error) {
      console.error("Error exporting products:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export products to Excel",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExportExcel}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isExporting ? "Exporting..." : "Export Excel"}
    </Button>
  );
}
