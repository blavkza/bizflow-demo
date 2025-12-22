"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, Calendar, Package } from "lucide-react";

interface Sale {
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  paymentMethod: string;
  paymentStatus: string;
  amountReceived: number | null;
  change: number | null;
  saleDate: string;
  items: any[];
  status: string;
  StockAwait?: Array<{
    id: string;
    quantity: number;
    status: string;
    shopProductId: string;
    shopProduct?: {
      name: string;
    };
  }>;
}

const paymentMethodConfig = {
  CASH: "Cash",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  CARD: "Card Paymnet",
  STORE_CREDIT: "Store Credit",
  EFT: "EFT",
  MOBILE_PAYMENT: "Mobile Payment",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
};

const statusConfig = {
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800" },
  AWAITING_STOCK: {
    label: "Awaiting Stock",
    color: "bg-yellow-100 text-yellow-800",
  },
  PENDING: { label: "Pending", color: "bg-blue-100 text-blue-800" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

interface SaleInfoCardsProps {
  sale: Sale;
}

export default function SaleInfoCards({ sale }: SaleInfoCardsProps) {
  const formatPaymentMethod = (method: string) => {
    return (
      paymentMethodConfig[method as keyof typeof paymentMethodConfig] || method
    );
  };

  const hasStockAwaits = sale.StockAwait && sale.StockAwait.length > 0;
  const awaitingStockCount =
    sale.StockAwait?.reduce((sum, awaitItem) => sum + awaitItem.quantity, 0) ||
    0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customer Info</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="font-medium">
              {sale.customerName || "Walk-in Customer"}
            </p>
            {sale.customerPhone && (
              <p className="text-sm text-muted-foreground">
                {sale.customerPhone}
              </p>
            )}
            {sale.customerEmail && (
              <p className="text-sm text-muted-foreground">
                {sale.customerEmail}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Details</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Method:</span>
            <span className="text-sm font-medium">
              {formatPaymentMethod(sale.paymentMethod)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant="outline">{sale.paymentStatus}</Badge>
          </div>
          {sale.amountReceived && (
            <>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Received:</span>
                <span className="text-sm font-medium">
                  R{Number(sale.amountReceived).toFixed(2)}
                </span>
              </div>
              {sale.change && sale.change > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Change:</span>
                  <span className="text-sm font-medium">
                    R{Number(sale.change).toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sale Info</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Date:</span>
            <span className="text-sm font-medium">
              {new Date(sale.saleDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Time:</span>
            <span className="text-sm font-medium">
              {new Date(sale.saleDate).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Items:</span>
            <span className="text-sm font-medium">{sale.items.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge
              className={
                statusConfig[sale.status as keyof typeof statusConfig]?.color ||
                "bg-gray-100"
              }
            >
              {statusConfig[sale.status as keyof typeof statusConfig]?.label ||
                sale.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stock Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Status</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {hasStockAwaits ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-600">
                  Awaiting Stock:
                </span>
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700"
                >
                  {awaitingStockCount} units
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Products waiting for stock arrival:</p>
                <ul className="mt-1 space-y-1">
                  {sale.StockAwait?.map((awaitItem) => (
                    <li key={awaitItem.id} className="flex justify-between">
                      <span>{awaitItem.shopProduct?.name || "Product"}</span>
                      <span className="font-medium">
                        {awaitItem.quantity} units
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-2">
                <Package className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  All stock available
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No stock shortages
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
