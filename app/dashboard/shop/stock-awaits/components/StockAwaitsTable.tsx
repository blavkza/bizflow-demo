import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaginationControls } from "@/components/PaginationControls";
import {
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { StockAwait, statusConfig } from "../types";

interface StockAwaitsTableProps {
  stockAwaits: StockAwait[];
  onViewDetails: (item: StockAwait) => void;
  onResolve: (item: StockAwait) => void;
  onUpdateStatus: (id: string, status: string) => void;
  // Pagination props
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onItemsPerPageChange: (value: string) => void; // Changed from number to string
  onPageChange: (page: number) => void;
}

export function StockAwaitsTable({
  stockAwaits,
  onViewDetails,
  onResolve,
  onUpdateStatus,
  // Pagination props
  itemsPerPage,
  currentPage,
  totalPages,
  totalItems,
  onItemsPerPageChange,
  onPageChange,
}: StockAwaitsTableProps) {
  const getReferenceNumber = (awaitItem: StockAwait) => {
    if (awaitItem.sale) return `Sale: ${awaitItem.sale.saleNumber}`;
    if (awaitItem.quote) return `Quote: ${awaitItem.quote.quoteNumber}`;
    return "Manual Entry";
  };

  const getCustomerName = (awaitItem: StockAwait) => {
    return (
      awaitItem.sale?.customerName || awaitItem.quote?.customerName || "N/A"
    );
  };

  // Calculate pagination range for display
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockAwaits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No stock awaits found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              stockAwaits.map((awaitItem) => {
                const statusConfigItem =
                  statusConfig[awaitItem.status as keyof typeof statusConfig];
                const StatusIcon = statusConfigItem.icon;

                return (
                  <TableRow key={awaitItem.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {awaitItem.shopProduct.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {awaitItem.shopProduct.sku}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getReferenceNumber(awaitItem)}</TableCell>
                    <TableCell>{getCustomerName(awaitItem)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {awaitItem.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          awaitItem.shopProduct.stock <= 0
                            ? "text-red-600 font-medium"
                            : ""
                        }
                      >
                        {awaitItem.shopProduct.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfigItem.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfigItem.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(awaitItem.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onViewDetails(awaitItem)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {awaitItem.status === "PENDING" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onResolve(awaitItem)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Resolve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  onUpdateStatus(awaitItem.id, "CANCELLED")
                                }
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {stockAwaits.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalItems}</span> results
          </div>
          <PaginationControls
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onItemsPerPageChange={onItemsPerPageChange}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
