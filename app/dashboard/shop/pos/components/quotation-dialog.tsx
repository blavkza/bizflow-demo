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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  CalendarIcon,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Loader2,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  X,
  Printer,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { CartItem } from "@/types/pos";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { useToast } from "@/hooks/use-toast";
import { quotationGenerator } from "@/lib/quotation-generator";

interface QuotationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  tax: number;
  deliveryAmount: number;
  total: number;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerEmail: string;
  setCustomerEmail: (email: string) => void;
  customerAddress: string;
  setCustomerAddress: (address: string) => void;
  isDelivery: boolean;
  setIsDelivery: (delivery: boolean) => void;
  deliveryInstructions: string;
  setDeliveryInstructions: (instructions: string) => void;
  onCreateQuotation: (quotationData: any) => Promise<void>;
  onUpdateQuotation?: (quotationData: any) => Promise<void>;
  isLoading?: boolean;
  isEditing?: boolean;
  quotation?: any;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  discount: number;
  setDiscount: (discount: number) => void;
  onClose?: () => void;
}

export function QuotationDialog({
  isOpen,
  onOpenChange,
  cart,
  subtotal,
  discountAmount,
  discountPercent,
  tax,
  deliveryAmount,
  total,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  customerAddress,
  setCustomerAddress,
  isDelivery,
  setIsDelivery,
  deliveryInstructions,
  setDeliveryInstructions,
  onCreateQuotation,
  onUpdateQuotation,
  isLoading = false,
  isEditing = false,
  quotation = null,
  updateQuantity,
  removeFromCart,
  discount,
  setDiscount,
  onClose,
}: QuotationDialogProps) {
  const { toast } = useToast();
  const { companyInfo } = useCompanyInfo();
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [notes, setNotes] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [quotationEmail, setQuotationEmail] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (companyInfo) {
      quotationGenerator.setCompanyInfo(companyInfo);
    }
  }, [companyInfo]);

  useEffect(() => {
    if (isEditing && quotation) {
      setExpiryDate(
        quotation.expiryDate ? new Date(quotation.expiryDate) : undefined
      );
      setNotes(quotation.notes || "");
      setDiscountInput(quotation.discountPercent?.toString() || "0");
      setQuotationEmail(quotation.customerEmail || "");
    } else {
      setExpiryDate(undefined);
      setNotes("");
      setDiscountInput(discount.toString());
      setQuotationEmail(customerEmail);
    }
  }, [isEditing, quotation, discount, customerEmail]);

  const handleDiscountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setDiscountInput(value);

      if (value === "") {
        setDiscount(0);
        return;
      }

      const numValue = Number.parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        setDiscount(numValue);
      }
    }
  };

  const handleCreateOrUpdate = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const quotationData = {
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerEmail: customerEmail || undefined,
      customerAddress: isDelivery ? customerAddress : undefined,
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
      notes,
      isDelivery,
      deliveryAddress: isDelivery ? customerAddress : undefined,
      deliveryInstructions: isDelivery ? deliveryInstructions : undefined,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: Number(item.price) || 0,
        total: (Number(item.price) || 0) * item.quantity,
        shopProduct: {
          id: item.id,
          name: item.name,
          sku: item.sku,
          stock: item.stock,
        },
      })),
      subtotal,
      discount: discountAmount,
      discountPercent,
      tax,
      deliveryAmount,
      total,
    };

    if (isEditing && onUpdateQuotation) {
      await onUpdateQuotation({
        ...quotationData,
        id: quotation.id,
      });
    } else {
      await onCreateQuotation(quotationData);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    onOpenChange(false);
  };

  const handlePrintQuotation = async () => {
    if (!quotation) {
      toast({
        title: "No Quotation",
        description: "Please create or select a quotation first",
        variant: "destructive",
      });
      return;
    }

    setIsPrinting(true);
    try {
      await quotationGenerator.printQuotation(quotation, "A4");
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
  };

  const handleDownloadQuotation = async () => {
    if (!quotation) {
      toast({
        title: "No Quotation",
        description: "Please create or select a quotation first",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await quotationGenerator.generateQuotationPDF(
        quotation,
        "A4"
      );
      await quotationGenerator.downloadQuotation(
        blob,
        `quotation-${quotation.quoteNumber}.html`
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
  };

  const handleEmailQuotation = async () => {
    if (!quotationEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!quotation) return;

    setIsSendingEmail(true);
    try {
      const quotationHTML =
        await quotationGenerator.generateQuotationForEmail(quotation);

      const response = await fetch("/api/sales/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: quotationEmail,
          subject: `Quotation ${quotation.quoteNumber} - Price Quote`,
          html: quotationHTML,
          saleNumber: quotation.quoteNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Quotation Sent",
          description: `Quotation sent to ${quotationEmail}`,
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing
              ? `Edit Quotation ${quotation?.quoteNumber}`
              : "Create Quotation"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edit quotation details"
              : "Create a quotation from items in cart"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cart Items Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart Items ({cart.length})
              </h3>
              <Badge variant="outline">Total: R{total.toFixed(2)}</Badge>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">No items in cart</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add products to cart first before creating quotation
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto p-2 border rounded-lg">
                {cart.map((item) => {
                  const itemPrice = Number(item.price) || 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={50}
                            height={50}
                            className="rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {item.sku} • R{itemPrice.toFixed(2)} each
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Available stock: {item.stock}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            R{(itemPrice * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} × R{itemPrice.toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="p-4 border rounded-lg space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quote-customer-name">Full Name</Label>
                <Input
                  id="quote-customer-name"
                  placeholder="Customer full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="quote-customer-phone"
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="quote-customer-phone"
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="quote-customer-email"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="quote-customer-email"
                  type="email"
                  placeholder="Email address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Delivery & Quotation Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery Section */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="quote-delivery-toggle"
                  className="flex items-center gap-2 text-base"
                >
                  <MapPin className="h-5 w-5" />
                  <span>Delivery Required</span>
                </Label>
                <Switch
                  id="quote-delivery-toggle"
                  checked={isDelivery}
                  onCheckedChange={setIsDelivery}
                />
              </div>

              {isDelivery && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="quote-delivery-address">
                      Delivery Address
                    </Label>
                    <Textarea
                      id="quote-delivery-address"
                      placeholder="Enter full delivery address..."
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="quote-delivery-instructions"
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Delivery Instructions (Optional)
                    </Label>
                    <Textarea
                      id="quote-delivery-instructions"
                      placeholder="e.g., Gate code, leave at door, call on arrival..."
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quotation Details */}
            <div className="p-4 border rounded-lg space-y-3">
              <h3 className="text-lg font-semibold">Quotation Details</h3>

              <div className="space-y-2">
                <Label htmlFor="quote-expiry">Expiry Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiryDate ? (
                        format(expiryDate, "PPP")
                      ) : (
                        <span>Select expiry date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-discount">Discount (%)</Label>
                <Input
                  id="quote-discount"
                  type="text"
                  inputMode="decimal"
                  value={discountInput}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-notes">Notes (Optional)</Label>
                <Textarea
                  id="quote-notes"
                  placeholder="Add any notes or terms for this quotation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-4 border rounded-lg space-y-2 bg-gray-50">
            <h4 className="font-semibold text-lg text-gray-900 mb-3">
              Order Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>R{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discountPercent}%):</span>
                  <span>-R{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between">
                  <span>VAT:</span>
                  <span>R{tax.toFixed(2)}</span>
                </div>
              )}
              {isDelivery && (
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>
                    {deliveryAmount === 0
                      ? "FREE"
                      : `R${deliveryAmount.toFixed(2)}`}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-primary">R{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quotation Actions (Only for editing existing quotations) */}
          {isEditing && quotation && (
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
                    <Download className="h-4 w-4 mr-2" />
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
                    value={quotationEmail}
                    onChange={(e) => setQuotationEmail(e.target.value)}
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
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleCreateOrUpdate}
            disabled={isLoading || cart.length === 0}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                {isEditing ? "Update Quotation" : "Create Quotation"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
