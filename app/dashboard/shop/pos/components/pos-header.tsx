"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { CartItem } from "@/types/pos";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface ScanNotice {
  message: string;
  type: "error" | "warning" | "info";
  visible: boolean;
}

interface POSHeaderProps {
  cart: CartItem[];
  scanNotice: ScanNotice;
  activeQuotation?: any;
}

export function POSHeader({
  cart,
  scanNotice,
  activeQuotation,
}: POSHeaderProps) {
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="space-y-4 mb-6">
      {/* Scan Notice */}
      {/*    {scanNotice.visible && (
        <div
          className={`p-3 rounded-lg border ${
            scanNotice.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : scanNotice.type === "warning"
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {scanNotice.type === "error" && <AlertCircle className="h-4 w-4" />}
            {scanNotice.type === "warning" && (
              <AlertCircle className="h-4 w-4" />
            )}
            {scanNotice.type === "info" && <CheckCircle className="h-4 w-4" />}
            <span className="font-medium">{scanNotice.message}</span>
          </div>
        </div>
      )} */}

      {/* Active Quotation Status */}
      {activeQuotation && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  Quotation #{activeQuotation.quoteNumber}
                </h3>
                <p className="text-sm text-blue-700">
                  Customer: {activeQuotation.customerName || "Not specified"} •
                  Total: R{activeQuotation.total.toFixed(2)} • Items:{" "}
                  {activeQuotation.items.length}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-white text-blue-700 border-blue-300"
            >
              Ready to Convert
            </Badge>
          </div>
        </div>
      )}

      {/* Cart Summary */}
      <div className="flex items-center justify-between p-4  rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <ShoppingCart className="h-6 w-6" />
            {cartItemCount > 0 && (
              <Badge
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
                variant="destructive"
              >
                {cartItemCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">Point of Sale</h2>
            <p className="text-sm text-muted-foreground">
              {cartItemCount} items in cart • Total: R{cartTotal.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeQuotation ? (
            <Badge variant="outline" className=" text-blue-700 border-blue-300">
              Quotation Mode
            </Badge>
          ) : (
            <Badge variant="outline">Sale Mode</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
