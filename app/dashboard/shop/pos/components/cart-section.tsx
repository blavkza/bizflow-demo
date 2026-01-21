"use client";

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
  FileText,
  Edit,
  Check,
  Tag,
  Percent,
} from "lucide-react";
import Image from "next/image";
import { CartItem, POSSettings } from "@/types/pos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  updatePrice: (id: string, price: number) => void;
  clearCart: () => void;
  handleCheckout: () => void;
  onCreateQuotation: () => void;
  products?: any[];
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
  updatePrice,
  clearCart,
  handleCheckout,
  onCreateQuotation,
  products = [],
}: CartSectionProps) {
  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [editingPriceForId, setEditingPriceForId] = useState<string | null>(
    null
  );
  const [priceInput, setPriceInput] = useState("");
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    if (discount === 0) {
      setDiscountInput("");
    } else {
      setDiscountInput(discount.toString());
    }
  }, [discount]);

  const handleDiscountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setDiscountInput(value);

      if (value === "") {
        setDiscount(0);
        setDiscountError("");
        return;
      }

      const numValue = Number.parseFloat(value);

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
    if (discountInput === "" || discountInput === ".") {
      setDiscountInput("");
      setDiscount(0);
      return;
    }

    const numValue = Number.parseFloat(discountInput);
    if (!isNaN(numValue)) {
      const roundedValue = Math.round(numValue * 100) / 100;
      setDiscountInput(roundedValue.toString());
      setDiscount(roundedValue);
    }
  };

  const handleStartEditPrice = (item: CartItem) => {
    setEditingPriceForId(item.id);
    setPriceInput(item.price.toString());
    setPriceError("");
  };

  const handlePriceChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPriceInput(value);
    }
  };

  const handleSavePrice = (itemId: string) => {
    if (priceInput === "" || priceInput === ".") {
      setPriceError("Please enter a valid price");
      return;
    }

    const numValue = Number.parseFloat(priceInput);
    if (isNaN(numValue)) {
      setPriceError("Please enter a valid number");
      return;
    }

    if (numValue < 0) {
      setPriceError("Price cannot be negative");
      return;
    }

    if (numValue === 0) {
      setPriceError("Price cannot be zero");
      return;
    }

    // Find the original product to get the original price
    const item = cart.find((cartItem) => cartItem.id === itemId);
    if (item && numValue > item.originalPrice) {
      setPriceError("New price cannot be higher than original price");
      return;
    }

    setPriceError("");
    updatePrice(itemId, numValue);
    setEditingPriceForId(null);
    setPriceInput("");
  };

  const handleCancelEdit = () => {
    setEditingPriceForId(null);
    setPriceInput("");
    setPriceError("");
  };

  const getStockExceededItems = () => {
    return cart.filter((item) => item.quantity > item.stock);
  };

  const stockExceededItems = getStockExceededItems();

  // Function to check if text is too long and needs truncation
  const isTextTooLong = (text: string, maxLength: number = 30) => {
    return text.length > maxLength;
  };

  // Truncate text function
  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Calculate item-level discount
  const getItemDiscount = (item: CartItem) => {
    const originalPrice = Number(item.originalPrice) || Number(item.price);
    const currentPrice = Number(item.price);
    if (currentPrice < originalPrice) {
      const discountAmount = originalPrice - currentPrice;
      const discountPercentage = (
        (discountAmount / originalPrice) *
        100
      ).toFixed(1);
      return {
        amount: discountAmount,
        percentage: discountPercentage,
        display: `-R${discountAmount.toFixed(2)} (${discountPercentage}%)`,
      };
    }
    return null;
  };

  // Calculate total item discounts for the whole cart
  const calculateTotalItemDiscounts = () => {
    return cart.reduce((total, item) => {
      const itemDiscount = getItemDiscount(item);
      if (itemDiscount) {
        return total + itemDiscount.amount * item.quantity;
      }
      return total;
    }, 0);
  };

  // Calculate original subtotal (before any item discounts)
  const calculateOriginalSubtotal = () => {
    return cart.reduce((total, item) => {
      const originalPrice = Number(item.originalPrice) || Number(item.price);
      return total + originalPrice * item.quantity;
    }, 0);
  };

  const totalItemDiscounts = calculateTotalItemDiscounts();
  const originalSubtotal = calculateOriginalSubtotal();
  const hasItemDiscounts = totalItemDiscounts > 0;

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
                      • {item.name}: Ordered {item.quantity}, Available{" "}
                      {item.stock}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Cart Items */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto sidebar-scroll">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Cart is empty</p>
                <p className="text-sm">Add products to start a sale</p>
              </div>
            ) : (
              cart.map((item) => {
                const exceedsStock = item.quantity > item.stock;
                const itemPrice = Number(item.price) || 0;
                const originalPrice = Number(item.originalPrice) || itemPrice;
                const showTooltip = isTextTooLong(item.name, 30);
                const itemDiscount = getItemDiscount(item);
                const isEditing = editingPriceForId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`flex items-start space-x-3 p-2 border rounded-lg ${
                      exceedsStock
                        ? "border-amber-200 bg-amber-50 dark:bg-zinc-900"
                        : ""
                    } ${itemDiscount ? "border-green-200 bg-green-50 dark:bg-green-900/20" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      {/* Name and SKU at the top */}
                      <div className="font-medium text-sm truncate mb-1">
                        {showTooltip ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {truncateText(item.name, 30)}
                                </span>
                              </TooltipTrigger>

                              <TooltipContent side="top" align="start">
                                <p className="font-medium">{item.name}</p>
                                {item.sku && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    SKU: {item.sku}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          item.name
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.sku}
                      </p>

                      {/* Content below (image, price, etc.) */}
                      <div className="flex items-start gap-2 flex-col">
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

                        {/* Price editing section */}
                        <div className="space-y-1">
                          {isEditing ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  value={priceInput}
                                  onChange={(e) =>
                                    handlePriceChange(e.target.value)
                                  }
                                  className={`w-24 h-8 ${priceError ? "border-red-500" : ""}`}
                                  placeholder="0.00"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSavePrice(item.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                              {priceError && (
                                <p className="text-red-500 text-xs">
                                  {priceError}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Original: R{originalPrice.toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm">
                                  {itemDiscount ? (
                                    <span className="flex flex-col gap-0.5">
                                      <span className="text-gray-400 line-through text-xs">
                                        R{originalPrice.toFixed(2)}
                                      </span>
                                      <span className="text-green-600 font-semibold">
                                        R{itemPrice.toFixed(2)}
                                      </span>
                                    </span>
                                  ) : (
                                    <span>R{itemPrice.toFixed(2)}</span>
                                  )}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEditPrice(item)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>

                              {itemDiscount && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200 text-xs"
                                >
                                  {itemDiscount.display}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-sm font-semibold">
                          Total ({item.quantity}): R
                          {(itemPrice * item.quantity).toFixed(2)}
                          {itemDiscount && (
                            <span className="block text-xs text-green-600">
                              Saved: R
                              {(itemDiscount.amount * item.quantity).toFixed(2)}
                            </span>
                          )}
                        </p>
                        {exceedsStock && (
                          <p className="text-xs text-amber-600">
                            Available: {item.stock}
                          </p>
                        )}
                      </div>
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

              {/* Global Discount */}
              <div className="space-y-2">
                <Label>Global Discount (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
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

                {/* Show item discounts total */}
                {hasItemDiscounts && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Item Discounts:</span>
                    <span>-R{totalItemDiscounts.toFixed(2)}</span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Global Discount ({discount.toFixed(2)}%):</span>
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

                {/* Total Savings Summary */}
                {hasItemDiscounts && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-green-700">
                        Total Savings:
                      </span>
                      <span className="text-lg font-bold text-green-700">
                        R{(totalItemDiscounts + discountAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-green-600 flex justify-between">
                      <span>
                        Item discounts: R{totalItemDiscounts.toFixed(2)}
                      </span>
                      <span>Global discount: R{discountAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleCheckout} className="w-full" size="lg">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Checkout
                </Button>

                <Button
                  onClick={onCreateQuotation}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create Quote
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
