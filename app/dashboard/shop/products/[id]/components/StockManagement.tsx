"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Undo,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface StockManagementProps {
  product: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    minStock: number;
  };
  onStockUpdate: (productId?: string) => void;
}

export function StockManagement({
  product,
  onStockUpdate,
}: StockManagementProps) {
  const [type, setType] = useState<"IN" | "OUT" | "ADJUSTMENT" | "RETURN">(
    "IN"
  );
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        toast.error("Please enter a valid quantity");
        return;
      }

      if (type === "OUT" && product.stock - quantityNum < 0) {
        toast.error("Insufficient stock for this operation");
        return;
      }

      if (type === "ADJUSTMENT" && quantityNum < 0) {
        toast.error("Stock cannot be adjusted to a negative value");
        return;
      }

      const response = await fetch("/api/shop/stock-movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          type,
          quantity: quantityNum,
          reason: reason || undefined,
          reference: reference || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Stock updated successfully");
        setQuantity("");
        setReason("");
        setReference("");
        // Call onStockUpdate with the product ID
        onStockUpdate(product.id);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update stock");
      }
    } catch (error) {
      toast.error("Failed to update stock");
      console.error("Stock movement error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your StockManagement component code remains the same
  const getMovementIcon = () => {
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

  const getMovementDescription = () => {
    switch (type) {
      case "IN":
        return "Add stock to inventory";
      case "OUT":
        return "Remove stock from inventory";
      case "ADJUSTMENT":
        return "Set stock to specific quantity";
      case "RETURN":
        return "Return stock to inventory";
      default:
        return "Manage stock levels";
    }
  };

  const calculateNewStock = () => {
    const quantityNum = parseInt(quantity) || 0;
    switch (type) {
      case "IN":
        return product.stock + quantityNum;
      case "OUT":
        return product.stock - quantityNum;
      case "ADJUSTMENT":
        return quantityNum;
      case "RETURN":
        return product.stock + quantityNum;
      default:
        return product.stock;
    }
  };

  const getStockChangeColor = () => {
    const newStock = calculateNewStock();
    if (type === "OUT" && newStock < product.minStock) {
      return "text-red-600";
    }
    if (newStock <= product.minStock) {
      return "text-yellow-600";
    }
    return "text-green-600";
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Package className="h-5 w-5" />
          Stock Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Stock Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border">
                <Label className="text-sm text-blue-600">Current Stock</Label>
                <div className="text-2xl font-bold text-blue-700">
                  {product.stock}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <Label className="text-sm text-gray-600">Minimum Stock</Label>
                <div className="text-lg font-semibold">{product.minStock}</div>
              </div>
            </div>

            {product.stock <= product.minStock && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Stock is at or below minimum threshold
                </p>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg border">
              <Label className="text-sm font-medium">Quick Actions</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setType("IN");
                    setQuantity("10");
                    setReason("Restocking");
                  }}
                >
                  Quick Restock
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setType("ADJUSTMENT");
                    setQuantity(product.minStock.toString());
                    setReason("Stock correction to minimum");
                  }}
                >
                  Set to Minimum
                </Button>
              </div>
            </div>
          </div>

          {/* Stock Movement Form */}
          <form onSubmit={handleStockMovement} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Movement Type</Label>
              <Select
                value={type}
                onValueChange={(
                  value: "IN" | "OUT" | "ADJUSTMENT" | "RETURN"
                ) => setType(value)}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    {getMovementIcon()}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Stock In
                    </div>
                  </SelectItem>
                  <SelectItem value="OUT">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Stock Out
                    </div>
                  </SelectItem>
                  <SelectItem value="ADJUSTMENT">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                      Stock Adjustment
                    </div>
                  </SelectItem>
                  <SelectItem value="RETURN">
                    <div className="flex items-center gap-2">
                      <Undo className="h-4 w-4 text-orange-600" />
                      Return Stock
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getMovementDescription()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity {type === "ADJUSTMENT" ? "(New Stock Level)" : ""}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={
                  type === "ADJUSTMENT"
                    ? "Enter new stock level"
                    : "Enter quantity"
                }
                required
              />
            </div>

            {quantity && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <Label>Stock Preview</Label>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">{product.stock}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className={`font-bold ${getStockChangeColor()}`}>
                    {calculateNewStock()}
                  </span>
                </div>
                {calculateNewStock() <= product.minStock && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Will be at or below minimum stock level
                  </p>
                )}
                {type === "OUT" && calculateNewStock() < 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ❌ Insufficient stock for this operation
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., New shipment, Customer order, Inventory count"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., Order #12345, PO #67890"
              />
            </div>

            <Button
              type="submit"
              disabled={
                loading ||
                !quantity ||
                (type === "OUT" && calculateNewStock() < 0)
              }
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Updating Stock..." : "Update Stock"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
