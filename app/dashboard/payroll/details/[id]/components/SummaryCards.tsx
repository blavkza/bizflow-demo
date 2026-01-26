import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  DollarSign,
  FileText,
  Clock,
  UserCheck,
  Briefcase,
} from "lucide-react";
import { Payroll } from "@/types/payroll";
import { PayrollStatus } from "@prisma/client";

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
  // Fix: Check employeeId and freeLancerId directly instead of 'payment.worker'
  const employeesCount = payroll.payments.filter(
    (payment: any) => payment.employeeId
  ).length;

  const freelancersCount = payroll.payments.filter(
    (payment: any) => payment.freeLancerId
  ).length;

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Payroll Period
              </p>
              <p className=" font-bold">{formatMonth(payroll.month)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Workers
              </p>
              <p className="text-lg font-bold">{payroll._count.payments}</p>
              <div className="flex gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  {employeesCount} emp
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {freelancersCount} free
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Amount
              </p>
              <p className="text-lg font-bold">
                {formatCurrency(Number(payroll.totalAmount))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <Badge variant={getStatusVariant(payroll.status)}>
                {payroll.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-purple-600" />
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
