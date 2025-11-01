import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmployeeOverview } from "./EmployeeOverview";
import { OvertimeBreakdown } from "./OvertimeBreakdown";
import { SummaryCards } from "./SummaryCards";

interface PayrollDataTabsProps {
  payrollData: any[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalBaseAmount: number;
  totalOvertimeAmount: number;
  totalPayroll: number;
  totalPaidDays: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
}

export function PayrollDataTabs({
  payrollData,
  activeTab,
  onTabChange,
  totalBaseAmount,
  totalOvertimeAmount,
  totalPayroll,
  totalPaidDays,
  totalRegularHours,
  totalOvertimeHours,
}: PayrollDataTabsProps) {
  const employeesWithOvertime = payrollData.filter(
    (emp) => (emp.overtimeAmount || 0) > 0
  );

  return (
    <>
      <SummaryCards
        payrollData={payrollData}
        totalBaseAmount={totalBaseAmount}
        totalOvertimeAmount={totalOvertimeAmount}
        totalPayroll={totalPayroll}
        totalPaidDays={totalPaidDays}
        totalRegularHours={totalRegularHours}
        totalOvertimeHours={totalOvertimeHours}
      />

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Employee Overview</TabsTrigger>
          <TabsTrigger value="overtime">
            Overtime Details
            {employeesWithOvertime.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {employeesWithOvertime.length}
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
      </Tabs>
    </>
  );
}
