"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  MinusCircle,
} from "lucide-react";

interface SaleItem {
  id: string;
  shopProductId: string;
  quantity: number;
  price: number;
  total: number;
  hadNegativeStock?: boolean;
  awaitedQuantity?: number;
  ShopProduct?: {
    name: string;
    sku: string;
    stock?: number;
    status?: string;
  };
  stockInfo?: {
    hadNegativeStock: boolean;
    awaitedQuantity: number;
    stockStatus: string;
    currentStock: number;
    needsStock: boolean;
  };
}

interface Sale {
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  discountPercent: number;
  total: number;
  refundedAmount?: number;
  status: string;
  awaitingStockCount?: number;
  awaitingStockProducts?: number;
  deliveryFee?: number;
}

interface SaleItemsTableProps {
  sale: Sale;
}

export default function SaleItemsTable({ sale }: SaleItemsTableProps) {
  console.log("SaleItemsTable - Received sale:", sale);
  console.log("SaleItemsTable - Items:", sale.items);

  // Helper function to safely convert to number
  const toNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;
    return 0;
  };

  // Calculate items total (sum of all item totals) - THIS INCLUDES TAX
  const calculateItemsTotal = (): number => {
    if (!sale.items || !Array.isArray(sale.items)) return 0;

    return sale.items.reduce((sum, item) => {
      const itemTotal = toNumber(item.total);
      return sum + itemTotal;
    }, 0);
  };

  const itemsTotal = calculateItemsTotal(); // This total INCLUDES 15% VAT

  // Calculate correct totals when tax is NOT provided (prices include VAT)
  const calculateTotals = () => {
    const TAX_RATE = 0.15; // 15% VAT

    // Safely convert all values to numbers
    const safeDiscount = toNumber(sale.discount);
    const safeTax = toNumber(sale.tax);
    const safeDeliveryFee = toNumber(sale.deliveryFee);

    // If tax IS PROVIDED and > 0, use the provided values
    if (safeTax > 0) {
      // Calculate subtotal from items total minus discount
      const subtotal = itemsTotal - safeDiscount;
      return {
        itemsTotal: itemsTotal,
        subtotal: subtotal, // This is before discount, includes tax
        tax: safeTax,
        taxRate: TAX_RATE,
        netSubtotal: subtotal - safeTax, // Calculate net before tax
        deliveryFee: safeDeliveryFee,
      };
    }

    // TAX IS NOT PROVIDED - Prices already include 15% VAT
    // We need to extract the VAT from the items total
    const itemsTotalBeforeTax = itemsTotal / (1 + TAX_RATE);
    const taxAmount = itemsTotal - itemsTotalBeforeTax;

    // Apply discount to items total (which includes VAT)
    const itemsTotalAfterDiscount = itemsTotal - safeDiscount;

    // Recalculate subtotal after discount
    const subtotalAfterDiscount = itemsTotalAfterDiscount / (1 + TAX_RATE);
    const taxAfterDiscount = itemsTotalAfterDiscount - subtotalAfterDiscount;

    // Calculate final totals including delivery
    const finalSubtotal = subtotalAfterDiscount;
    const finalTax = taxAfterDiscount;
    const finalTotal = itemsTotalAfterDiscount + safeDeliveryFee;

    return {
      itemsTotal: itemsTotal,
      subtotal: finalSubtotal,
      tax: finalTax,
      taxRate: TAX_RATE,
      netSubtotal: finalSubtotal, // This is already before tax
      deliveryFee: safeDeliveryFee,
      calculatedTotal: finalTotal,
    };
  };

  const {
    subtotal: calculatedSubtotal,
    tax: calculatedTax,
    taxRate,
    deliveryFee: calculatedDeliveryFee,
    calculatedTotal,
  } = calculateTotals();

  // Format numbers safely
  const formatCurrency = (value: number): string => {
    return `R${value.toFixed(2)}`;
  };

  // Fallback function to get product name
  const getProductName = (item: SaleItem) => {
    if (item.ShopProduct?.name) {
      return item.ShopProduct.name;
    }

    // Fallback: Return a default with product ID
    return `Product (${item.shopProductId.substring(0, 8)}...)`;
  };

  const getProductSKU = (item: SaleItem) => {
    return item.ShopProduct?.sku || "N/A";
  };

  // Get current stock - fallback logic
  const getCurrentStock = (item: SaleItem) => {
    if (item.stockInfo?.currentStock !== undefined) {
      return toNumber(item.stockInfo.currentStock);
    }
    if (item.ShopProduct?.stock !== undefined) {
      return toNumber(item.ShopProduct.stock);
    }
    return 0;
  };

  // Get awaited quantity
  const getAwaitedQuantity = (item: SaleItem) => {
    if (item.stockInfo?.awaitedQuantity !== undefined) {
      return toNumber(item.stockInfo.awaitedQuantity);
    }
    return toNumber(item.awaitedQuantity);
  };

  // Get stock status with fallbacks
  const getStockStatus = (item: SaleItem) => {
    // Use stockInfo if available
    if (item.stockInfo?.stockStatus) {
      return item.stockInfo.stockStatus;
    }

    // Calculate based on available data
    const currentStock = getCurrentStock(item);
    const awaitedQuantity = getAwaitedQuantity(item);
    const hadNegativeStock = item.hadNegativeStock || false;

    if (hadNegativeStock || awaitedQuantity > 0) {
      return "AWAITING_STOCK";
    } else if (currentStock < 0) {
      return "NEGATIVE_STOCK";
    } else if (currentStock === 0) {
      return "OUT_OF_STOCK";
    }

    return "AVAILABLE";
  };

  // Get stock status badge
  const getStockStatusBadge = (item: SaleItem) => {
    const stockStatus = getStockStatus(item);

    switch (stockStatus) {
      case "AWAITING_STOCK":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Awaiting Stock
          </Badge>
        );
      case "NEGATIVE_STOCK":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <MinusCircle className="h-3 w-3 mr-1" />
            Negative Stock
          </Badge>
        );
      case "OUT_OF_STOCK":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Out of Stock
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </Badge>
        );
    }
  };

  // Safely get item price and total
  const getItemPrice = (item: SaleItem) => {
    return toNumber(item.price);
  };

  const getItemTotal = (item: SaleItem) => {
    return toNumber(item.total);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sale Items ({sale.items?.length || 0})</CardTitle>
          {sale.status === "AWAITING_STOCK" && (
            <Badge
              variant="outline"
              className="bg-yellow-50 text-yellow-700 border-yellow-200"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {sale.awaitingStockCount
                ? `Awaiting ${sale.awaitingStockCount} units`
                : "Awaiting Stock"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Stock Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sale.items || []).map((item) => {
              const awaitedQuantity = getAwaitedQuantity(item);

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getProductName(item)}
                    </div>
                    {awaitedQuantity > 0 && (
                      <div className="text-xs text-yellow-600">
                        ({awaitedQuantity} awaiting)
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getProductSKU(item)}</TableCell>
                  <TableCell className="text-right">
                    <div>{item.quantity}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(getItemPrice(item))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(getItemTotal(item))}
                  </TableCell>
                  <TableCell className="text-right">
                    {getStockStatusBadge(item)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Separator className="my-4" />

        {/* Negative Stock Warning */}
        {(sale.items || []).some((item) => getCurrentStock(item) < 0) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <h4 className="font-medium text-red-800">Negative Stock Alert</h4>
            </div>
            <p className="text-sm text-red-700">
              Some products have negative stock levels. Please replenish stock
              immediately.
            </p>
            <div className="mt-2 space-y-1">
              {(sale.items || [])
                .filter((item) => getCurrentStock(item) < 0)
                .map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{getProductName(item)}</span>
                    <span className="font-medium text-red-700">
                      Stock: {getCurrentStock(item)} units
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Sale Totals - In correct order */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            {/* Items Total (includes VAT) */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Items Total (incl. VAT):
              </span>
              <span>{formatCurrency(itemsTotal)}</span>
            </div>

            {/* Discount */}
            {toNumber(sale.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({toNumber(sale.discountPercent)}%):</span>
                <span>-{formatCurrency(toNumber(sale.discount))}</span>
              </div>
            )}

            {/* Items Total after discount (still includes VAT) */}
            {toNumber(sale.discount) > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Items after discount:</span>
                <span>
                  {formatCurrency(itemsTotal - toNumber(sale.discount))}
                </span>
              </div>
            )}

            <Separator />

            {/* Subtotal (before tax) */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal (before VAT):
              </span>
              <span>{formatCurrency(calculatedSubtotal)}</span>
            </div>

            {/* VAT (15%) */}
            {calculatedTax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  VAT ({(taxRate * 100).toFixed(0)}%):
                </span>
                <span>{formatCurrency(calculatedTax)}</span>
              </div>
            )}

            {/* Delivery Fee */}
            {calculatedDeliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee:</span>
                <span>{formatCurrency(calculatedDeliveryFee)}</span>
              </div>
            )}

            <Separator />

            {/* Grand Total */}
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>
                {formatCurrency(calculatedTotal || toNumber(sale.total))}
              </span>
            </div>

            {/* Refunded Amount */}
            {toNumber(sale.refundedAmount) > 0 && (
              <>
                <Separator />
                <div className="flex justify-between text-red-600">
                  <span>Refunded:</span>
                  <span>-{formatCurrency(toNumber(sale.refundedAmount))}</span>
                </div>
              </>
            )}

            {/* Tax Calculation Note - Show when tax is calculated */}
            {toNumber(sale.tax) === 0 && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>Note: 15% VAT included in item prices</p>
                <p>
                  Calculation:{" "}
                  {formatCurrency(itemsTotal - toNumber(sale.discount))} ÷ 1.15
                  = {formatCurrency(calculatedSubtotal)}
                </p>
                <p>
                  VAT: {formatCurrency(itemsTotal - toNumber(sale.discount))} -{" "}
                  {formatCurrency(calculatedSubtotal)} ={" "}
                  {formatCurrency(calculatedTax)}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
