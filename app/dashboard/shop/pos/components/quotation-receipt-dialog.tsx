"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Printer,
  FileText,
  Mail,
  Check,
  Loader2,
  User,
  Calendar,
  BadgeCheck,
} from "lucide-react";
import { quotationGenerator } from "@/lib/quotation-generator";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { Badge } from "@/components/ui/badge";

interface QuotationReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  completedQuotation: any;
  receiptSize: "A4" | "thermal";
  setReceiptSize: (size: "A4" | "thermal") => void;
  receiptEmail: string;
  setReceiptEmail: (email: string) => void;
  isSendingEmail: boolean;
  setIsSendingEmail: (sending: boolean) => void;
  handleFinishQuotation: () => void;
}

export function QuotationReceiptDialog({
  isOpen,
  onOpenChange,
  completedQuotation,
  receiptSize,
  setReceiptSize,
  receiptEmail,
  setReceiptEmail,
  isSendingEmail,
  setIsSendingEmail,
  handleFinishQuotation,
}: QuotationReceiptDialogProps) {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { companyInfo } = useCompanyInfo();

  useEffect(() => {
    if (companyInfo) {
      quotationGenerator.setCompanyInfo(companyInfo);
    }
  }, [companyInfo]);

  useEffect(() => {
    if (completedQuotation && completedQuotation.customerEmail) {
      setReceiptEmail(completedQuotation.customerEmail);
    }
  }, [completedQuotation, setReceiptEmail]);

  const handlePrintQuotation = async () => {
    if (completedQuotation) {
      setIsPrinting(true);
      try {
        await quotationGenerator.printQuotation(
          completedQuotation,
          receiptSize
        );
        toast({
          title: "Printing Quotation",
          description: "Quotation sent to printer",
        });
      } catch (error) {
        console.error("Error printing quotation:", error);
        toast({
          title: "Print Failed",
          description: "Could not print quotation",
          variant: "destructive",
        });
      } finally {
        setIsPrinting(false);
      }
    }
  };

  const handleDownloadQuotation = async () => {
    if (completedQuotation) {
      setIsDownloading(true);
      try {
        const blob = await quotationGenerator.generateQuotationPDF(
          completedQuotation,
          receiptSize
        );
        await quotationGenerator.downloadQuotation(
          blob,
          `quotation-${completedQuotation.quoteNumber}.html`
        );
        toast({
          title: "Quotation Downloaded",
          description: "Quotation has been downloaded",
        });
      } catch (error) {
        console.error("Error downloading quotation:", error);
        toast({
          title: "Download Failed",
          description: "Could not download quotation",
          variant: "destructive",
        });
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleEmailQuotation = async () => {
    if (!receiptEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (completedQuotation) {
      setIsSendingEmail(true);

      try {
        const quotationHTML =
          await quotationGenerator.generateQuotationForEmail(
            completedQuotation
          );

        const response = await fetch("/api/sales/send-receipt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: receiptEmail,
            subject: `Quotation ${completedQuotation.quoteNumber} - Price Quote`,
            html: quotationHTML,
            saleNumber: completedQuotation.quoteNumber,
            type: "quotation",
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: "Quotation Sent",
            description: `Quotation sent to ${receiptEmail}`,
          });
        } else {
          toast({
            title: "Failed to Send",
            description: "Could not send quotation email",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error sending email:", error);
        toast({
          title: "Failed to Send",
          description: "Could not send quotation email",
          variant: "destructive",
        });
      } finally {
        setIsSendingEmail(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return new Date().toLocaleDateString();
    }
  };

  const formatExpiryDate = () => {
    if (completedQuotation?.expiryDate) {
      return formatDate(completedQuotation.expiryDate);
    }
    // Calculate 30 days from creation
    const createdDate = completedQuotation?.createdAt
      ? new Date(completedQuotation.createdAt)
      : new Date();
    const expiryDate = new Date(createdDate);
    expiryDate.setDate(expiryDate.getDate() + 30);
    return expiryDate.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-green-500" />
            Quotation Created Successfully!
          </DialogTitle>
          <DialogDescription>
            Choose how you would like to handle the quotation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quotation Summary */}
          {completedQuotation && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Quotation Number:</span>
                <span className="font-mono">
                  {completedQuotation.quoteNumber}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Customer:
                </span>
                <span>
                  {completedQuotation.customerName || "Not specified"}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Valid Until:
                </span>
                <span>{formatExpiryDate()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">
                  R{completedQuotation.total?.toFixed(2)}
                </span>
              </div>

              {completedQuotation.status && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200">
                  <span>Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      completedQuotation.status === "PENDING"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    }
                  >
                    {completedQuotation.status}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Quotation Size Selection */}
          <div className="space-y-3">
            <Label>Quotation Size</Label>
            <RadioGroup
              value={receiptSize}
              onValueChange={(value) =>
                setReceiptSize(value as "A4" | "thermal")
              }
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thermal" id="thermal" />
                <Label htmlFor="thermal" className="font-normal cursor-pointer">
                  Small Size (80mm)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A4" id="a4" />
                <Label htmlFor="a4" className="font-normal cursor-pointer">
                  A4 Size (Standard)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Quotation Actions */}
          <div className="space-y-3">
            <Label>Quotation Actions</Label>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handlePrintQuotation}
                variant="outline"
                className="w-full bg-transparent"
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                {isPrinting ? "Printing..." : "Print Quotation"}
              </Button>
              <Button
                onClick={handleDownloadQuotation}
                variant="outline"
                className="w-full bg-transparent"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
            </div>

            {/* Email Quotation */}
            <div className="space-y-2">
              <Label htmlFor="quotation-email">Send via Email</Label>
              <div className="flex space-x-2">
                <Input
                  id="quotation-email"
                  type="email"
                  placeholder="customer@example.com"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleEmailQuotation}
                  disabled={isSendingEmail}
                  className="whitespace-nowrap"
                >
                  {isSendingEmail ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {isSendingEmail ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleFinishQuotation}
            className="w-full"
            variant="default"
          >
            <Check className="mr-2 h-4 w-4" />
            Finish & New Quotation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
