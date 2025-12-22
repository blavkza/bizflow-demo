import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Package, RefreshCw } from "lucide-react";
import { StockAwait } from "../types";

interface ResolveDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  awaitItem: StockAwait | null;
  onResolve: (mode: "RECOVER" | "STOCK") => Promise<void>;
  isResolving: boolean;
}

export function ResolveDialog({
  isOpen,
  onOpenChange,
  awaitItem,
  onResolve,
  isResolving,
}: ResolveDialogProps) {
  const [resolveMode, setResolveMode] = useState<"RECOVER" | "STOCK">(
    "RECOVER"
  );

  if (!awaitItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] lg:min-w-[800px] h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Resolve Stock Await
          </DialogTitle>
          <DialogDescription>
            How would you like to resolve this stock await?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stock Await Info */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold mb-2">Stock Await Details</h4>
            <div className="text-sm space-y-1">
              <div>
                <strong>Product:</strong> {awaitItem.shopProduct.name}
              </div>
              <div>
                <strong>SKU:</strong> {awaitItem.shopProduct.sku}
              </div>
              <div>
                <strong>Quantity:</strong> {awaitItem.quantity} units
              </div>
              <div>
                <strong>Current Stock:</strong> {awaitItem.shopProduct.stock}{" "}
                units
              </div>
              {awaitItem.sale && (
                <div>
                  <strong>Related Sale:</strong> {awaitItem.sale.saleNumber}
                </div>
              )}
            </div>
          </div>

          {/* Resolution Mode Selection */}
          <div className="space-y-3">
            <Label>Resolution Mode</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  id="recover-mode"
                  name="resolve-mode"
                  value="RECOVER"
                  checked={resolveMode === "RECOVER"}
                  onChange={(e) =>
                    setResolveMode(e.target.value as "RECOVER" | "STOCK")
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="recover-mode" className="flex-1 cursor-pointer">
                  <div className="font-medium">Recover Mode</div>
                  <div className="text-sm text-muted-foreground">
                    • Mark as resolved without updating stock • Update sale
                    status if all awaits are resolved • Use when stock is
                    already accounted for
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  id="stock-mode"
                  name="resolve-mode"
                  value="STOCK"
                  checked={resolveMode === "STOCK"}
                  onChange={(e) =>
                    setResolveMode(e.target.value as "RECOVER" | "STOCK")
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="stock-mode" className="flex-1 cursor-pointer">
                  <div className="font-medium">Stock Update Mode</div>
                  <div className="text-sm text-muted-foreground">
                    • Add {awaitItem.quantity} units to product stock • Create
                    stock movement record • Update sale status if all awaits are
                    resolved
                  </div>
                </Label>
              </div>
            </div>
          </div>

          {/* Resolution Preview */}
          <div
            className={`p-4 rounded-lg border ${
              resolveMode === "RECOVER"
                ? "bg-blue-50 border-blue-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <h4
              className={`font-semibold mb-2 ${
                resolveMode === "RECOVER" ? "text-blue-900" : "text-green-900"
              }`}
            >
              What will happen:
            </h4>
            <ul
              className={`text-sm space-y-1 ${
                resolveMode === "RECOVER" ? "text-blue-700" : "text-green-700"
              }`}
            >
              <li>• Stock await will be marked as RESOLVED</li>
              <li>• Resolved by and timestamp will be recorded</li>
              {resolveMode === "STOCK" && (
                <li>
                  • Product stock will increase by {awaitItem.quantity} units
                </li>
              )}
              <li>
                • Stock movement record will{" "}
                {resolveMode === "STOCK" ? "be created" : "NOT be created"}
              </li>
              {awaitItem.sale && (
                <>
                  <li>
                    • Sale {awaitItem.sale.saleNumber} status will be checked
                  </li>
                  <li>
                    • If no more pending awaits, sale status will update to
                    COMPLETED
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onResolve(resolveMode)}
            disabled={isResolving}
            className={`w-full sm:w-auto ${
              resolveMode === "RECOVER"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isResolving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resolving...
              </>
            ) : (
              <>
                {resolveMode === "RECOVER" ? (
                  <RefreshCw className="h-4 w-4 mr-2" />
                ) : (
                  <Package className="h-4 w-4 mr-2" />
                )}
                Resolve {resolveMode === "RECOVER" ? "Recover" : "Update Stock"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
