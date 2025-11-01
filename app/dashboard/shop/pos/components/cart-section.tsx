import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Minus, Plus, Trash2, CreditCard, X } from "lucide-react";
import Image from "next/image";
import { CartItem, POSSettings } from "@/types/pos";

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
}: CartSectionProps) {
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
          {/* Cart Items */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Cart is empty</p>
                <p className="text-sm">Add products to start a sale</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-2 border rounded-lg"
                >
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
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                    <p className="text-sm font-semibold">
                      R{item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
              ))
            )}
          </div>

          {cart.length > 0 && (
            <>
              <Separator />

              {/* Discount */}
              <div className="space-y-2">
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max={maxDiscount}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                />
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
                    <span>Discount ({discount}%):</span>
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

              <Button onClick={handleCheckout} className="w-full" size="lg">
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
