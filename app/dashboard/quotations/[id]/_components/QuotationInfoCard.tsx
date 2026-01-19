"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { QuotationWithRelations } from "@/types/quotation";
import { StatusBadge } from "./StatusBadge";
import { DiscountType } from "@prisma/client";

export const QuotationInfoCard = ({
  quotation,
}: {
  quotation: QuotationWithRelations;
}) => {
  // Format currency
  const formatCurrency = (amount: number | any) => {
    const value = typeof amount === "number" ? amount : Number(amount);
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(value);
  };

  // Calculate deposit percentage if deposit exists
  const calculateDepositPercentage = () => {
    if (
      !quotation.depositRequired ||
      !quotation.depositAmount ||
      !quotation.totalAmount
    ) {
      return null;
    }

    const depositAmount = Number(quotation.depositAmount);
    const totalAmount = Number(quotation.totalAmount);

    if (totalAmount <= 0) return null;

    return (depositAmount / totalAmount) * 100;
  };

  const depositPercentage = calculateDepositPercentage();

  const calculateDiscountAmount = () => {
    if (!quotation.discountAmount) return 0;

    if (quotation.discountType === DiscountType.PERCENTAGE) {
      return (
        (Number(quotation.amount) * Number(quotation.discountAmount)) / 100
      );
    } else {
      return quotation.discountAmount;
    }
  };

  const discountAmount = calculateDiscountAmount();

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Quotation Information</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <span className="text-muted-foreground">Title:</span>
          <p className="text-sm">{quotation.title || "No title provided"}</p>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Quotation Number:</span>
          <span className="font-medium">{quotation.quotationNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Issue Date:</span>
          <span>{format(new Date(quotation.issueDate), "MMM dd, yyyy")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valid Until:</span>
          <span>{format(new Date(quotation.validUntil), "MMM dd, yyyy")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <StatusBadge status={quotation.status} />
        </div>
        <div className="text-sm text-muted-foreground">
          Prepared By: {quotation.creator?.name || "N/A"}
        </div>

        {/* Amount Information */}
        <div className="pt-2 border-t">
          <h4 className="font-medium mb-3">Financial Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(quotation.amount)}</span>
            </div>
            {quotation.taxAmount && Number(quotation.taxAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tax({Number(quotation?.taxRate)}%):
                </span>
                <span>{formatCurrency(quotation.taxAmount)}</span>
              </div>
            )}
            {quotation.discountAmount &&
              Number(quotation.discountAmount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span className="text-muted-foreground">
                    Discount
                    {quotation.discountType === DiscountType.PERCENTAGE &&
                      quotation.discountAmount &&
                      ` (${quotation.discountAmount}%)`}
                    :
                  </span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total Amount:</span>
              <span>{formatCurrency(quotation.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Deposit Information */}
        {quotation.depositRequired && quotation.depositAmount && (
          <div className="pt-2 border-t">
            <h4 className="font-medium mb-3 text-blue-700">
              Deposit Information
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit Type:</span>
                <span className="font-medium">
                  {quotation.depositType === "PERCENTAGE"
                    ? "Percentage Based"
                    : "Fixed Amount"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit Amount:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(quotation.depositAmount)}
                </span>
              </div>
              {depositPercentage && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Deposit Percentage :
                  </span>
                  <span>{depositPercentage.toFixed(1)}%</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Amount Due After Deposit:</span>
                <span className="text-blue-600">
                  {formatCurrency(
                    Number(quotation.totalAmount) -
                      Number(quotation.depositAmount)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
