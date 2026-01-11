"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Check,
  Truck,
  CreditCard,
  Smartphone,
  Banknote,
  MapPin,
  MessageCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { POSSettings } from "@/types/pos";
import { useEffect, useState } from "react";
import { PaymentMethod } from "@prisma/client";

interface CheckoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  tax: number;
  deliveryAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  amountReceived: string;
  setAmountReceived: (amount: string) => void;
  change: number | undefined;
  setChange: (change: number | undefined) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerEmail: string;
  setCustomerEmail: (email: string) => void;
  customerAddress: string;
  setCustomerAddress: (address: string) => void;
  deliveryInstructions: string;
  setDeliveryInstructions: (instructions: string) => void;
  isDelivery: boolean;
  setIsDelivery: (delivery: boolean) => void;
  completeTransaction: () => Promise<void> | void;
  posSettings: POSSettings | null;
  title?: string; // Add this line
}

const paymentMethods = [
  {
    value: PaymentMethod.CASH,
    label: "Cash",
    icon: Banknote,
    frontendValue: "cash",
  },
  {
    value: PaymentMethod.CARD,
    label: "Card",
    icon: CreditCard,
    frontendValue: "card payment",
  },
  {
    value: PaymentMethod.EFT,
    label: "EFT",
    icon: CreditCard,
    frontendValue: "eft",
  },
  {
    value: PaymentMethod.MOBILE_PAYMENT,
    label: "Mobile Payment",
    icon: Smartphone,
    frontendValue: "mobile",
  },
  {
    value: PaymentMethod.STORE_CREDIT,
    label: "Card",
    icon: CreditCard,
    frontendValue: "card",
  },
  {
    value: PaymentMethod.STORE_CREDIT,
    label: "Store Credit",
    icon: CreditCard,
    frontendValue: "Store Credit",
  },
];

