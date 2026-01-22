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
  Clock,
  Tag,
  Percent,
} from "lucide-react";
import { receiptGenerator } from "@/lib/receipt-generator";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [loadingStockAwait, setLoadingStockAwait] = useState(false);

  // Debug log to check data
  useEffect(() => {
    console.log("ReceiptDialog - Completed Sale:", completedSale);
    console.log("ReceiptDialog - Company Info:", companyInfo);
  }, [completedSale, companyInfo]);

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
    if (!completedSale?.id) return;

    setLoadingStockAwait(true);
    try {
      const response = await fetch(
        `/api/shop/sales/${completedSale.id}/stock-awaits`
      );
      if (response.ok) {
        const data = await response.json();
        setStockAwaitItems(data);
      } else {
        console.error("Failed to fetch stock await items:", response.status);
      }
    } catch (error) {
      console.error("Error fetching stock await items:", error);
    } finally {
      setLoadingStockAwait(false);
    }
  };

  // Calculate total item discounts from the sale items
  const calculateTotalItemDiscounts = () => {
    if (!completedSale?.items) return 0;

    return completedSale.items.reduce((total: number, item: any) => {
      const originalPrice = Number(item.originalPrice) || Number(item.price);
      const currentPrice = Number(item.price);
      if (currentPrice < originalPrice) {
        const discountAmount = originalPrice - currentPrice;
        return total + discountAmount * item.quantity;
      }
      return total;
    }, 0);
  };

  // Calculate original subtotal before item discounts
  const calculateOriginalSubtotal = () => {
    if (!completedSale?.items) return 0;

    return completedSale.items.reduce((total: number, item: any) => {
      const originalPrice = Number(item.originalPrice) || Number(item.price);
      return total + originalPrice * item.quantity;
    }, 0);
  };

  const totalItemDiscounts = calculateTotalItemDiscounts();
  const originalSubtotal = calculateOriginalSubtotal();
  const hasItemDiscounts = totalItemDiscounts > 0;

  const handlePrintReceipt = async () => {
    if (!completedSale) {
      toast({
        title: "No Sale Data",
        description: "Cannot print receipt without sale data",
        variant: "destructive",
      });
      return;
    }

    setIsPrinting(true);
    try {
      console.log("Printing receipt with data:", completedSale);
      await receiptGenerator.printReceipt(completedSale, receiptSize);
      toast({
        title: "Printing Receipt",
        description: "Receipt sent to printer",
      });
    } catch (error: any) {
      console.error("Error printing receipt:", error);
      toast({
        title: "Print Failed",
        description: error.message || "Could not print receipt",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!completedSale) {
      toast({
        title: "No Sale Data",
        description: "Cannot download receipt without sale data",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      console.log("Downloading receipt with data:", completedSale);
      const blob = await receiptGenerator.generateReceiptPDF(
        completedSale,
        receiptSize
      );

      if (!blob || blob.size === 0) {
        throw new Error("Generated receipt is empty");
      }

      await receiptGenerator.downloadReceipt(
        blob,
        `receipt-${completedSale.saleNumber || "unknown"}.html`
      );
      toast({
        title: "Receipt Downloaded",
        description: "Receipt has been downloaded",
      });
    } catch (error: any) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Could not download receipt",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
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

    if (!completedSale) {
      toast({
        title: "No Sale Data",
        description: "Cannot send email without sale data",
        variant: "destructive",
      });
      return;
    }

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
          description: result.error || "Could not send receipt email",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send receipt email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
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

  // Helper to validate sale data
  const validateSaleData = () => {
    if (!completedSale) return false;

    const requiredFields = ["id", "saleNumber", "total", "paymentMethod"];
    const missingFields = requiredFields.filter(
      (field) => !completedSale[field]
    );

    if (missingFields.length > 0) {
      console.warn("Missing required fields in sale data:", missingFields);
      return false;
    }

    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] lg:min-w-[800px] max-h-[90vh] overflow-y-auto">
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
                  ? "bg-yellow-50 dark:bg-zinc-800 border-yellow-200"
                  : "bg-green-50 dark:bg-zinc-800 border-green-200"
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
                <span>
                  {completedSale.createdBy ||
                    completedSale.user?.name ||
                    "Staff"}
                </span>
              </div>

              {/* Discount Summary */}
              {hasItemDiscounts && (
                <div className="mb-3 p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-700">
                      Discount Summary
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Original Total:</span>
                        <span className="font-medium">
                          R{originalSubtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Item Discounts:</span>
                        <span className="font-medium text-green-600">
                          -R{totalItemDiscounts.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-semibold">Subtotal:</span>
                        <span className="font-semibold">
                          R
                          {completedSale.subtotal?.toFixed(2) ||
                            (originalSubtotal - totalItemDiscounts).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-green-600">Global Discount:</span>
                        <span className="font-medium text-green-600">
                          -R{completedSale.discount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">VAT:</span>
                        <span className="font-medium">
                          R{completedSale.tax?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-semibold">Total Savings:</span>
                        <span className="font-semibold text-green-600">
                          R
                          {(
                            totalItemDiscounts + (completedSale.discount || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  R{completedSale.total?.toFixed(2)}
                </span>
              </div>

              {completedSale.amountReceived &&
                completedSale.amountReceived > completedSale.total && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-200">
                    <span>Change Given:</span>
                    <span className="font-semibold">
                      R
                      {(
                        (completedSale.amountReceived || 0) -
                        (completedSale.total || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
            </div>
          )}

          {/* Stock Await Warning */}
          {completedSale?.status === "AWAITING_STOCK" && (
            <div className="p-4 bg-yellow-50 dark:bg-zinc-900 rounded-lg border border-yellow-200">
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

              {loadingStockAwait ? (
                // Loading State
                <div className="space-y-3 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                    <span className="text-sm text-yellow-700">
                      Loading stock information...
                    </span>
                  </div>
                  <Alert className="bg-yellow-50 dark:bg-zinc-900 border-yellow-200">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      Please wait while we fetch the stock details for items
                      awaiting restocking.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : stockAwaitItems.length > 0 ? (
                // Loaded State
                <>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {stockAwaitItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border"
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
                </>
              ) : (
                // No Items State
                <div className="text-center py-4">
                  <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    No items awaiting stock found
                  </p>
                  <p className="text-xs text-gray-500">
                    This may be a system error. Please check the sale details.
                  </p>
                </div>
              )}
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
                  disabled={loadingStockAwait}
                />
                <Button
                  onClick={handleEmailReceipt}
                  disabled={
                    isSendingEmail || loadingStockAwait || !completedSale
                  }
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

        <Button
          onClick={handlePrintReceipt}
          variant="default"
          className="w-full "
          disabled={isPrinting || loadingStockAwait || !completedSale}
        >
          {isPrinting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Printer className="h-4 w-4 mr-2" />
          )}
          {isPrinting ? "Printing..." : "Print Receipt"}
        </Button>

        <DialogFooter className="mt-4">
          <Button
            onClick={handleFinishSale}
            className="w-full"
            variant={
              completedSale?.status === "AWAITING_STOCK"
                ? "secondary"
                : "default"
            }
            disabled={loadingStockAwait}
          >
            {loadingStockAwait ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Stock Info...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {completedSale?.status === "AWAITING_STOCK"
                  ? "Continue & Manage Stock"
                  : "Finish & New Sale"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
