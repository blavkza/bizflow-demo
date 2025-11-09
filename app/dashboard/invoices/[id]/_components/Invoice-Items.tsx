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
import { InvoiceProps } from "@/types/invoice";
import { DiscountType } from "@prisma/client";

interface InvoiceItemsProps {
  invoice: InvoiceProps;
}

export default function InvoiceItems({ invoice }: InvoiceItemsProps) {
  const calculateDiscountAmount = () => {
    if (!invoice.discountAmount) return 0;

    if (invoice.discountType === DiscountType.PERCENTAGE) {
      return (invoice.amount * invoice.discountAmount) / 100;
    } else {
      return invoice.discountAmount;
    }
  };

  const discountAmount = calculateDiscountAmount();

  // Calculate the actual tax rate percentage from taxAmount and subtotal
  const getActualTaxRate = () => {
    if (!invoice.taxAmount || !invoice.amount || invoice.amount === 0) {
      return 0;
    }

    // Calculate tax rate: (taxAmount / subtotal) * 100
    const calculatedRate = (invoice.taxAmount / invoice.amount) * 100;
    return Math.round(calculatedRate * 10) / 10; // Round to 1 decimal place
  };

  const actualTaxRate = getActualTaxRate();

  // Safe function to display item tax rate
  const getItemTaxRateDisplay = (taxRate: any) => {
    if (!taxRate) return "0%";

    const rate = Number(taxRate);
    if (isNaN(rate)) return "0%";

    // If tax rate is less than 1, it's likely stored as decimal (0.15 = 15%)
    if (rate < 1 && rate > 0) {
      return `${(rate * 100).toFixed(1)}%`;
    }

    // If tax rate is 1 or greater, it's likely stored as percentage
    return `${rate.toFixed(1)}%`;
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Tax Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-right">
                    {parseFloat(item.quantity.toString())}
                  </TableCell>
                  <TableCell className="text-right">
                    R{parseFloat(item.unitPrice.toString()).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {getItemTaxRateDisplay(item.taxRate)}
                  </TableCell>
                  <TableCell className="text-right">
                    R{parseFloat(item.amount.toString()).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>R{invoice.amount.toLocaleString()}</span>
              </div>

              {/* Tax Row with calculated percentage */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tax {actualTaxRate > 0 && `(${actualTaxRate}%)`}:
                </span>
                <span>R{invoice.taxAmount.toLocaleString()}</span>
              </div>

              {/* Discount Row */}
              {invoice.discountAmount && invoice.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span className="text-muted-foreground">
                    Discount
                    {invoice.discountType === DiscountType.PERCENTAGE &&
                      invoice.discountAmount &&
                      ` (${invoice.discountAmount}%)`}
                    :
                  </span>
                  <span>-R{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>R{invoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
