import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";
import { Payroll } from "@/types/payroll";

interface TransactionDetailsProps {
  payroll: Payroll;
  formatCurrency: (amount: number) => string;
}

export default function TransactionDetails({
  payroll,
  formatCurrency,
}: TransactionDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Transaction Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">
              Transaction Reference:
            </span>
            <p className="font-mono font-medium">
              {payroll.transaction.reference}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Transaction Date:</span>
            <p className="font-medium">
              {new Date(payroll.transaction.date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">
              Transaction Description:
            </span>
            <p className="font-medium">{payroll.transaction.description}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total Processed:</span>
            <p className="font-bold text-lg">
              {formatCurrency(payroll.totalAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
