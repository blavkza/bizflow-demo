import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Eye, Download, FileText } from "lucide-react";
import { Payroll } from "@/types/payroll";
import { Decimal } from "@prisma/client/runtime/library";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const formatType = (type: string) => {
    if (!type) return "";
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            Worker Breakdown
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {payroll.payments.length} workers
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[220px]">Worker</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Base Pay</TableHead>
                <TableHead className="text-right">Overtime</TableHead>
                <TableHead className="text-right">Bonuses</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right font-bold">Net Pay</TableHead>
                <TableHead className="w-[70px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payroll.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2 opacity-50" />
                      <p>No workers found in this payroll</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payroll.payments.map((payment: any) => {
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

                  const baseAmount = getPaymentAmount(payment.baseAmount);
                  const overtimeAmount = getPaymentAmount(
                    payment.overtimeAmount
                  );
                  const bonusAmount = getPaymentAmount(payment.bonusAmount);
                  const deductionAmount = getPaymentAmount(
                    payment.deductionAmount
                  );
                  const netAmount = getPaymentAmount(
                    payment.netAmount || payment.amount
                  );

                  return (
                    <TableRow
                      key={payment.id}
                      onClick={() =>
                        router.push(`/dashboard/payments/${payment.id}`)
                      }
                      className="group hover:bg-muted/50 cursor-pointer"
                    >
                      {/* Worker Column */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {worker?.firstName || "Unknown"}{" "}
                                  {worker?.lastName || "Worker"}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                  <span>#{workerNumber || "N/A"}</span>
                                  {worker?.position && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">
                                        {worker.position}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span>Days: {payment.daysWorked || 0}</span>
                            <span className="mx-1">•</span>
                            <span>
                              Reg:{" "}
                              {formatHours(
                                getPaymentAmount(payment.regularHours)
                              )}
                            </span>
                            <span className="mx-1">•</span>
                            <span>
                              OT:{" "}
                              {formatHours(
                                getPaymentAmount(payment.overtimeHours)
                              )}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Department Column */}
                      <TableCell>
                        <div className="max-w-[150px]">
                          <p className="text-sm truncate">
                            {worker?.department?.name || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {new Date(payment.payDate).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>

                      {/* Base Pay Column */}
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {formatCurrency(baseAmount)}
                        </div>
                      </TableCell>

                      {/* Overtime Column */}
                      <TableCell className="text-right">
                        {overtimeAmount > 0 ? (
                          <div className="text-orange-600 font-medium">
                            +{formatCurrency(overtimeAmount)}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">—</div>
                        )}
                      </TableCell>

                      {/* Bonuses Column */}
                      <TableCell className="text-right">
                        {bonusAmount > 0 ? (
                          <div>
                            <div className="text-green-600 font-medium">
                              +{formatCurrency(bonusAmount)}
                            </div>
                            {payment.bonuses && payment.bonuses.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {payment.bonuses.length} item(s)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">—</div>
                        )}
                      </TableCell>

                      {/* Deductions Column */}
                      <TableCell className="text-right">
                        {deductionAmount > 0 ? (
                          <div>
                            <div className="text-red-600 font-medium">
                              -{formatCurrency(deductionAmount)}
                            </div>
                            {payment.deductions &&
                              payment.deductions.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {payment.deductions.length} item(s)
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">—</div>
                        )}
                      </TableCell>

                      {/* Net Pay Column */}
                      <TableCell className="text-right">
                        <div className="font-bold text-green-700">
                          {formatCurrency(netAmount)}
                        </div>
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 "
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/payments/${payment.id}`)
                              }
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem className="cursor-pointer">
                              <Download className="h-4 w-4 mr-2" />
                              Download Payslip
                            </DropdownMenuItem> */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Row */}
        {payroll.payments.length > 0 && (
          <div className="border-t bg-muted/20 p-4">
            <div className="grid grid-cols-7 gap-4 text-sm">
              <div className="col-span-2">
                <p className="font-medium">
                  Total Workers: {payroll.payments.length}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(payroll.baseAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-orange-600">
                  +{formatCurrency(payroll.overtimeAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">
                  +{formatCurrency(payroll.totalBonuses)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-red-600">
                  -{formatCurrency(payroll.totalDeductions)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-green-700">
                  {formatCurrency(payroll.netAmount)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
