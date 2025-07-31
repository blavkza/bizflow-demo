"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { QuotationWithRelations } from "@/types/quotation";

export const KeyMetrics = ({
  quotation,
}: {
  quotation: QuotationWithRelations;
}) => {
  const daysUntilExpiry = Math.ceil(
    (new Date(quotation.validUntil).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Subtotal </h3>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R
            {Number(quotation.amount).toLocaleString("en-ZA", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Tax</h3>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R{Number(quotation.taxAmount).toLocaleString("en-ZA")}
          </div>
          <p className="text-xs text-muted-foreground">
            {(() => {
              const baseAmount =
                Number(quotation.amount) - Number(quotation.discountAmount);
              const taxRate =
                baseAmount > 0
                  ? (Number(quotation.taxAmount) / baseAmount) * 100
                  : 0;
              return `${taxRate.toFixed(2)}%`;
            })()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Total Amount</h3>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R{Number(quotation.totalAmount).toLocaleString("en-ZA")}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Valid Until</h3>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {format(new Date(quotation.validUntil), "MMM dd, yyyy")}
          </div>
          <p className="text-xs text-muted-foreground">
            {daysUntilExpiry > 0
              ? `${daysUntilExpiry} days remaining`
              : "Expired"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
