import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Box, FileText, AlertCircle, Calendar, User } from "lucide-react";
import { StockAwait, statusConfig } from "../types";

interface ViewDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  awaitItem: StockAwait | null;
}

export function ViewDetailsDialog({
  isOpen,
  onOpenChange,
  awaitItem,
}: ViewDetailsDialogProps) {
  if (!awaitItem) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReferenceNumber = (item: StockAwait) => {
    if (item.sale) return `Sale: ${item.sale.saleNumber}`;
    if (item.quote) return `Quote: ${item.quote.quoteNumber}`;
    return "Manual Entry";
  };

  const getCustomerName = (item: StockAwait) => {
    return item.sale?.customerName || item.quote?.customerName || "N/A";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] lg:min-w-[800px] h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Stock Await Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this stock await
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Product Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 pl-7">
              <div>
                <div className="text-sm text-muted-foreground">
                  Product Name
                </div>
                <div className="font-medium">{awaitItem.shopProduct.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">SKU</div>
                <div className="font-medium">{awaitItem.shopProduct.sku}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Current Stock
                </div>
                <div
                  className={`font-medium ${awaitItem.shopProduct.stock <= 0 ? "text-red-600" : ""}`}
                >
                  {awaitItem.shopProduct.stock} units
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Quantity Needed
                </div>
                <div className="font-medium text-yellow-600">
                  {awaitItem.quantity} units
                </div>
              </div>
            </div>
          </div>

          {/* Reference Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Reference Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 pl-7">
              <div>
                <div className="text-sm text-muted-foreground">Reference</div>
                <div className="font-medium">
                  {getReferenceNumber(awaitItem)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Customer</div>
                <div className="font-medium">{getCustomerName(awaitItem)}</div>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Status Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 pl-7">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge
                  className={
                    statusConfig[awaitItem.status as keyof typeof statusConfig]
                      .color
                  }
                >
                  {
                    statusConfig[awaitItem.status as keyof typeof statusConfig]
                      .label
                  }
                </Badge>
              </div>
              {awaitItem.resolvedBy && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Resolved By
                  </div>
                  <div className="font-medium flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {awaitItem.resolvedBy}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Timeline</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 pl-7">
              <div>
                <div className="text-sm text-muted-foreground">Created At</div>
                <div className="font-medium">
                  {formatDate(awaitItem.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Last Updated
                </div>
                <div className="font-medium">
                  {formatDate(awaitItem.updatedAt)}
                </div>
              </div>
              {awaitItem.resolvedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Resolved At
                  </div>
                  <div className="font-medium">
                    {formatDate(awaitItem.resolvedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {awaitItem.notes && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Notes</h3>
              </div>
              <div className="pl-7">
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="text-sm whitespace-pre-line">
                    {awaitItem.notes}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
