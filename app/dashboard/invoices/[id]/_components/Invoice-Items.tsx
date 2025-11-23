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
  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  // --- 1. Calculate Item Level Logic ---
  let subtotalGross = 0;
  let totalItemDiscountMoney = 0;

  const itemsWithCalculations = invoice.items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const grossAmount = quantity * unitPrice;

    // Determine item discount
    let itemDiscountVal = 0;
    const discountInput = Number(item.itemDiscountAmount || 0);

    if (item.itemDiscountType === "PERCENTAGE") {
      itemDiscountVal = grossAmount * (discountInput / 100);
    } else if (item.itemDiscountType === "AMOUNT") {
      itemDiscountVal = discountInput;
    }

    // Cap discount
    itemDiscountVal = Math.min(itemDiscountVal, grossAmount);
    const netAmount = grossAmount - itemDiscountVal;

    // Accumulate
    subtotalGross += grossAmount;
    totalItemDiscountMoney += itemDiscountVal;

    return {
      ...item,
      quantity,
      unitPrice,
      grossAmount,
      itemDiscountVal,
      discountInput,
      netAmount,
    };
  });

  // --- 2. Global Discount Logic ---
  const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscountMoney;
  const globalDiscountInput = Number(invoice.discountAmount || 0);
  let globalDiscountMoney = 0;

  if (invoice.discountType === "PERCENTAGE") {
    globalDiscountMoney =
      subtotalAfterItemDiscounts * (globalDiscountInput / 100);
  } else if (invoice.discountType === "AMOUNT") {
    globalDiscountMoney = globalDiscountInput;
  }
  globalDiscountMoney = Math.min(
    globalDiscountMoney,
    subtotalAfterItemDiscounts
  );

  // --- 3. Totals ---
  // Taxable amount is the value AFTER all discounts but BEFORE tax
  const taxableAmount = subtotalAfterItemDiscounts - globalDiscountMoney;

  // Use stored total values for final display to ensure matching DB
  const totalAmount = Number(invoice.totalAmount);
  const taxAmount = Number(invoice.taxAmount);

  // Calculate effective tax rate for display
  const effectiveTaxRate =
    taxableAmount > 0 ? (taxAmount / taxableAmount) * 100 : 0;

  // Deposit
  let depositMoney = 0;
  if (invoice.depositRequired) {
    if (invoice.depositAmount) {
      depositMoney = Number(invoice.depositAmount);
    } else if (invoice.depositType === "PERCENTAGE" && invoice.depositRate) {
      depositMoney = totalAmount * (Number(invoice.depositRate) / 100);
    }
  }

  const amountDue = totalAmount - depositMoney;

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
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-center">Tax Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsWithCalculations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div>{item.description}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.quantity.toLocaleString("en-ZA")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {item.itemDiscountVal > 0 ? (
                      <>
                        -{formatCurrency(item.itemDiscountVal)}
                        {item.itemDiscountType === "PERCENTAGE" && (
                          <span className="text-xs ml-1 text-muted-foreground">
                            ({item.discountInput}%)
                          </span>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {Number(item.taxRate) || 0}%
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Show Net Amount here (Gross - Item Discount) */}
                    {formatCurrency(item.netAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              {/* Gross Subtotal */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal (Gross):</span>
                <span>{formatCurrency(subtotalGross)}</span>
              </div>

              {/* Item Discounts */}
              {totalItemDiscountMoney > 0 && (
                <div className="flex justify-between text-red-600 text-sm">
                  <span>Item Discounts:</span>
                  <span>-{formatCurrency(totalItemDiscountMoney)}</span>
                </div>
              )}

              {/* Global Discount */}
              {globalDiscountMoney > 0 && (
                <div className="flex justify-between text-red-600 text-sm">
                  <span>
                    Global Discount
                    {invoice.discountType === "PERCENTAGE" && (
                      <span className="text-xs ml-1">
                        ({Number(invoice.discountAmount)}%)
                      </span>
                    )}
                    :
                  </span>
                  <span>-{formatCurrency(globalDiscountMoney)}</span>
                </div>
              )}

              {/* Taxable Amount (Helpful intermediate step) */}
              <div className="flex justify-between text-muted-foreground text-xs uppercase border-t pt-2 mt-2">
                <span>Taxable Amount:</span>
                <span>{formatCurrency(taxableAmount)}</span>
              </div>

              {/* Tax */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tax{" "}
                  {effectiveTaxRate > 0 && `(${effectiveTaxRate.toFixed(1)}%)`}:
                </span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>

              <Separator />

              {/* Grand Total */}
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              {/* Deposit & Due */}
              {invoice.depositRequired && depositMoney > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600 pt-1">
                    <span>Deposit Paid:</span>
                    <span>-{formatCurrency(depositMoney)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2 text-blue-600">
                    <span>Amount Due:</span>
                    <span>{formatCurrency(amountDue)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
