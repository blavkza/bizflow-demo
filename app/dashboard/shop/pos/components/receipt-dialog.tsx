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
  Package,
  AlertTriangle,
} from "lucide-react";
import { receiptGenerator } from "@/lib/receipt-generator";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { Badge } from "@/components/ui/badge";

interface ReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  completedSale: any;
  receiptSize: "thermal" | "A4";
  setReceiptSize: (size: "thermal" | "A4") => void;
  receiptEmail: string;
  setReceiptEmail: (email: string) => void;
  isSendingEmail: boolean;
  setIsSendingEmail: (sending: boolean) => void;
  handleFinishSale: () => void;
}

export function ReceiptDialog({
  isOpen,
  onOpenChange,
  completedSale,
  receiptSize,
  setReceiptSize,
  receiptEmail,
  setReceiptEmail,
  isSendingEmail,
  setIsSendingEmail,
  handleFinishSale,
}: ReceiptDialogProps) {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { companyInfo } = useCompanyInfo();
  const [stockAwaitItems, setStockAwaitItems] = useState<any[]>([]);

  useEffect(() => {
    if (companyInfo) {
      receiptGenerator.setCompanyInfo(companyInfo);
    }
  }, [companyInfo]);

  useEffect(() => {
    if (completedSale && completedSale.status === "AWAITING_STOCK") {
      fetchStockAwaitItems();
    }
  }, [completedSale]);

  const fetchStockAwaitItems = async () => {
    try {
      const response = await fetch(
        `/api/shop/sales/${completedSale.id}/stock-awaits`
      );
      if (response.ok) {
        const data = await response.json();
        setStockAwaitItems(data);
      }
    } catch (error) {
      console.error("Error fetching stock await items:", error);
    }
  };

  const handlePrintReceipt = async () => {
    if (completedSale) {
      setIsPrinting(true);
      try {
        await receiptGenerator.printReceipt(completedSale, receiptSize);
        toast({
          title: "Printing Receipt",
          description: "Receipt sent to printer",
        });
      } catch (error) {
        console.error("Error printing receipt:", error);
        toast({
          title: "Print Failed",
          description: "Could not print receipt",
          variant: "destructive",
        });
      } finally {
        setIsPrinting(false);
      }
    }
  };

  const handleDownloadReceipt = async () => {
    if (completedSale) {
      setIsDownloading(true);
      try {
        const blob = await receiptGenerator.generateReceiptPDF(
          completedSale,
          receiptSize
        );
        await receiptGenerator.downloadReceipt(
          blob,
          `receipt-${completedSale.saleNumber}.html`
        );
        toast({
          title: "Receipt Downloaded",
          description: "Receipt has been downloaded",
        });
      } catch (error) {
        console.error("Error downloading receipt:", error);
        toast({
          title: "Download Failed",
          description: "Could not download receipt",
          variant: "destructive",
        });
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleEmailReceipt = async () => {
    if (!receiptEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (completedSale) {
      setIsSendingEmail(true);

      try {
        const receiptHTML =
          await receiptGenerator.generateReceiptForEmail(completedSale);

        // Use the API route to send email
        const response = await fetch("/api/sales/send-receipt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: receiptEmail,
            subject: `Receipt ${completedSale.saleNumber} - Thank you for your purchase`,
            html: receiptHTML,
            saleNumber: completedSale.saleNumber,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: "Receipt Sent",
            description: `Receipt sent to ${receiptEmail}`,
          });
        } else {
          toast({
            title: "Failed to Send",
            description: "Could not send receipt email",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error sending email:", error);
        toast({
          title: "Failed to Send",
          description: "Could not send receipt email",
          variant: "destructive",
        });
      } finally {
        setIsSendingEmail(false);
      }
    }
  };

  const formatPaymentMethod = (method: string) => {
    const methods: { [key: string]: string } = {
      CASH: "Cash",
      CREDIT_CARD: "Credit Card",
      DEBIT_CARD: "Debit Card",
      EFT: "EFT",
      MOBILE_PAYMENT: "Mobile Payment",
    };
    return methods[method] || method;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {completedSale?.status === "AWAITING_STOCK" ? (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Sale Created - Awaiting Stock
              </>
            ) : (
              <>
                <Check className="h-5 w-5 text-green-500" />
                Sale Completed Successfully!
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {completedSale?.status === "AWAITING_STOCK"
              ? "Some items are out of stock. Please handle receipt options below."
              : "Choose how you would like to handle the receipt"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sale Summary */}
          {completedSale && (
            <div
              className={`p-4 rounded-lg border ${
                completedSale.status === "AWAITING_STOCK"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Sale Number:</span>
                <span className="font-mono">{completedSale.saleNumber}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Payment Method:</span>
                <span>{formatPaymentMethod(completedSale.paymentMethod)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Assisted by:
                </span>
                <span>{completedSale.createdBy || "Staff"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  R{completedSale.total?.toFixed(2)}
                </span>
              </div>
              {completedSale.change && completedSale.change > 0 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-200">
                  <span>Change Given:</span>
                  <span className="font-semibold">
                    R{completedSale.change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Stock Await Warning */}
          {completedSale?.status === "AWAITING_STOCK" && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-700">
                  Items Awaiting Stock
                </span>
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-700"
                >
                  {stockAwaitItems.length} items
                </Badge>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {stockAwaitItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {item.shopProduct?.name || "Product"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        SKU: {item.shopProduct?.sku || "N/A"}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-xs">
                        Awaiting: {item.quantity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-sm text-yellow-700">
                <p className="font-medium">Note:</p>
                <p className="text-xs">
                  These items will need to be restocked before they can be
                  fulfilled.
                </p>
              </div>
            </div>
          )}

          {/* Receipt Size Selection */}
          <div className="space-y-3">
            <Label>Receipt Size</Label>
            <RadioGroup
              value={receiptSize}
              onValueChange={(value) =>
                setReceiptSize(value as "thermal" | "A4")
              }
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thermal" id="thermal" />
                <Label htmlFor="thermal" className="font-normal cursor-pointer">
                  Small Receipt (Thermal Printer - 80mm)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A4" id="a4" />
                <Label htmlFor="a4" className="font-normal cursor-pointer">
                  A4 Size (Standard Printer)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Receipt Actions */}
          <div className="space-y-3">
            <Label>Receipt Actions</Label>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handlePrintReceipt}
                variant="outline"
                className="w-full bg-transparent"
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                {isPrinting ? "Printing..." : "Print Receipt"}
              </Button>
              <Button
                onClick={handleDownloadReceipt}
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

            {/* Email Receipt */}
            <div className="space-y-2">
              <Label htmlFor="receipt-email">Send via Email</Label>
              <div className="flex space-x-2">
                <Input
                  id="receipt-email"
                  type="email"
                  placeholder="customer@example.com"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleEmailReceipt}
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
            onClick={handleFinishSale}
            className="w-full"
            variant={
              completedSale?.status === "AWAITING_STOCK"
                ? "secondary"
                : "default"
            }
          >
            <Check className="mr-2 h-4 w-4" />
            {completedSale?.status === "AWAITING_STOCK"
              ? "Continue & Manage Stock"
              : "Finish & New Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
