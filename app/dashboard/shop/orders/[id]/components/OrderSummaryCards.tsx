import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Package,
  FileText,
  Calendar,
  CreditCard,
} from "lucide-react";
import { OrderData, OrderStatus, PaymentStatus } from "@/types/order";
import { statusConfig, paymentStatusConfig } from "../utils";

interface OrderSummaryCardsProps {
  orderData: OrderData;
}

export default function OrderSummaryCards({
  orderData,
}: OrderSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Order Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Order Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R{orderData.total.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Final amount</p>
        </CardContent>
      </Card>

      {/* Items Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{orderData.items.length}</div>
          <p className="text-xs text-muted-foreground">Products ordered</p>
        </CardContent>
      </Card>

      {/* Order Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Order Status</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {statusConfig[orderData.status]?.label}
          </div>
          <p className="text-xs text-muted-foreground">Current order status</p>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {paymentStatusConfig[orderData.paymentStatus]?.label}
          </div>
          <p className="text-xs text-muted-foreground">Payment status</p>
        </CardContent>
      </Card>

      {/* Additional cards */}
      {orderData.discount > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              -R{orderData.discount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {orderData.discountPercent}% discount applied
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subtotal</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R{orderData.subtotal.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Before discount</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Order Date</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {new Date(orderData.orderDate).toLocaleDateString()}
          </div>
          <p className="text-xs text-muted-foreground">Date ordered</p>
        </CardContent>
      </Card>
    </div>
  );
}
