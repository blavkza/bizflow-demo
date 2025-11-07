import { Card, CardContent } from "@/components/ui/card";

interface PaymentProgressProps {
  paidAmount: number;
  totalCost: number;
  paymentPercentage: number;
}

export default function PaymentProgress({
  paidAmount,
  totalCost,
  paymentPercentage,
}: PaymentProgressProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Progress</span>
            <span className="font-medium">{paymentPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${paymentPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>R{paidAmount.toFixed(2)} paid</span>
            <span>R{totalCost.toFixed(2)} total</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
