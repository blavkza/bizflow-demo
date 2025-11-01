"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { SalesHistorySkeleton } from "./SalesHistorySkeleton";

interface SaleItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
}

interface Sale {
  id: string;
  saleNumber: string;
  saleDate: string;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  paymentMethod: string;
  total: number;
  items: SaleItem[];
}

interface SalesHistoryProps {
  productId: string;
}

export function SalesHistory({ productId }: SalesHistoryProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadSalesHistory();
  }, [productId]);

  const loadSalesHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shop/products/${productId}/sales`);

      if (response.ok) {
        const data = await response.json();
        // Ensure all numeric fields are numbers
        const sanitizedSales = (data.data || []).map((sale: any) => ({
          ...sale,
          total: Number(sale.total) || 0,
          items: (sale.items || []).map((item: any) => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            price: Number(item.price) || 0,
            total: Number(item.total) || 0,
          })),
        }));
        setSales(sanitizedSales);
      } else {
        console.error("Failed to load sales history");
        setSales([]);
      }
    } catch (error) {
      console.error("Failed to load sales history:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      const response = await fetch(
        `/api/shop/products/${productId}/sales/export`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = `sales-history-${productId}.xlsx`;

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
        console.error("Failed to export sales history");
        alert("Failed to export sales history. Please try again.");
      }
    } catch (error) {
      console.error("Error exporting sales history:", error);
      alert("Error exporting sales history. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "REFUNDED":
        return "bg-red-100 text-red-800";
      case "PARTIALLY_REFUNDED":
        return "bg-orange-100 text-orange-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <TrendingUp className="h-3 w-3" />;
      case "REFUNDED":
      case "CANCELLED":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatPaymentMethod = (method: string) => {
    const methodMap: { [key: string]: string } = {
      CASH: "Cash",
      CREDIT_CARD: "Credit Card",
      DEBIT_CARD: "Debit Card",
      EFT: "EFT",
      MOBILE_PAYMENT: "Mobile Payment",
      BANK_TRANSFER: "Bank Transfer",
    };
    return methodMap[method] || method;
  };

  const calculateTotalQuantity = (sale: Sale): number => {
    return (sale.items || []).reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );
  };

  const calculateTotalRevenue = (sale: Sale): number => {
    return (sale.items || []).reduce(
      (sum, item) => sum + (Number(item.total) || 0),
      0
    );
  };

  // Safe number formatting function
  const formatCurrency = (value: number): string => {
    return `R${(Number(value) || 0).toFixed(2)}`;
  };

  // Pagination calculations
  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = sales.slice(startIndex, startIndex + itemsPerPage);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate summary statistics with safety checks
  const totalSales = sales.length;
  const totalQuantity = sales.reduce(
    (sum, sale) => sum + calculateTotalQuantity(sale),
    0
  );
  const totalRevenue = sales.reduce(
    (sum, sale) => sum + calculateTotalRevenue(sale),
    0
  );
  const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  if (loading) {
    return <SalesHistorySkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={exportToExcel}
          disabled={sales.length === 0 || exportLoading}
        >
          {exportLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {exportLoading ? "Exporting..." : "Export Excel"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">Number of sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Quantity
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity}</div>
            <p className="text-xs text-muted-foreground">Units sold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">From this product</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageSaleValue)}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales History ({sales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales found for this product
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSales.map((sale) => {
                      const quantity = calculateTotalQuantity(sale);
                      const revenue = calculateTotalRevenue(sale);
                      const unitPrice = quantity > 0 ? revenue / quantity : 0;

                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            {sale.saleNumber}
                          </TableCell>
                          <TableCell>
                            {new Date(sale.saleDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {sale.customerName || "Walk-in Customer"}
                            {sale.customerEmail && (
                              <div className="text-xs text-muted-foreground">
                                {sale.customerEmail}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {quantity}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(revenue)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(sale.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(sale.status)}
                                {sale.status.toLowerCase()}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatPaymentMethod(sale.paymentMethod)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="mt-4">
                <PaginationControls
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
