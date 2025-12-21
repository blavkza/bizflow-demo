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

interface QuotationItem {
  id: string;
  shopProductId: string;
  quantity: number;
  price: string | number;
  total: string | number;
  shopProduct?: {
    name: string;
    sku: string;
  };
}

interface Quotation {
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  discount: number;
  discountPercent: number;
  deliveryFee: number;
  total: number;
}

interface QuotationItemsTableProps {
  quotation: Quotation;
}

export default function QuotationItemsTable({
  quotation,
}: QuotationItemsTableProps) {
  const getProductName = (item: QuotationItem) => {
    return item.shopProduct?.name || "Product";
  };

  const getProductSKU = (item: QuotationItem) => {
    return item.shopProduct?.sku || "N/A";
  };

  const getPrice = (item: QuotationItem) => {
    return typeof item.price === "string" ? parseFloat(item.price) : item.price;
  };

  const getTotal = (item: QuotationItem) => {
    return typeof item.total === "string" ? parseFloat(item.total) : item.total;
  };

  // Calculate tax and subtotal from item totals
  const calculateTotals = () => {
    const TAX_RATE = 0.15; // 15% VAT

    // Sum up all item totals
    const itemsTotal = quotation.items.reduce((sum, item) => {
      return sum + getTotal(item);
    }, 0);

    // If tax is already provided and > 0, use it
    if (quotation.tax && quotation.tax > 0) {
      return {
        subtotal: quotation.subtotal,
        tax: quotation.tax,
        itemsTotal: itemsTotal,
        taxRate: TAX_RATE,
      };
    }

    // Calculate tax from items total (before discount)
    const tax = itemsTotal * TAX_RATE;
    const subtotal = itemsTotal - tax;

    return {
      subtotal: subtotal,
      tax: tax,
      itemsTotal: itemsTotal,
      taxRate: TAX_RATE,
    };
  };

  const {
    subtotal: calculatedSubtotal,
    tax: calculatedTax,
    itemsTotal,
    taxRate,
  } = calculateTotals();

  // Calculate discount amount if applied to items total
  const discountAmount =
    quotation.discountPercent > 0
      ? itemsTotal * (quotation.discountPercent / 100)
      : quotation.discount;

  // Calculate final amounts
  const finalSubtotal = calculatedSubtotal - discountAmount;
  const netTotalBeforeDelivery = finalSubtotal + calculatedTax;
  const grandTotal = netTotalBeforeDelivery + quotation.deliveryFee;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quotation Items</CardTitle>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotation.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {getProductName(item)}
                </TableCell>
                <TableCell>{getProductSKU(item)}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  R{getPrice(item).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  R{getTotal(item).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Separator className="my-4" />

        {/* Quotation Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            {/* Items Total */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items Total:</span>
              <span>R{itemsTotal.toFixed(2)}</span>
            </div>

            {/* Discount */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount{" "}
                  {quotation.discountPercent > 0
                    ? `(${quotation.discountPercent}%)`
                    : ""}
                  :
                </span>
                <span>-R{discountAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Subtotal after discount */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>R{finalSubtotal.toFixed(2)}</span>
            </div>

            {/* VAT */}
            {calculatedTax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  VAT ({(taxRate * 100).toFixed(0)}%):
                </span>
                <span>R{calculatedTax.toFixed(2)}</span>
              </div>
            )}

            {/* Delivery Fee */}
            {quotation.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee:</span>
                <span>R{quotation.deliveryFee.toFixed(2)}</span>
              </div>
            )}

            <Separator />

            {/* Grand Total */}
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>R{quotation.total.toFixed(2)}</span>
            </div>

            {/* Tax Calculation Note */}
            {!quotation.tax || quotation.tax === 0 ? (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>Note: 15% VAT included in prices</p>
                <p>
                  R{finalSubtotal.toFixed(2)} + {calculatedTax.toFixed(2)} = R
                  {quotation.total.toFixed(2)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
