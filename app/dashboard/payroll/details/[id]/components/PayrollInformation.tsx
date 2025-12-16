import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";
import { Payroll } from "@/types/payroll";
import { PayrollStatus } from "@prisma/client";

interface PayrollInformationProps {
  payroll: Payroll;
  getStatusVariant: (
    status: PayrollStatus
  ) => "default" | "secondary" | "outline" | "destructive";
  totalBaseAmount: number;
  totalOvertimeAmount: number;
  totalAmount: number;
}

export default function PayrollInformation({
  payroll,
  getStatusVariant,
  totalBaseAmount,
  totalOvertimeAmount,
  totalAmount,
}: PayrollInformationProps) {
  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Payroll Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Reference:</span>
            {/* Added optional chaining just in case transaction is missing */}
            <p className="font-mono font-medium">
              {payroll.transaction?.reference || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Payment Type:</span>
            <p className="font-medium capitalize">
              {payroll.type?.toLowerCase()}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Currency:</span>
            <p className="font-medium">{payroll.currency}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Processed By:</span>
            <p className="font-medium">{payroll.createdByName || "Unknown"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Processed Date:</span>
            <p className="font-medium">
              {new Date(payroll.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={getStatusVariant(payroll.status)}>
              {payroll.status}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-semibold">Amount Breakdown</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Base Salaries:</span>
              <span className="font-medium">
                {formatCurrency(Number(payroll.baseAmount) || totalBaseAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Overtime Total:</span>
              <span className="font-medium text-orange-600">
                +
                {formatCurrency(
                  Number(payroll.overtimeAmount) || totalOvertimeAmount
                )}
              </span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="font-semibold">Grand Total:</span>
              <span className="font-bold text-lg">
                {formatCurrency(Number(payroll.totalAmount) || totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
