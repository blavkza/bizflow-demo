"use client";

import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package } from "lucide-react";
import { StockAwait } from "./types";
import { StatsCard } from "./components/StatsCard";
import { Filters } from "./components/Filters";
import { StockAwaitsTable } from "./components/StockAwaitsTable";
import { ResolveDialog } from "./components/ResolveDialog";
import { ViewDetailsDialog } from "./components/ViewDetailsDialog";
import { SalesLoadingSkeleton } from "./components/SalesLoadingSkeleton";

export default function StockAwaitsPage() {
  const { toast } = useToast();
  const [stockAwaits, setStockAwaits] = useState<StockAwait[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAwait, setSelectedAwait] = useState<StockAwait | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<StockAwait | null>(
    null
  );

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchStockAwaits();
  }, [statusFilter]);

  const fetchStockAwaits = async () => {
    try {
      setLoading(true);
      const url = `/api/shop/stock-awaits${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch stock awaits");
      }

      const data = await response.json();
      setStockAwaits(data);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error("Error fetching stock awaits:", error);
      toast({
        title: "Error",
        description: "Failed to load stock awaits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter stock awaits based on search term
  const filteredStockAwaits = useMemo(() => {
    return stockAwaits.filter((awaitItem) => {
      const matchesSearch =
        awaitItem.shopProduct.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        awaitItem.shopProduct.sku
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (awaitItem.sale?.saleNumber || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (awaitItem.quote?.quoteNumber || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [stockAwaits, searchTerm]);

  // Calculate pagination values
  const totalItems = filteredStockAwaits.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current page items
  const currentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStockAwaits.slice(startIndex, endIndex);
  }, [filteredStockAwaits, currentPage, itemsPerPage]);

  const handleOpenResolveDialog = (awaitItem: StockAwait) => {
    setSelectedAwait(awaitItem);
    setResolveDialogOpen(true);
  };

  const handleOpenViewDetails = (awaitItem: StockAwait) => {
    setSelectedDetails(awaitItem);
    setViewDetailsDialogOpen(true);
  };

  const handleResolveStockAwait = async (mode: "RECOVER" | "STOCK") => {
    if (!selectedAwait) return;

    setIsResolving(true);
    try {
      const response = await fetch(
        `/api/shop/stock-awaits/${selectedAwait.id}/resolve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode,
            updateStockMovement: mode === "STOCK",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resolve stock await");
      }

      const result = await response.json();

      toast({
        title: "Stock Await Resolved",
        description: `Stock await has been resolved using ${mode.toLowerCase()} mode. ${result.message}`,
      });

      setResolveDialogOpen(false);
      setSelectedAwait(null);
      fetchStockAwaits();
    } catch (error: any) {
      console.error("Error resolving stock await:", error);
      toast({
        title: "Resolution Failed",
        description: error.message || "Could not resolve stock await",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/shop/stock-awaits/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast({
        title: "Status Updated",
        description: `Stock await marked as ${newStatus.toLowerCase()}`,
      });

      fetchStockAwaits();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Update Failed",
        description: "Could not update stock await status",
        variant: "destructive",
      });
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (loading) {
    return <SalesLoadingSkeleton />;
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Awaits</h1>
          <p className="text-muted-foreground">
            Manage products waiting for stock arrival
          </p>
        </div>
      </div>

      <StatsCard stockAwaits={stockAwaits} />

      <Filters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <Card>
        <CardHeader>
          <CardTitle>Stock Awaits ({filteredStockAwaits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStockAwaits.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Stock Awaits Found</h3>
              <p className="text-muted-foreground">
                {statusFilter !== "ALL"
                  ? `No ${statusFilter.toLowerCase()} stock awaits found`
                  : "No stock awaits found. Create one to get started."}
              </p>
            </div>
          ) : (
            <StockAwaitsTable
              stockAwaits={currentPageItems}
              onViewDetails={handleOpenViewDetails}
              onResolve={handleOpenResolveDialog}
              onUpdateStatus={handleStatusUpdate}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onItemsPerPageChange={handleItemsPerPageChange}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>

      <ResolveDialog
        isOpen={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        awaitItem={selectedAwait}
        onResolve={handleResolveStockAwait}
        isResolving={isResolving}
      />

      <ViewDetailsDialog
        isOpen={viewDetailsDialogOpen}
        onOpenChange={setViewDetailsDialogOpen}
        awaitItem={selectedDetails}
      />
    </div>
  );
}
