import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users, IdCard, Briefcase, UserCheck } from "lucide-react";
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
  // Helper to format types nicely (e.g. "ANNUAL_BONUS" -> "Annual Bonus")
  const formatType = (type: string) => {
    if (!type) return "";
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

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
          {payroll.payments.map((payment: any, index) => {
            // Resolve worker from either employee or freeLancer object
            const worker =
              payment.worker || payment.employee || payment.freeLancer;
            const isFreelancer =
              payment.worker?.isFreelancer || !!payment.freeLancerId;
            const workerNumber =
              payment.worker?.workerNumber ||
              (isFreelancer
                ? payment.freeLancer?.freeLancerNumber
                : payment.employee?.employeeNumber);

            return (
              <div key={payment.id} className="space-y-4">
                {index > 0 && <Separator />}

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Worker Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          {isFreelancer ? (
                            <Briefcase className="h-5 w-5 text-orange-500" />
                          ) : (
                            <UserCheck className="h-5 w-5 text-blue-500" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-lg">
                                {worker?.firstName || "Unknown"}{" "}
                                {worker?.lastName || "Worker"}
                              </p>
                              <Badge
                                variant={isFreelancer ? "secondary" : "outline"}
                                className="text-xs"
                              >
                                {isFreelancer ? "Freelancer" : "Employee"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <IdCard className="h-3 w-3" />
                              <span>#{workerNumber || "N/A"}</span>
                              <span>•</span>
                              <Briefcase className="h-3 w-3" />
                              <span>{worker?.position || "No position"}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {worker?.department?.name || "No department"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-600">
                          {formatCurrency(
                            getPaymentAmount(
                              payment.netAmount || payment.amount
                            )
                          )}
                        </p>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <p>
                            Base:{" "}
                            {formatCurrency(
                              getPaymentAmount(payment.baseAmount)
                            )}
                          </p>
                          {getPaymentAmount(payment.overtimeAmount) > 0 && (
                            <p className="text-orange-600">
                              Overtime: +
                              {formatCurrency(
                                getPaymentAmount(payment.overtimeAmount)
                              )}
                            </p>
                          )}
                          {getPaymentAmount(payment.bonusAmount) > 0 && (
                            <p className="text-green-600">
                              Bonuses: +
                              {formatCurrency(
                                getPaymentAmount(payment.bonusAmount)
                              )}
                            </p>
                          )}
                          {getPaymentAmount(payment.deductionAmount) > 0 && (
                            <p className="text-red-600">
                              Deductions: -
                              {formatCurrency(
                                getPaymentAmount(payment.deductionAmount)
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Payment Information */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                            Regular Hours:
                          </span>
                          <p className="font-medium">
                            {formatHours(
                              getPaymentAmount(payment.regularHours)
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Overtime Hours:
                          </span>
                          <p className="font-medium">
                            {formatHours(
                              getPaymentAmount(payment.overtimeHours)
                            )}
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

                      {(payment.bonuses?.length > 0 ||
                        payment.deductions?.length > 0) && (
                        <Separator className="bg-slate-200" />
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Bonuses Breakdown */}
                        {payment.bonuses && payment.bonuses.length > 0 && (
                          <div className="bg-green-50/50 p-2 rounded border border-green-100">
                            <p className="text-xs font-semibold text-green-700 mb-2">
                              Bonuses
                            </p>
                            <ul className="space-y-2">
                              {payment.bonuses.map((bonus: any) => (
                                <li
                                  key={bonus.id}
                                  className="text-xs flex justify-between items-start"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-slate-700">
                                      {formatType(bonus.bonusType)}
                                    </span>
                                    {/* Show description only if different from type */}
                                    {bonus.description &&
                                      bonus.description !== bonus.bonusType && (
                                        <span className="text-[10px] text-muted-foreground leading-tight">
                                          {bonus.description}
                                        </span>
                                      )}
                                  </div>
                                  <span className="font-medium text-green-700 whitespace-nowrap ml-2">
                                    +{formatCurrency(Number(bonus.amount))}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Deductions Breakdown */}
                        {payment.deductions &&
                          payment.deductions.length > 0 && (
                            <div className="bg-red-50/50 p-2 rounded border border-red-100">
                              <p className="text-xs font-semibold text-red-700 mb-2">
                                Deductions
                              </p>
                              <ul className="space-y-2">
                                {payment.deductions.map((deduction: any) => (
                                  <li
                                    key={deduction.id}
                                    className="text-xs flex justify-between items-start"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium text-slate-700">
                                        {formatType(deduction.deductionType)}
                                      </span>
                                      {/* Show description only if different from type */}
                                      {deduction.description &&
                                        deduction.description !==
                                          deduction.deductionType && (
                                          <span className="text-[10px] text-muted-foreground leading-tight">
                                            {deduction.description}
                                          </span>
                                        )}
                                    </div>
                                    <span className="font-medium text-red-700 whitespace-nowrap ml-2">
                                      -
                                      {formatCurrency(Number(deduction.amount))}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>

                      {payment.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>Note:</strong> {payment.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
