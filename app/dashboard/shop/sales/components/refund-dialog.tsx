"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sale } from "@/types/sales";

interface RefundDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
}

export function RefundDialog({
  isOpen,
  onOpenChange,
  sale,
}: RefundDialogProps) {
  const { toast } = useToast();
  const [refundItems, setRefundItems] = useState<{ [key: string]: number }>({});
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState("ORIGINAL_METHOD");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<{
    [key: string]: { name: string; sku: string };
  }>({});

  useEffect(() => {
    if (isOpen && sale) {
      // Initialize refund items with 0 quantities
      const initialRefundItems: { [key: string]: number } = {};
      sale.items.forEach((item) => {
        initialRefundItems[item.id] = 0;
      });
      setRefundItems(initialRefundItems);
      setReason("");
      setMethod("ORIGINAL_METHOD");

      // Fetch product details for the sale items
      fetchProductDetails(sale.items.map((item) => item.shopProductId));
    }
  }, [isOpen, sale]);

  const fetchProductDetails = async (productIds: string[]) => {
    if (productIds.length === 0) return;

    try {
      // Fetch product details from your API
      const response = await fetch(
        `/api/shop/products?ids=${productIds.join(",")}`
      );
      if (response.ok) {
        const data = await response.json();

        // Create a lookup object for product details
        const productMap: { [key: string]: { name: string; sku: string } } = {};
        data.data?.forEach((product: any) => {
          productMap[product.id] = {
            name: product.name,
            sku: product.sku || "N/A",
          };
        });

        setProducts(productMap);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      // If API fails, try to extract from item data
      const productMap: { [key: string]: { name: string; sku: string } } = {};
      sale?.items.forEach((item: any) => {
        // Try different possible property names
        productMap[item.shopProductId] = {
          name:
            item.ShopProduct?.name ||
            item.product?.name ||
            item.name ||
            "Product",
          sku: item.ShopProduct?.sku || item.product?.sku || item.sku || "N/A",
        };
      });
      setProducts(productMap);
    }
  };

  // Alternative: Check if product data is already included in the sale items
  const getProductName = (item: any) => {
    // Try different possible property names
    return (
      products[item.shopProductId]?.name ||
      item.ShopProduct?.name ||
      item.product?.name ||
      item.name ||
      "Product"
    );
  };

  const getProductSku = (item: any) => {
    // Try different possible property names
    return (
      products[item.shopProductId]?.sku ||
      item.ShopProduct?.sku ||
      item.product?.sku ||
      item.sku ||
      "N/A"
    );
  };

  // Helper function to safely convert to number
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    return typeof value === "number" ? value : Number(value);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const saleItem = sale?.items.find((item) => item.id === itemId);
    if (saleItem && quantity >= 0 && quantity <= saleItem.quantity) {
      setRefundItems((prev) => ({
        ...prev,
        [itemId]: quantity,
      }));
    }
  };

  const calculateRefundAmounts = () => {
    if (!sale) return { subtotal: 0, tax: 0, total: 0 };

    let subtotal = 0;
    let tax = 0;

    sale.items.forEach((item) => {
      const refundQuantity = refundItems[item.id] || 0;
      if (refundQuantity > 0) {
        const itemSubtotal = toNumber(item.price) * refundQuantity;
        const itemTax = (itemSubtotal * 0.15) / 1.15; // Assuming 15% VAT
        subtotal += itemSubtotal;
        tax += itemTax;
      }
    });

    const total = subtotal;

    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateRefundAmounts();

  const handleSubmit = async () => {
    if (!sale) return;

    // Validate at least one item is being refunded
    const hasRefundItems = Object.values(refundItems).some(
      (quantity) => quantity > 0
    );
    if (!hasRefundItems) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to refund",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for the refund",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const refundItemsData = Object.entries(refundItems)
        .filter(([_, quantity]) => quantity > 0)
        .map(([saleItemId, quantity]) => ({
          saleItemId,
          quantity,
        }));

      const response = await fetch(`/api/shop/sales/${sale.id}/refunds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: refundItemsData,
          reason,
          method,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Refund Requested",
          description: "Refund request has been submitted for approval",
        });
        onOpenChange(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error creating refund:", error);
      toast({
        title: "Refund Failed",
        description: "Failed to create refund request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sale) return null;

  // Safely convert all values to numbers
  const saleTotal = toNumber(sale.total);
  const refundedAmount = toNumber(sale.refundedAmount);
  const availableRefundAmount = saleTotal - refundedAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Process Refund
          </DialogTitle>
          <DialogDescription>
            Select items to refund from sale {sale.saleNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sale Summary */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-semibold">Sale Total:</span>
                <div className="text-lg font-bold">R{saleTotal.toFixed(2)}</div>
              </div>
              <div>
                <span className="font-semibold">Already Refunded:</span>
                <div className="text-lg">R{refundedAmount.toFixed(2)}</div>
              </div>
              <div>
                <span className="font-semibold">Available for Refund:</span>
                <div className="text-lg font-bold text-green-600">
                  R{availableRefundAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="font-semibold">This Refund:</span>
                <div className="text-lg font-bold text-orange-600">
                  R{total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Refund Items */}
          <div className="space-y-4">
            <Label>Select Items to Refund</Label>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Sold</TableHead>
                    <TableHead>Refund Qty</TableHead>
                    <TableHead>Refund Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item: any) => {
                    const refundQuantity = refundItems[item.id] || 0;
                    const itemPrice = toNumber(item.price);
                    const refundAmount = itemPrice * refundQuantity;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {getProductName(item)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {getProductSku(item)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>R{itemPrice.toFixed(2)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleQuantityChange(
                                  item.id,
                                  Math.max(0, refundQuantity - 1)
                                )
                              }
                              disabled={refundQuantity === 0}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={refundQuantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleQuantityChange(
                                  item.id,
                                  Math.min(item.quantity, refundQuantity + 1)
                                )
                              }
                              disabled={refundQuantity >= item.quantity}
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          R{refundAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Refund Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refund-reason">Refund Reason</Label>
                <Textarea
                  id="refund-reason"
                  placeholder="Enter reason for refund..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-method">Refund Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select refund method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORIGINAL_METHOD">
                      Original Payment Method
                    </SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="STORE_CREDIT">Store Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Refund Summary */}
            <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
              <h4 className="font-semibold">Refund Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%):</span>
                  <span>R{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total Refund:</span>
                  <span className="text-lg">R{total.toFixed(2)}</span>
                </div>
              </div>

              {total > availableRefundAmount && (
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center space-x-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Refund amount exceeds available balance
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || total === 0 || total > availableRefundAmount}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Request Refund
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
