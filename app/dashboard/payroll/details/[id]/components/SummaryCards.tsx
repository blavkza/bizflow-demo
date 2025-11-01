import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, FileText, Clock } from "lucide-react";
import { Payroll } from "@/types/payroll";
import { PayrollStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/formatters";

interface SummaryCardsProps {
  payroll: Payroll;
  formatMonth: (month: string) => string;
  getStatusVariant: (
    status: PayrollStatus
  ) => "default" | "secondary" | "outline" | "destructive";
}

export default function SummaryCards({
  payroll,
  formatMonth,
  getStatusVariant,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Payroll Period
              </p>
              <p className="text-lg font-bold">{formatMonth(payroll.month)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Employees
              </p>
              <p className="text-2xl font-bold">{payroll._count.payments}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Amount
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(payroll.totalAmount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <Badge
                variant={getStatusVariant(payroll.status)}
                className="text-lg"
              >
                {payroll.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Processed By
              </p>
              <p className="text-sm font-bold">
                {payroll.createdByName || "Unknown"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
