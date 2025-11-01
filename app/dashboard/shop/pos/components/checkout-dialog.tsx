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
  completeTransaction: () => void;
  posSettings: POSSettings | null;
}

// Create payment methods that map to Prisma enum values
const paymentMethods = [
  {
    value: PaymentMethod.CASH,
    label: "Cash",
    icon: Banknote,
    frontendValue: "cash",
  },
  {
    value: PaymentMethod.CREDIT_CARD,
    label: "Card",
    icon: CreditCard,
    frontendValue: "card",
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
}: CheckoutDialogProps) {
  const handleAmountChange = (value: string) => {
    setAmountReceived(value);
    const received = Number.parseFloat(value) || 0;
    setChange(received >= total ? received - total : undefined);
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Transaction
          </DialogTitle>
          <DialogDescription>
            Process payment and complete the sale
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                <Label htmlFor="customer-name">Full Name</Label>
                <Input
                  id="customer-name"
                  placeholder="Customer full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone Number</Label>
                <Input
                  id="customer-phone"
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customer-email">Email Address</Label>
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
                <Label>Amount Received</Label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    step="0.01"
                    min={total}
                    value={amountReceived}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full"
                  />
                  {change !== undefined && amountReceived && (
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
                    {paymentMethod === PaymentMethod.CREDIT_CARD &&
                      "Process card payment through your terminal"}
                    {paymentMethod === PaymentMethod.EFT &&
                      "Provide EFT payment details to customer"}
                    {paymentMethod === PaymentMethod.MOBILE_PAYMENT &&
                      "Process mobile payment through your system"}
                    {paymentMethod === PaymentMethod.BANK_TRANSFER &&
                      "Process bank transfer payment"}
                    {paymentMethod === PaymentMethod.CHEQUE &&
                      "Process cheque payment"}
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
          >
            Cancel
          </Button>
          <Button
            onClick={completeTransaction}
            disabled={
              (paymentMethod === PaymentMethod.CASH &&
                (!amountReceived || parseFloat(amountReceived) < total)) ||
              (isDelivery && !customerAddress.trim())
            }
            className="w-full sm:w-auto"
          >
            <Check className="mr-2 h-4 w-4" />
            {isDelivery ? "Complete Sale & Create Order" : "Complete Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
