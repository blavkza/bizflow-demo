"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Globe, Mail, Phone } from "lucide-react";

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
        website?: string;
        bankAccount?: string;
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
                    <span>{generalSetting?.phone}</span>
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
                  Tax Number: {generalSetting?.taxId || "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Bank Account: {generalSetting?.bankAccount || "N/A"}
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
                    <div>Tax Number: {invoice?.client?.taxNumber} </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Payment Terms
              </Label>
              <div className="font-medium truncate">
                {invoice?.paymentTerms || "N/A"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