export function CheckoutDialog({
  isOpen,
  onOpenChange,
  subtotal,
  discountAmount,
  discountPercent,
  tax,
  deliveryAmount,
  total,
  paymentMethod,
  setPaymentMethod,
  amountReceived,
  setAmountReceived,
  change,
  setChange,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  customerAddress,
  setCustomerAddress,
  deliveryInstructions,
  setDeliveryInstructions,
  isDelivery,
  setIsDelivery,
  completeTransaction,
  posSettings,
  title = "Complete Transaction", // Add default value
}: CheckoutDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (paymentMethod === PaymentMethod.CASH && amountReceived) {
      const received = parseFloat(amountReceived) || 0;
      const calculatedChange = received - total;
      setChange(calculatedChange >= 0 ? calculatedChange : undefined);
    } else {
      setChange(undefined);
    }
  }, [amountReceived, total, paymentMethod, setChange]);

  const handleAmountChange = (value: string) => {
    // Allow empty string, numbers, and decimal points
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmountReceived(value);
    }
  };

  const handleAmountBlur = () => {
    // On blur, if input is empty or just a decimal point, reset to empty
    if (amountReceived === "" || amountReceived === ".") {
      setAmountReceived("");
      return;
    }

    // Round to 2 decimal places
    const numValue = Number.parseFloat(amountReceived);
    if (!isNaN(numValue)) {
      const roundedValue = Math.round(numValue * 100) / 100;
      setAmountReceived(roundedValue.toString());
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodConfig = paymentMethods.find((m) => m.value === method);
    return methodConfig?.icon || CreditCard;
  };

  const PaymentIcon = getPaymentMethodIcon(paymentMethod);
  const vatRate = posSettings?.vatEnabled
    ? (posSettings?.vatRate || 0.15) * 100
    : 0;

  // Convert frontend payment method to Prisma enum value
  const convertToPrismaPaymentMethod = (
    frontendMethod: string
  ): PaymentMethod => {
    const method = paymentMethods.find(
      (m) => m.frontendValue === frontendMethod
    );
    return method?.value || PaymentMethod.CASH;
  };

  // Convert Prisma enum value to frontend payment method
  const convertToFrontendPaymentMethod = (
    prismaMethod: PaymentMethod
  ): string => {
    const method = paymentMethods.find((m) => m.value === prismaMethod);
    return method?.frontendValue || "cash";
  };

  // Handle payment method change - convert between frontend and Prisma values
  const handlePaymentMethodChange = (value: string) => {
    // Convert the selected frontend value to Prisma enum
    const prismaMethod = convertToPrismaPaymentMethod(value);
    setPaymentMethod(prismaMethod);
  };

  // Get current payment method for display (convert back to frontend value for Select)
  const getCurrentPaymentMethodForDisplay = (): string => {
    return convertToFrontendPaymentMethod(paymentMethod as PaymentMethod);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Validate cash payment
    if (paymentMethod === PaymentMethod.CASH) {
      const received = parseFloat(amountReceived) || 0;
      if (received < total) {
        errors.push(
          `Amount received (R${received.toFixed(2)}) is less than total (R${total.toFixed(2)})`
        );
      }
    }

    // Validate delivery address if delivery is enabled
    if (isDelivery && (!customerAddress || customerAddress.trim() === "")) {
      errors.push("Delivery address is required for delivery orders");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCompleteTransaction = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await completeTransaction();
    } catch (error) {
      console.error("Error completing transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Process payment and complete the sale
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">
                  Please fix the following errors:
                </span>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Order Summary */}
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">R{subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-medium">
                  -R{discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            {posSettings?.vatEnabled && tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  VAT ({vatRate.toFixed(1)}%):
                </span>
                <span className="font-medium">R{tax.toFixed(2)}</span>
              </div>
            )}

            {isDelivery && deliveryAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee:</span>
                <span className="font-medium">
                  R{deliveryAmount.toFixed(2)}
                </span>
              </div>
            )}

            {isDelivery && deliveryAmount === 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Delivery:</span>
                <span className="font-medium">FREE</span>
              </div>
            )}

            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-primary">R{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Toggle */}
          {posSettings?.deliveryEnabled && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="delivery-toggle"
                  className="flex items-center gap-2 text-base"
                >
                  <Truck className="h-5 w-5" />
                  <span>Delivery Order</span>
                </Label>
                <Switch
                  id="delivery-toggle"
                  checked={isDelivery}
                  onCheckedChange={setIsDelivery}
                />
              </div>

              {isDelivery && (
                <div className="space-y-3 pt-2 border-t">
                  {/* Delivery Address */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery-address"
                      className="flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Delivery Address
                    </Label>
                    <Textarea
                      id="delivery-address"
                      placeholder="Enter full delivery address..."
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      rows={3}
                      className="resize-none"
                      required={isDelivery}
                    />
                  </div>

                  {/* Delivery Instructions */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery-instructions"
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Delivery Instructions (Optional)
                    </Label>
                    <Textarea
                      id="delivery-instructions"
                      placeholder="e.g., Gate code, leave at door, call on arrival..."
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  {/* Delivery Pricing Info */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 space-y-1">
                      <div className="font-medium">Delivery Information:</div>
                      <div>• Standard fee: R{posSettings.deliveryFee}</div>
                      <div>
                        • Free delivery on orders over R
                        {posSettings.freeDeliveryAbove}
                      </div>
                      {subtotal >= posSettings.freeDeliveryAbove && (
                        <div className="text-green-600 font-semibold">
                          ✓ This order qualifies for FREE delivery!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customer Information */}
          <div className="p-4 border rounded-lg space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Full Name (Optional)</Label>
                <Input
                  id="customer-name"
                  placeholder="Customer full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone Number (Optional)</Label>
                <Input
                  id="customer-phone"
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customer-email">Email Address (Optional)</Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="Email address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-4 border rounded-lg space-y-3">
            <Label className="flex items-center gap-2 text-base">
              <PaymentIcon className="h-5 w-5" />
              Payment Method
            </Label>
            <Select
              value={getCurrentPaymentMethodForDisplay()}
              onValueChange={handlePaymentMethodChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <SelectItem
                      key={method.frontendValue}
                      value={method.frontendValue}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{method.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Amount Received (for cash) */}
            {paymentMethod === PaymentMethod.CASH && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="amount-received">Amount Received</Label>
                <div className="space-y-2">
                  <Input
                    id="amount-received"
                    type="text"
                    inputMode="decimal"
                    value={amountReceived}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onBlur={handleAmountBlur}
                    onFocus={() => {
                      if (amountReceived === "0") {
                        setAmountReceived("");
                      }
                    }}
                    placeholder="0.00"
                    className="w-full"
                  />
                  {change !== undefined && change >= 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Change to give:
                      </span>
                      <span className="font-bold text-green-600 text-lg">
                        R{change.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {amountReceived && parseFloat(amountReceived) < total && (
                    <p className="text-sm text-red-600 font-medium">
                      Amount received is less than total due
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Non-cash payment notice */}
            {paymentMethod !== PaymentMethod.CASH && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center space-x-2 text-sm text-amber-700">
                  <CreditCard className="h-4 w-4" />
                  <span>
                    {paymentMethod === PaymentMethod.CARD &&
                      "Process card payment through your terminal"}
                    {paymentMethod === PaymentMethod.EFT &&
                      "Provide EFT payment details to customer"}
                    {paymentMethod === PaymentMethod.MOBILE_PAYMENT &&
                      "Process mobile payment through your system"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Card */}
          <div className="p-4 border rounded-lg bg-slate-50">
            <h4 className="font-semibold text-sm text-slate-900 mb-2">
              Order Summary
            </h4>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>R{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-R{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {posSettings?.vatEnabled && (
                <div className="flex justify-between">
                  <span>VAT ({vatRate.toFixed(1)}%):</span>
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
              <div className="flex justify-between font-semibold text-slate-900 border-t pt-1">
                <span>Total:</span>
                <span>R{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompleteTransaction}
            disabled={
              isSubmitting ||
              (paymentMethod === PaymentMethod.CASH &&
                (!amountReceived || parseFloat(amountReceived) < total)) ||
              (isDelivery && !customerAddress.trim())
            }
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {isDelivery ? "Complete Sale & Create Order" : "Complete Sale"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
