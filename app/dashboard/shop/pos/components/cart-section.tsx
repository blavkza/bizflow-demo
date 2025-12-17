import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  X,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { CartItem, POSSettings } from "@/types/pos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react"; // Added useEffect import
import { Badge } from "@/components/ui/badge";

interface CartSectionProps {
  cart: CartItem[];
  discount: number;
  setDiscount: (discount: number) => void;
  maxDiscount: number;
  subtotal: number;
  discountAmount: number;
  tax: number;
  deliveryAmount: number;
  total: number;
  isDelivery: boolean;
  posSettings: POSSettings | null;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  handleCheckout: () => void;
  products?: any[]; // Optional: If you want to pass products for stock checking
}

export function CartSection({
  cart,
  discount,
  setDiscount,
  maxDiscount,
  subtotal,
  discountAmount,
  tax,
  deliveryAmount,
  total,
  isDelivery,
  posSettings,
  updateQuantity,
  removeFromCart,
  clearCart,
  handleCheckout,
  products = [],
}: CartSectionProps) {
  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState("");

  // Fixed: Use useEffect to initialize discount input
  useEffect(() => {
    if (discount === 0) {
      setDiscountInput("");
    } else {
      setDiscountInput(discount.toString());
    }
  }, [discount]);

  const handleDiscountChange = (value: string) => {
    // Allow empty string, numbers, and decimal points
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setDiscountInput(value);

      // If value is empty, set discount to 0
      if (value === "") {
        setDiscount(0);
        setDiscountError("");
        return;
      }

      const numValue = Number.parseFloat(value);

      // Validate discount input
      if (isNaN(numValue)) {
        setDiscountError("Please enter a valid number");
        return;
      }

      if (numValue < 0) {
        setDiscountError("Discount cannot be negative");
        setDiscountInput("0");
        setDiscount(0);
        return;
      }

      if (numValue > maxDiscount) {
        setDiscountError(`Maximum discount allowed is ${maxDiscount}%`);
        setDiscount(maxDiscount);
        setDiscountInput(maxDiscount.toString());
        return;
      }

      setDiscountError("");
      setDiscount(numValue);
    }
  };

  const handleDiscountBlur = () => {
    // On blur, if input is empty or just a decimal point, reset to empty
    if (discountInput === "" || discountInput === ".") {
      setDiscountInput("");
      setDiscount(0);
      return;
    }

    // Round to 2 decimal places
    const numValue = Number.parseFloat(discountInput);
    if (!isNaN(numValue)) {
      const roundedValue = Math.round(numValue * 100) / 100;
      setDiscountInput(roundedValue.toString());
      setDiscount(roundedValue);
    }
  };

  // Check if any items exceed stock
  const getStockExceededItems = () => {
    return cart.filter((item) => item.quantity > item.stock);
  };

  const stockExceededItems = getStockExceededItems();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Sale</span>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stock Warning */}
          {stockExceededItems.length > 0 && (
            <Alert variant={"destructive"} className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">
                  Stock Exceeded for {stockExceededItems.length} item(s):
                </div>
                <ul className="text-xs space-y-1">
                  {stockExceededItems.map((item) => (
                    <li key={item.id}>
                      {" "}
                      {/* Fixed: Added key prop */}• {item.name}: Ordered{" "}
                      {item.quantity}, Available {item.stock}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Cart Items */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Cart is empty</p>
                <p className="text-sm">Add products to start a sale</p>
              </div>
            ) : (
              cart.map((item) => {
                const exceedsStock = item.quantity > item.stock;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center space-x-3 p-2 border rounded-lg ${
                      exceedsStock ? "border-amber-200 bg-amber-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-center gap-2 flex-col">
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
                          <ShoppingCart className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <p className="text-sm">R{item.price.toFixed(2)}</p>
                      <p className="text-sm font-semibold">
                        Total ({item.quantity}): R
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                      {exceedsStock && (
                        <p className="text-xs text-amber-600">
                          Available: {item.stock}
                        </p>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/*    <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {item.name}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.sku}
                      </p> */}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {cart.length > 0 && (
            <>
              <Separator />

              {/* Discount */}
              <div className="space-y-2">
                <Label>Discount (%)</Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={discountInput}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    onBlur={handleDiscountBlur}
                    onFocus={() => {
                      if (discountInput === "0") {
                        setDiscountInput("");
                      }
                    }}
                    placeholder="0"
                    className={discountError ? "border-red-500" : ""}
                  />
                  {discountError && (
                    <div className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {discountError}
                    </div>
                  )}
                </div>
                {maxDiscount < 100 && (
                  <p className="text-xs text-muted-foreground">
                    Maximum discount: {maxDiscount}%
                  </p>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({discount.toFixed(2)}%):</span>
                    <span>-R{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>VAT ({(posSettings?.vatRate || 0.15) * 100}%):</span>
                    <span>R{tax.toFixed(2)}</span>
                  </div>
                )}

                {isDelivery && deliveryAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee:</span>
                    <span>R{deliveryAmount.toFixed(2)}</span>
                  </div>
                )}

                {isDelivery && deliveryAmount === 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Delivery:</span>
                    <span>FREE</span>
                  </div>
                )}

                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full"
                size="lg"
                /*                 disabled={stockExceededItems.length > 0}
                 */
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Checkout
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
