import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmployeeOverview } from "./EmployeeOverview";
import { OvertimeBreakdown } from "./OvertimeBreakdown";
import { SummaryCards } from "./SummaryCards";
import { BonusDeductionBreakdown } from "./BonusDeductionBreakdown";

interface PayrollDataTabsProps {
  payrollData: any[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalBaseAmount: number;
  totalOvertimeAmount: number;
  totalBonusAmount: number;
  totalDeductionAmount: number;
  totalPayroll: number;
  netPayroll: number;
  totalPaidDays: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  workerType: "all" | "employees" | "freelancers";
}

export function PayrollDataTabs({
  payrollData,
  activeTab,
  onTabChange,
  totalBaseAmount,
  totalOvertimeAmount,
  totalBonusAmount,
  totalDeductionAmount,
  totalPayroll,
  netPayroll,
  totalPaidDays,
  totalRegularHours,
  totalOvertimeHours,
  workerType,
}: PayrollDataTabsProps) {
  const employeesWithOvertime = payrollData.filter(
    (emp) => (emp.overtimeAmount || 0) > 0
  );

  const employeesWithBonuses = payrollData.filter(
    (emp) => (emp.bonusAmount || 0) > 0
  );

  const employeesWithDeductions = payrollData.filter(
    (emp) => (emp.deductionAmount || 0) > 0
  );

  return (
    <>
      {/*  <SummaryCards
        payrollData={payrollData}
        totalBaseAmount={totalBaseAmount}
        totalOvertimeAmount={totalOvertimeAmount}
        totalBonusAmount={totalBonusAmount}
        totalDeductionAmount={totalDeductionAmount}
        totalPayroll={totalPayroll}
        netPayroll={netPayroll}
        totalPaidDays={totalPaidDays}
        totalRegularHours={totalRegularHours}
        totalOvertimeHours={totalOvertimeHours}
        workerType={workerType}
      /> */}

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          {" "}
          {/* Change to 3 columns */}
          <TabsTrigger value="overview">Employee Overview</TabsTrigger>
          <TabsTrigger value="overtime">
            Overtime Details
            {employeesWithOvertime.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {employeesWithOvertime.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bonuses-deductions">
            Bonuses & Deductions
            {(employeesWithBonuses.length > 0 ||
              employeesWithDeductions.length > 0) && (
              <Badge variant="secondary" className="ml-2">
                {employeesWithBonuses.length + employeesWithDeductions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <EmployeeOverview payrollData={payrollData} />
        </TabsContent>

        <TabsContent value="overtime">
          <OvertimeBreakdown employeesWithOvertime={employeesWithOvertime} />
        </TabsContent>

        <TabsContent value="bonuses-deductions" className="space-y-4">
          {/* Total Bonuses & Deductions Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-zinc-900 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                Total Bonuses
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">
                  +{formatCurrency(totalBonusAmount)}
                </span>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  {employeesWithBonuses.length} employees
                </Badge>
              </div>
              {totalBonusAmount > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  Average bonus per employee:{" "}
                  {formatCurrency(
                    totalBonusAmount / (employeesWithBonuses.length || 1)
                  )}
                </p>
              )}
            </div>

            <div className="p-4 bg-red-50 dark:bg-zinc-900 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">
                Total Deductions
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600">
                  -{formatCurrency(totalDeductionAmount)}
                </span>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {employeesWithDeductions.length} employees
                </Badge>
              </div>
              {totalDeductionAmount > 0 && (
                <p className="text-sm text-red-600 mt-2">
                  Average deduction per employee:{" "}
                  {formatCurrency(
                    totalDeductionAmount / (employeesWithDeductions.length || 1)
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Detailed Breakdown per Employee */}
          <div className="space-y-4">
            {payrollData.map((employee) => {
              const hasBonus = (employee.bonusAmount || 0) > 0;
              const hasDeduction = (employee.deductionAmount || 0) > 0;

              if (!hasBonus && !hasDeduction) return null;

              return (
                <div key={employee.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {employee.department?.name || "No department"} •{" "}
                        {employee.isFreelancer ? "Freelancer" : "Employee"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        Net:{" "}
                        {formatCurrency(employee.netAmount || employee.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Gross: {formatCurrency(employee.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Bonuses for this employee */}
                  {hasBonus && employee.bonuses && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-green-700 mb-2">
                        Bonuses
                      </h5>
                      <div className="space-y-1">
                        {employee.bonuses.map((bonus: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-green-600">{bonus.type}</span>
                            <span className="font-medium text-green-600">
                              +{formatCurrency(bonus.amount)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total Bonuses:</span>
                          <span className="text-green-600">
                            +{formatCurrency(employee.bonusAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Deductions for this employee */}
                  {hasDeduction && employee.deductions && (
                    <div>
                      <h5 className="text-sm font-medium text-red-700 mb-2">
                        Deductions
                      </h5>
                      <div className="space-y-1">
                        {employee.deductions.map(
                          (deduction: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-red-600">
                                {deduction.type}
                              </span>
                              <span className="font-medium text-red-600">
                                -{formatCurrency(deduction.amount)}
                              </span>
                            </div>
                          )
                        )}
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total Deductions:</span>
                          <span className="text-red-600">
                            -{formatCurrency(employee.deductionAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

// Add this helper function at the bottom of the file
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
