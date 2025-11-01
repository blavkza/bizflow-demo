"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface OrdersHeaderProps {
  searchTerm?: string;
  statusFilter?: string;
  paymentFilter?: string;
}

export default function OrdersHeader({
  searchTerm = "",
  statusFilter = "All",
  paymentFilter = "All",
}: OrdersHeaderProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (paymentFilter !== "All")
        params.append("paymentStatus", paymentFilter);

      const response = await fetch(`/api/shop/orders/export?${params}`);

      if (!response.ok) {
        throw new Error("Failed to export orders");
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
      let filename = `orders-export-${new Date().toISOString().split("T")[0]}.xlsx`;

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
        description: `Orders exported to ${filename}`,
      });
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export orders to Excel",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-bold tracking-tight">Orders Management</h2>
      <div className="flex items-center space-x-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/shop/pos">
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Sale
          </Link>
        </Button>
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
      </div>
    </div>
  );
}
