import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building,
  MapPin,
  Truck,
  User,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { OrderData } from "@/types/order";

interface OrderInfoCardsProps {
  orderData: OrderData;
}

export default function OrderInfoCards({ orderData }: OrderInfoCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Customer Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customer Info</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="font-medium">{orderData.customerName}</p>
            <div className="text-sm text-muted-foreground space-y-1 mt-2">
              <div className="flex items-center">
                <Mail className="h-3 w-3 mr-2" />
                {orderData.customerEmail}
              </div>
              {orderData.customerPhone && (
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-2" />
                  {orderData.customerPhone}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Shipping Address
          </CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <p className="font-medium">{orderData.shippingAddress}</p>
            <p>
              {orderData.shippingCity}, {orderData.shippingProvince}
            </p>
            <p>{orderData.shippingPostal}</p>
            <p>{orderData.shippingCountry}</p>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Information Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Delivery Information
          </CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {orderData.assignedEmployee && (
            <div>
              <div className="flex items-center text-muted-foreground mb-1">
                <User className="h-3 w-3 mr-2" />
                Assigned To
              </div>
              <p className="font-medium">{orderData.assignedEmployee.name}</p>
              <p className="text-xs text-muted-foreground">
                {orderData.assignedEmployee.email &&
                  `${orderData.assignedEmployee.email}`}
                {orderData.assignedEmployee.phone &&
                  ` • ${orderData.assignedEmployee.phone}`}
              </p>
            </div>
          )}

          {orderData.processedBy && (
            <div>
              <div className="text-muted-foreground mb-1">Processed By</div>
              <p className="font-medium">{orderData.processedBy.name}</p>
              <p className="text-xs text-muted-foreground">
                {orderData.processedBy.email}
              </p>
            </div>
          )}

          {orderData.carrier && (
            <div>
              <div className="text-muted-foreground mb-1">Carrier</div>
              <p className="font-medium">{orderData.carrier}</p>
            </div>
          )}

          {orderData.deliveryDate && (
            <div>
              <div className="flex items-center text-muted-foreground mb-1">
                <Calendar className="h-3 w-3 mr-2" />
                Delivery Date
              </div>
              <p className="font-medium">
                {new Date(orderData.deliveryDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {orderData.shippedDate && (
            <div>
              <div className="text-muted-foreground mb-1">Shipped Date</div>
              <p className="font-medium">
                {new Date(orderData.shippedDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {orderData.deliveredDate && (
            <div>
              <div className="text-muted-foreground mb-1">Delivered Date</div>
              <p className="font-medium">
                {new Date(orderData.deliveredDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
