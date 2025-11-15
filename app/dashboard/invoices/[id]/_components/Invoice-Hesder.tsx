"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Globe, Mail, Phone, CreditCard } from "lucide-react";

interface InvoiceHeaderProps {
  invoice: {
    creator: {
      GeneralSetting: Array<{
        companyName?: string;
        Address?: string;
        city?: string;
        province?: string;
        postCode?: string;
        phone?: string;
        phone1?: string;
        phone2?: string;
        phone3?: string;
        website?: string;
        bankAccount?: string;
        bankAccount2?: string;
        bankName?: string;
        bankName2?: string;
        email?: string;
        taxId?: string;
      }>;
      name: string;
    };
    client: {
      name: string;
      company: string;
      address?: string;
      phone?: string;
      email?: string;
      taxNumber?: string;
    };
    invoiceNumber: string;
    issueDate: Date | string;
    dueDate: Date | string;
    paymentTerms?: string;
    depositRequired?: boolean;
    depositType?: "AMOUNT" | "PERCENTAGE";
    depositAmount?: number;
    totalAmount: number;
  };
}

export default function InvoiceHeader({ invoice }: InvoiceHeaderProps) {
  // Get the first GeneralSetting (assuming there's at least one)
  const generalSetting = invoice.creator.GeneralSetting[0];

  // Format the address if needed
  const formatAddress = () => {
    const parts = [
      generalSetting?.Address,
      generalSetting?.city,
      generalSetting?.province,
      generalSetting?.postCode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  // Calculate deposit information
  const calculateDepositInfo = () => {
    if (
      !invoice.depositRequired ||
      !invoice.depositAmount ||
      invoice.totalAmount <= 0
    ) {
      return null;
    }

    // Convert to numbers to ensure they're not strings or other types
    const depositAmount = Number(invoice.depositAmount);
    const totalAmount = Number(invoice.totalAmount);

    // depositAmount is ALWAYS a monetary amount, regardless of depositType
    const depositValue = depositAmount;

    // Calculate what percentage the deposit represents of the total
    const depositPercentage = (depositValue / totalAmount) * 100;

    const amountDue = totalAmount - depositValue;

    return {
      depositValue,
      depositPercentage: Number(depositPercentage.toFixed(1)), // Round to 1 decimal place
      amountDue,
      depositType: invoice.depositType,
      originalDepositAmount: depositAmount,
    };
  };

  const depositInfo = calculateDepositInfo();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  return (
    <div>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">From</h3>
              <div className="space-y-2">
                <h4 className="font-medium">{generalSetting?.companyName}</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {formatAddress()}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3" />
                    <span>
                      {[
                        generalSetting?.phone,
                        generalSetting?.phone2,
                        generalSetting?.phone3,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3 w-3" />
                    <span>{generalSetting?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-3 w-3" />
                    <span>{generalSetting?.website || "N/A"}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  VAT Number: {generalSetting?.taxId || "N/A"}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>
                    <strong>{generalSetting?.bankName}</strong>{" "}
                    {generalSetting?.bankAccount || "N/A"}
                    <br />
                  </div>
                  <div>
                    <strong>{generalSetting?.bankName2}</strong>{" "}
                    {generalSetting?.bankAccount2 || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Bill To</h3>
              <div className="space-y-2">
                {invoice.client.company ? (
                  <h4 className="font-medium">
                    {invoice.client.company} ({invoice.client.name})
                  </h4>
                ) : (
                  <h4 className="font-medium">{invoice.client.name}</h4>
                )}

                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {invoice.client.address}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3" />
                    <span>{invoice.client.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3 w-3" />
                    <span>{invoice.client.email || "N/A"}</span>
                  </div>
                  {invoice?.client?.taxNumber && (
                    <div>VAT Number: {invoice?.client?.taxNumber} </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Invoice Number
              </Label>
              <div className="font-medium">{invoice.invoiceNumber}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Invoice Date
              </Label>
              <div className="font-medium">
                {new Date(invoice.issueDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Due Date
              </Label>
              <div className="font-medium">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Deposit Information */}
          {depositInfo && (
            <>
              <Separator className="my-4" />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">
                    Deposit Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-xs font-medium text-blue-700">
                      Deposit Type
                    </Label>
                    <div className="font-medium">
                      {depositInfo.depositType === "PERCENTAGE"
                        ? "Percentage Based"
                        : "Fixed Amount"}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-blue-700">
                      Deposit Amount
                    </Label>
                    <div className="font-medium">
                      {formatCurrency(depositInfo.originalDepositAmount)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-blue-700">
                      Deposit Value
                    </Label>
                    <div className="font-medium text-green-600">
                      {depositInfo.depositPercentage}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-blue-200">
                  <div>
                    <Label className="text-xs font-medium text-blue-700">
                      Total Invoice Amount
                    </Label>
                    <div className="font-medium">
                      {formatCurrency(invoice.totalAmount)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-blue-700">
                      Amount Due After Deposit
                    </Label>
                    <div className="font-medium text-blue-600">
                      {formatCurrency(depositInfo.amountDue)}
                    </div>
                  </div>
                </div>

                {/* Show percentage representation */}
                <div className="mt-2 text-xs text-blue-600">
                  Deposit represents {depositInfo.depositPercentage}% of total
                  amount
                </div>
              </div>
            </>
          )}

          {/* Payment Terms */}
          {invoice.paymentTerms && (
            <>
              <Separator className="my-4" />
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Payment Terms
                </Label>
                <div className="text-sm mt-1">{invoice.paymentTerms}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
