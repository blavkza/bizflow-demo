import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatNumber, formatHours } from "../utils";
import { Separator } from "@/components/ui/separator";

interface EmployeeCardProps {
  employee: any;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const attendance = employee.attendanceBreakdown;
  const totalDays = attendance?.totalDays || 0;
  const paidDays = employee.paidDays || 0;
  const paidPercentage = totalDays > 0 ? (paidDays / totalDays) * 100 : 0;
  const hasOvertime = (employee.overtimeAmount || 0) > 0;
  const hasBonus = (employee.bonusAmount || 0) > 0;
  const hasDeduction = (employee.deductionAmount || 0) > 0;
  const netAmount = employee.netAmount || employee.amount;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between py-4">
      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-medium text-lg">
              {employee.firstName} {employee.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {employee.department?.name || "No department"}
              {employee.department?.manager && (
                <span> • Managed by {employee.department.manager.name}</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-purple-600">
              {formatCurrency(netAmount)}
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Gross: {formatCurrency(employee.amount)}</p>
              {hasBonus && (
                <p className="text-green-600">
                  Bonus: +{formatCurrency(employee.bonusAmount)}
                </p>
              )}
              {hasDeduction && (
                <p className="text-red-600">
                  Deduction: -{formatCurrency(employee.deductionAmount)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Salary Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Daily Rate:</span>
            <p className="font-medium">{formatCurrency(employee.dailyRate)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Paid Days:</span>
            <p className="font-medium">{employee.paidDays} days</p>
          </div>
        </div>

        {/* Hours Breakdown */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Regular Hours:</span>
            <p className="font-medium">{formatHours(employee.regularHours)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Overtime Hours:</span>
            <p
              className={`font-medium ${hasOvertime ? "text-orange-600" : ""}`}
            >
              {formatHours(employee.overtimeHours)}
            </p>
          </div>
        </div>

        {/* Overtime Calculation Display */}
        {hasOvertime && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Overtime Calculation
                </p>
                <p className="text-xs text-orange-600">
                  {employee.overtimeHours}h × R{employee.overtimeFixedRate}/h
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-orange-100 text-orange-800"
              >
                +{formatCurrency(employee.overtimeAmount)}
              </Badge>
            </div>
          </div>
        )}

        {/* Bonuses Display */}
        {hasBonus && employee.bonuses && employee.bonuses.length > 0 && (
          <div className="p-3 bg-green-50 dark:bg-zinc-800/20  border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-green-800">Bonuses</p>
                {employee.bonuses.map((bonus: any, index: number) => (
                  <p key={index} className="text-xs text-green-600">
                    {bonus.type}: {formatCurrency(bonus.amount)}{" "}
                    {bonus.description && `- ${bonus.description}`}
                  </p>
                ))}
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                +{formatCurrency(employee.bonusAmount)}
              </Badge>
            </div>
          </div>
        )}

        {/* Deductions Display */}
        {hasDeduction &&
          employee.deductions &&
          employee.deductions.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-zinc-800/20  border border-red-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-red-800">Deductions</p>
                  {employee.deductions.map((deduction: any, index: number) => (
                    <p key={index} className="text-xs text-red-600">
                      {deduction.type}: -{formatCurrency(deduction.amount)}{" "}
                      {deduction.description && `- ${deduction.description}`}
                    </p>
                  ))}
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  -{formatCurrency(employee.deductionAmount)}
                </Badge>
              </div>
            </div>
          )}

        {/* Base Salary Calculation */}
        <div className="p-3 bg-blue-50 dark:bg-zinc-800/20 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-blue-800">
                {employee.isFreelancer || employee.salaryType === "DAILY"
                  ? "Daily Salary Calculation"
                  : "Monthly Salary Calculation"}
              </p>
              <p className="text-xs text-blue-600">
                {employee.isFreelancer || employee.salaryType === "DAILY"
                  ? `${employee.paidDays} days × ${formatCurrency(employee.dailyRate)}/day`
                  : `Monthly: ${formatCurrency(employee.monthlySalary)} - ${employee.attendanceBreakdown?.unpaidLeaveDays || 0} unpaid days`}
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {formatCurrency(employee.baseAmount)}
            </Badge>
          </div>
        </div>

        {/* Net Amount Summary */}
        <div className="p-3 bg-purple-50 dark:bg-zinc-800/20  border border-purple-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-purple-800">
                Net Amount Summary
              </p>
              <div className="text-xs text-purple-600 space-y-1">
                <p>Base Salary: {formatCurrency(employee.baseAmount)}</p>
                {hasOvertime && (
                  <p>Overtime: +{formatCurrency(employee.overtimeAmount)}</p>
                )}
                {hasBonus && (
                  <p>Bonuses: +{formatCurrency(employee.bonusAmount)}</p>
                )}
                {hasDeduction && (
                  <p>Deductions: -{formatCurrency(employee.deductionAmount)}</p>
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-purple-100 text-purple-800 font-bold"
            >
              Net: {formatCurrency(netAmount)}
            </Badge>
          </div>
        </div>

        {/* Attendance Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid days progress:</span>
            <span>
              {paidDays}/{totalDays} days ({paidPercentage.toFixed(1)}%)
            </span>
          </div>
          <Progress value={paidPercentage} className="h-2" />
        </div>

        {/* Attendance Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Present:</span>
            <Badge variant="default" className="ml-2">
              {formatNumber(attendance?.presentDays)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Half Days:</span>
            <Badge variant="secondary" className="ml-2">
              {formatNumber(attendance?.halfDays)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Leave:</span>
            <Badge variant="outline" className="ml-2">
              {formatNumber(attendance?.leaveDays)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Absent:</span>
            <Badge variant="destructive" className="ml-2">
              {formatNumber(attendance?.absentDays)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Unpaid Leave:</span>
            <Badge variant="outline" className="ml-2">
              {formatNumber(attendance?.unpaidLeaveDays)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Records:</span>
            <Badge variant="secondary" className="ml-2">
              {formatNumber(totalDays)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
