import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users, User, IdCard, Briefcase, UserCheck } from "lucide-react";
import { Payroll } from "@/types/payroll";
import { Decimal } from "@prisma/client/runtime/library";
import { Badge } from "@/components/ui/badge";

interface EmployeeBreakdownProps {
  payroll: Payroll;
  getPaymentAmount: (amount: number | Decimal | undefined | null) => number;
  formatCurrency: (amount: number) => string;
  formatHours: (hours: number) => string;
}

export default function EmployeeBreakdown({
  payroll,
  getPaymentAmount,
  formatCurrency,
  formatHours,
}: EmployeeBreakdownProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Worker Breakdown ({payroll.payments.length} workers)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payroll.payments.map((payment: any, index) => (
            <div key={payment.id} className="space-y-4">
              {index > 0 && <Separator />}

              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-3">
                  {/* Worker Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        {payment.worker?.isFreelancer ? (
                          <Briefcase className="h-5 w-5 text-orange-500" />
                        ) : (
                          <UserCheck className="h-5 w-5 text-blue-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-lg">
                              {payment.worker?.firstName || "Unknown"}{" "}
                              {payment.worker?.lastName || "Worker"}
                            </p>
                            <Badge
                              variant={
                                payment.worker?.isFreelancer
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {payment.worker?.isFreelancer
                                ? "Freelancer"
                                : "Employee"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <IdCard className="h-3 w-3" />
                            <span>
                              #{payment.worker?.workerNumber || "N/A"}
                            </span>
                            <span>•</span>
                            <Briefcase className="h-3 w-3" />
                            <span>
                              {payment.worker?.position || "No position"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payment.worker?.department?.name || "No department"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(getPaymentAmount(payment.amount))}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Base:{" "}
                          {formatCurrency(getPaymentAmount(payment.baseAmount))}
                        </p>
                        {getPaymentAmount(payment.overtimeAmount) > 0 && (
                          <p className="text-orange-600">
                            Overtime: +
                            {formatCurrency(
                              getPaymentAmount(payment.overtimeAmount)
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Worker Details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Worker #:</span>
                      <p className="font-medium">
                        #{payment.worker?.workerNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Position:</span>
                      <p className="font-medium">
                        {payment.worker?.position || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <p className="font-medium">
                        {payment.worker?.department?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Salary Type:
                      </span>
                      <p className="font-medium capitalize">
                        {payment.worker?.salaryType?.toLowerCase() || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Worker Type:
                      </span>
                      <p className="font-medium">
                        {payment.worker?.isFreelancer
                          ? "Freelancer"
                          : "Employee"}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Payment Information */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Total Amount:
                        </span>
                        <p className="font-semibold text-blue-700">
                          {formatCurrency(getPaymentAmount(payment.amount))}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Base Salary:
                        </span>
                        <p className="font-medium">
                          {formatCurrency(getPaymentAmount(payment.baseAmount))}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Overtime:</span>
                        <p className="font-medium text-orange-600">
                          +
                          {formatCurrency(
                            getPaymentAmount(payment.overtimeAmount)
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Payment Type:
                        </span>
                        <p className="font-medium capitalize">
                          {payment.type.toLowerCase()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Days Worked:
                        </span>
                        <p className="font-medium">
                          {payment.daysWorked || 0} days
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Overtime Hours:
                        </span>
                        <p className="font-medium">
                          {formatHours(getPaymentAmount(payment.overtimeHours))}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Regular Hours:
                        </span>
                        <p className="font-medium">
                          {formatHours(getPaymentAmount(payment.regularHours))}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Payment Date:
                        </span>
                        <p className="font-medium">
                          {new Date(payment.payDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {payment.description && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Description:</strong> {payment.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
