"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Undo,
  Download,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/PaginationControls";
import { StockMovementSkeleton } from "./StockMovementSkeleton";

interface StockMovement {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  reason: string | null;
  reference: string | null;
  previousStock: number;
  newStock: number;
  createdAt: string;
  creater: string;
  shopProduct: {
    id: string;
    name: string;
    sku: string;
  };
}

interface StockMovementsHistoryProps {
  productId: string;
}

export function StockMovementsHistory({
  productId,
}: StockMovementsHistoryProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadStockMovements();
  }, [productId]);

  const loadStockMovements = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/shop/stock-movements?productId=${productId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMovements(data);
      }
    } catch (error) {
      console.error("Failed to load stock movements:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      const response = await fetch(
        `/api/shop/stock-movements/export?productId=${productId}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = `stock-movements-${productId}.xlsx`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Failed to export stock movements");
        alert("Failed to export stock movements. Please try again.");
      }
    } catch (error) {
      console.error("Error exporting stock movements:", error);
      alert("Error exporting stock movements. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "OUT":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "ADJUSTMENT":
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case "RETURN":
        return <Undo className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case "IN":
        return "bg-green-100 text-green-800 border-green-200";
      case "OUT":
        return "bg-red-100 text-red-800 border-red-200";
      case "ADJUSTMENT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RETURN":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "IN":
        return "Stock In";
      case "OUT":
        return "Stock Out";
      case "ADJUSTMENT":
        return "Adjustment";
      case "RETURN":
        return "Return";
      default:
        return type;
    }
  };

  const getReasonLabel = (reason: string | null) => {
    if (!reason) return "—";

    const reasonMap: { [key: string]: string } = {
      PURCHASE_ORDER: "Purchase Order",
      SALE: "Sale",
      STOCK_TAKE: "Stock Take",
      DAMAGED: "Damaged Goods",
      EXPIRED: "Expired Goods",
      RETURN_CUSTOMER: "Customer Return",
      RETURN_SUPPLIER: "Supplier Return",
      TRANSFER_IN: "Transfer In",
      TRANSFER_OUT: "Transfer Out",
      OTHER: "Other",
    };

    return reasonMap[reason] || reason;
  };

  // Pagination calculations
  const totalPages = Math.ceil(movements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovements = movements.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <StockMovementSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Stock History</CardTitle>
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={movements.length === 0 || exportLoading}
            className="flex items-center gap-2"
          >
            {exportLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exportLoading ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No stock movements yet
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Stock Change</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMovements.map((movement) => (
                    <TableRow key={movement.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.type)}
                          <Badge
                            variant="outline"
                            className={getMovementColor(movement.type)}
                          >
                            {getMovementLabel(movement.type)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <span
                          className={
                            movement.type === "IN" || movement.type === "RETURN"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {movement.type === "IN" || movement.type === "RETURN"
                            ? "+"
                            : "-"}
                          {movement.quantity} units
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">
                            {movement.previousStock}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span
                            className={`font-bold ${
                              movement.newStock > movement.previousStock
                                ? "text-green-600"
                                : movement.newStock < movement.previousStock
                                  ? "text-red-600"
                                  : "text-blue-600"
                            }`}
                          >
                            {movement.newStock}
                          </span>
                          <span
                            className={`text-xs ${
                              movement.newStock > movement.previousStock
                                ? "text-green-600"
                                : movement.newStock < movement.previousStock
                                  ? "text-red-600"
                                  : "text-blue-600"
                            }`}
                          >
                            (
                            {movement.newStock > movement.previousStock
                              ? "+"
                              : ""}
                            {movement.newStock - movement.previousStock})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <span className="text-sm">
                            {getReasonLabel(movement.reason)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {movement.reference || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {movement.creater || "System"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {new Date(movement.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(movement.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <PaginationControls
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onItemsPerPageChange={handleItemsPerPageChange}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
