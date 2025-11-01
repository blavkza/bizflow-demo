import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { statusConfig, paymentStatusConfig } from "../utils";
import { OrderData, OrderStatus, PaymentStatus } from "@/types/order";
import { useRouter } from "next/navigation";

interface OrderHeaderProps {
  orderData: {
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    orderDate: string;
  };
}

export default function OrderHeader({ orderData }: OrderHeaderProps) {
  const StatusIcon = statusConfig[orderData.status]?.icon;
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div onClick={() => router.back()}>
          {" "}
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">{orderData.orderNumber}</h1>
          <div className="flex items-center space-x-2 mt-1">
            {StatusIcon && <StatusIcon className="h-4 w-4" />}
            <Badge className={statusConfig[orderData.status]?.color}>
              {statusConfig[orderData.status]?.label}
            </Badge>
            <Badge
              className={paymentStatusConfig[orderData.paymentStatus]?.color}
            >
              {paymentStatusConfig[orderData.paymentStatus]?.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(orderData.orderDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
