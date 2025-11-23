"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuotationWithRelations } from "@/types/quotation";

export const ItemsTable = ({
  quotation,
}: {
  quotation: QuotationWithRelations;
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  // --- 1. Calculate Item Level Logic (Pass 1) ---
  let subtotalGross = 0;
  let totalItemDiscountMoney = 0;

  const itemsWithCalculations = quotation.items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const grossAmount = quantity * unitPrice;

    // Get the input value (Percentage or Amount)
    const discountInputVal = Number(item.itemDiscountAmount || 0);

    // Calculate actual money deducted based on type
    let itemDiscountVal = 0;
    if (item.itemDiscountType === "PERCENTAGE") {
      itemDiscountVal = grossAmount * (discountInputVal / 100);
    } else if (item.itemDiscountType === "AMOUNT") {
      itemDiscountVal = discountInputVal;
    }

    // Cap discount
    itemDiscountVal = Math.min(itemDiscountVal, grossAmount);

    const netAmount = grossAmount - itemDiscountVal;

    // Accumulate totals
    subtotalGross += grossAmount;
    totalItemDiscountMoney += itemDiscountVal;

    return {
      ...item,
      grossAmount,
      itemDiscountVal, // Actual money deducted
      discountInputVal, // The % or R value typed
      netAmount,
    };
  });

  // --- 2. Calculate Global Discount (Pass 2) ---
  const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscountMoney;
  const globalDiscountInputVal = Number(quotation.discountAmount || 0);

  let globalDiscountMoney = 0;
  if (quotation.discountType === "PERCENTAGE") {
    globalDiscountMoney =
      subtotalAfterItemDiscounts * (globalDiscountInputVal / 100);
  } else if (quotation.discountType === "AMOUNT") {
    globalDiscountMoney = globalDiscountInputVal;
  }

  globalDiscountMoney = Math.min(
    globalDiscountMoney,
    subtotalAfterItemDiscounts
  );

  // --- 3. Final Calculations ---
  const taxableAmount = subtotalAfterItemDiscounts - globalDiscountMoney;

  // Note: We use the stored tax amount from the DB because rounding differences
  // might occur if we recalculate it here on the fly without the exact same logic.
  const totalTax = Number(quotation.taxAmount || 0);

  const totalAmount = taxableAmount + totalTax;

  // Recalculate deposit to show it correctly based on total
  let depositMoney = 0;
  if (quotation.depositRequired) {
    // Check if we have a specific stored amount, otherwise calculate it
    if (quotation.depositAmount) {
      depositMoney = Number(quotation.depositAmount);
    } else if (
      quotation.depositType === "PERCENTAGE" &&
      quotation.depositRate
    ) {
      depositMoney = totalAmount * (Number(quotation.depositRate) / 100);
    }
  }

  const amountDue = totalAmount - depositMoney;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[40%]">Description</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Discount</TableHead>
            <TableHead className="text-center">Tax</TableHead>
            <TableHead className="text-right">Line Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itemsWithCalculations.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div>{item.description}</div>
              </TableCell>
              <TableCell className="text-center">
                {Number(item.quantity).toLocaleString("en-ZA")}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(Number(item.unitPrice))}
              </TableCell>
              <TableCell className="text-right text-red-600">
                {item.itemDiscountVal > 0 ? (
                  <>
                    -{formatCurrency(item.itemDiscountVal)}
                    {item.itemDiscountType === "PERCENTAGE" && (
                      <span className="text-xs ml-1 text-muted-foreground">
                        ({item.discountInputVal}%)
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
              <TableCell className="text-right font-medium">
                {/* We usually show the Net Amount (Gross - Item Disc) here. 
                    Global discount is deducted at the bottom. */}
                {formatCurrency(item.netAmount)}
              </TableCell>
            </TableRow>
          ))}

          {/* --- SUMMARY SECTION --- */}

          {/* 1. Gross Subtotal */}
          <TableRow className="border-t-2">
            <TableCell colSpan={4}></TableCell>
            <TableCell className="text-right font-medium text-muted-foreground">
              Subtotal (Gross)
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(subtotalGross)}
            </TableCell>
          </TableRow>

          {/* 2. Item Discounts */}
          {totalItemDiscountMoney > 0 && (
            <TableRow className="border-0">
              <TableCell colSpan={4}></TableCell>
              <TableCell className="text-right text-muted-foreground">
                Item Discounts
              </TableCell>
              <TableCell className="text-right text-red-600">
                -{formatCurrency(totalItemDiscountMoney)}
              </TableCell>
            </TableRow>
          )}

          {/* 3. Global Discount */}
          {globalDiscountMoney > 0 && (
            <TableRow className="border-0">
              <TableCell colSpan={4}></TableCell>
              <TableCell className="text-right text-muted-foreground">
                Global Discount
                {quotation.discountType === "PERCENTAGE" && (
                  <span className="text-xs ml-1">
                    ({globalDiscountInputVal}%)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right text-red-600">
                -{formatCurrency(globalDiscountMoney)}
              </TableCell>
            </TableRow>
          )}

          {/* 4. Taxable Amount (Optional but helpful) */}
          <TableRow className="border-0">
            <TableCell colSpan={4}></TableCell>
            <TableCell className="text-right text-muted-foreground text-xs uppercase tracking-wide">
              Taxable Amount
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {formatCurrency(taxableAmount)}
            </TableCell>
          </TableRow>

          {/* 5. Tax */}
          <TableRow className="border-0">
            <TableCell colSpan={4}></TableCell>
            <TableCell className="text-right text-muted-foreground">
              Tax
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {formatCurrency(totalTax)}
            </TableCell>
          </TableRow>

          {/* 6. Grand Total */}
          <TableRow className="border-t">
            <TableCell colSpan={4}></TableCell>
            <TableCell className="text-right font-bold text-base">
              Total
            </TableCell>
            <TableCell className="text-right font-bold text-base text-primary">
              {formatCurrency(totalAmount)}
            </TableCell>
          </TableRow>

          {/* 7. Deposit & Amount Due */}
          {quotation.depositRequired && depositMoney > 0 && (
            <>
              <TableRow className="border-0">
                <TableCell colSpan={4}></TableCell>
                <TableCell className="text-right text-green-600 font-medium">
                  Deposit Required
                  {quotation.depositType === "PERCENTAGE" && (
                    <span className="text-xs ml-1">
                      ({Number(quotation.depositRate)}%)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right text-green-600 font-medium">
                  -{formatCurrency(depositMoney)}
                </TableCell>
              </TableRow>

              <TableRow className="bg-muted/30">
                <TableCell colSpan={4}></TableCell>
                <TableCell className="text-right font-bold">
                  Amount Due
                </TableCell>
                <TableCell className="text-right font-bold text-blue-600">
                  {formatCurrency(amountDue)}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
