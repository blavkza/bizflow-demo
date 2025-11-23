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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const daysUntilExpiry = Math.ceil(
    (new Date(quotation.validUntil).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Subtotal (Gross)</h3>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(Number(quotation.amount))}
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
            {formatCurrency(Number(quotation.taxAmount))}
          </div>
          <p className="text-xs text-muted-foreground">
            {/* Use the effective tax rate calculated by the backend */}
            {Number(quotation.taxRate || 0).toFixed(2)}% Effective Rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Total Amount </h3>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(Number(quotation.totalAmount))}
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
