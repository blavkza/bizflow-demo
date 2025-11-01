import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, Calendar } from "lucide-react";

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
}

const paymentMethodConfig = {
  CASH: "Cash",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  EFT: "EFT",
  MOBILE_PAYMENT: "Mobile Payment",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
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

  return (
    <div className="grid gap-4 md:grid-cols-3">
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
        </CardContent>
      </Card>
    </div>
  );
}
