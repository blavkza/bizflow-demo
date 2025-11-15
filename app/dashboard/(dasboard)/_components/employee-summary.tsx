import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "./stat-card";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface EmployeeSummaryProps {
  isLoading: boolean;
  data: any;
}

export default function EmployeeSummary({
  isLoading,
  data,
}: EmployeeSummaryProps) {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const employeeData = data?.employeeSummary || {};
  const employees = data?.employees || [];

  // Calculate on/off duty based on status
  const activeEmployees = employees.filter(
    (emp: any) => emp.status === "ACTIVE"
  );
  const employeesOnDuty = activeEmployees.filter(
    (emp: any) => emp.timeEntries && emp.timeEntries.length > 0
  );
  const employeesOffDuty = activeEmployees.filter(
    (emp: any) => !emp.timeEntries || emp.timeEntries.length === 0
  );

  const handleCardClick = (type: string) => {
    setOpenDialog(type);
  };

  const calculateMonthlyLaborCost = () => {
    const activeEmployees = employeeData.activeEmployees || 0;
    const avgMonthlySalary = 25000;
    return activeEmployees * avgMonthlySalary;
  };

  const renderEmployeeDialogContent = (
    type: string | null,
    data: any,
    onDuty: any[],
    offDuty: any[]
  ) => {
    switch (type) {
      case "workforce":
        return (
          <EmployeeWorkforceDetails data={data} employees={activeEmployees} />
        );
      case "on-duty":
        return <OnDutyEmployeesDetails employees={onDuty} />;
      case "off-duty":
        return <OffDutyEmployeesDetails employees={offDuty} />;
      case "cost":
        return <LaborCostDetails data={data} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Employee Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              isLoading={isLoading}
              title="Active Employees"
              value={employeeData.activeEmployees}
              change={employeeData.activeChange}
              icon="users"
              description={`${employeesOnDuty.length} on duty`}
              onClick={() => handleCardClick("workforce")}
            />
            <StatCard
              isLoading={isLoading}
              title="On Duty Today"
              value={employeesOnDuty.length}
              change={employeeData.onDutyChange}
              icon="user-check"
              description="Currently working"
              onClick={() => handleCardClick("on-duty")}
            />
            <StatCard
              isLoading={isLoading}
              title="Off Duty Today"
              value={employeesOffDuty.length}
              change={employeeData.offDutyChange}
              icon="user-x"
              description="Not clocked in"
              onClick={() => handleCardClick("off-duty")}
            />
            <StatCard
              isLoading={isLoading}
              title="Monthly Labor Cost"
              value={calculateMonthlyLaborCost()}
              change={8.2}
              icon="dollar"
              formatter={formatCurrency}
              description="Salary & benefits"
              onClick={() => handleCardClick("cost")}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!openDialog} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {openDialog === "workforce" && "Employee Workforce"}
              {openDialog === "on-duty" && "Employees On Duty"}
              {openDialog === "off-duty" && "Employees Off Duty"}
              {openDialog === "cost" && "Labor Cost Analysis"}
            </DialogTitle>
          </DialogHeader>
          {renderEmployeeDialogContent(
            openDialog,
            data,
            employeesOnDuty,
            employeesOffDuty
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Employee Detail Components
const EmployeeWorkforceDetails = ({
  data,
  employees,
}: {
  data: any;
  employees: any[];
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">
          {employees.length}
        </div>
        <div className="text-blue-800">Active Employees</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {
            employees.filter(
              (emp: any) => emp.timeEntries && emp.timeEntries.length > 0
            ).length
          }
        </div>
        <div className="text-green-800">On Duty</div>
      </div>
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">
          {
            employees.filter(
              (emp: any) => !emp.timeEntries || emp.timeEntries.length === 0
            ).length
          }
        </div>
        <div className="text-orange-800">Off Duty</div>
      </div>
    </div>

    <div className="border rounded-lg">
      <div className="p-4 font-semibold border-b">All Active Employees</div>
      <div className="max-h-96 overflow-y-auto">
        {employees.map((employee: any) => (
          <div
            key={employee.id}
            className="p-4 border-b last:border-b-0 hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    employee.timeEntries && employee.timeEntries.length > 0
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <div>
                  <div className="font-medium">
                    {employee.firstName} {employee.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {employee.position}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    employee.timeEntries && employee.timeEntries.length > 0
                      ? "default"
                      : "secondary"
                  }
                >
                  {employee.timeEntries && employee.timeEntries.length > 0
                    ? "On Duty"
                    : "Off Duty"}
                </Badge>
                <div className="text-sm text-gray-500 mt-1">
                  {employee.department?.name || "No Department"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const OnDutyEmployeesDetails = ({ employees }: { employees: any[] }) => (
  <div className="space-y-4">
    <div className="text-center p-6 bg-green-50 rounded-lg">
      <div className="text-3xl font-bold text-green-600">
        {employees.length}
      </div>
      <div className="text-green-800 font-medium">Employees On Duty</div>
      <div className="text-sm text-green-600 mt-2">
        Currently working and clocked in
      </div>
    </div>

    <div className="border rounded-lg">
      <div className="p-4 font-semibold border-b">On Duty Employees</div>
      <div className="max-h-96 overflow-y-auto">
        {employees.map((employee: any) => (
          <div
            key={employee.id}
            className="p-4 border-b last:border-b-0 hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {employee.firstName} {employee.lastName}
                </div>
                <div className="text-sm text-gray-500">{employee.position}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Time entries today: {employee.timeEntries?.length || 0}
                </div>
              </div>
              <Badge variant="default">On Duty</Badge>
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No employees on duty
          </div>
        )}
      </div>
    </div>
  </div>
);

const OffDutyEmployeesDetails = ({ employees }: { employees: any[] }) => (
  <div className="space-y-4">
    <div className="text-center p-6 bg-orange-50 rounded-lg">
      <div className="text-3xl font-bold text-orange-600">
        {employees.length}
      </div>
      <div className="text-orange-800 font-medium">Employees Off Duty</div>
      <div className="text-sm text-orange-600 mt-2">
        Not currently clocked in
      </div>
    </div>

    <div className="border rounded-lg">
      <div className="p-4 font-semibold border-b">Off Duty Employees</div>
      <div className="max-h-96 overflow-y-auto">
        {employees.map((employee: any) => (
          <div
            key={employee.id}
            className="p-4 border-b last:border-b-0 hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {employee.firstName} {employee.lastName}
                </div>
                <div className="text-sm text-gray-500">{employee.position}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Status: {employee.status}
                </div>
              </div>
              <Badge variant="secondary">Off Duty</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const LaborCostDetails = ({ data }: { data: any }) => {
  const employeeData = data?.employeeSummary || {};
  const monthlyCost = (employeeData.activeEmployees || 0) * 25000;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(monthlyCost)}
          </div>
          <div className="text-blue-800">Monthly Labor Cost</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(monthlyCost * 12)}
          </div>
          <div className="text-purple-800">Annual Labor Cost</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-gray-600">
            {employeeData.activeEmployees || 0}
          </div>
          <div className="text-gray-800">Active Employees</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-gray-600">
            {formatCurrency(25000)}
          </div>
          <div className="text-gray-800">Avg. Monthly Salary</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-gray-600">
            {formatCurrency(monthlyCost / (employeeData.activeEmployees || 1))}
          </div>
          <div className="text-gray-800">Cost per Employee</div>
        </div>
      </div>
    </div>
  );
};
