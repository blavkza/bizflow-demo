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

  // Calculate on/off duty based on status and AttendanceRecord
  const activeEmployees = employees.filter(
    (emp: any) => emp.status === "ACTIVE"
  );
  const employeesOnDuty = activeEmployees.filter(
    (emp: any) => emp.AttendanceRecord && emp.AttendanceRecord.length > 0
  );
  const employeesOffDuty = activeEmployees.filter(
    (emp: any) => !emp.AttendanceRecord || emp.AttendanceRecord.length === 0
  );

  const handleCardClick = (type: string) => {
    setOpenDialog(type);
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
      case "on-leave":
        return <OnLeaveEmployeesDetails data={data} />;
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
              icon="users"
              description={`${employeesOnDuty.length} on duty`}
              onClick={() => handleCardClick("workforce")}
            />
            <StatCard
              isLoading={isLoading}
              title="On Duty Today"
              value={employeesOnDuty.length}
              icon="user-check"
              description="Currently working"
              onClick={() => handleCardClick("on-duty")}
            />
            <StatCard
              isLoading={isLoading}
              title="Off Duty Today"
              value={employeesOffDuty.length}
              icon="user-x"
              description="Not clocked in"
              onClick={() => handleCardClick("off-duty")}
            />
            <StatCard
              isLoading={isLoading}
              title="On Leave"
              value={employeeData.onLeave}
              icon="calendar"
              description="All Employees On Leave"
              onClick={() => handleCardClick("on-leave")}
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
              {openDialog === "on-leave" && "Employees On Leave"}
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
              (emp: any) =>
                emp.AttendanceRecord && emp.AttendanceRecord.length > 0
            ).length
          }
        </div>
        <div className="text-green-800">On Duty</div>
      </div>
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">
          {
            employees.filter(
              (emp: any) =>
                !emp.AttendanceRecord || emp.AttendanceRecord.length === 0
            ).length
          }
        </div>
        <div className="text-orange-800">Off Duty</div>
      </div>
    </div>

    <div className="border rounded-lg">
      <div className="p-4 font-semibold border-b">All Active Employees</div>
      <div className="max-h-96 overflow-y-auto">
        {employees.length > 0 ? (
          employees.map((employee: any) => (
            <div
              key={employee.id}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      employee.AttendanceRecord &&
                      employee.AttendanceRecord.length > 0
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
                      employee.AttendanceRecord &&
                      employee.AttendanceRecord.length > 0
                        ? "default"
                        : "secondary"
                    }
                  >
                    {employee.AttendanceRecord &&
                    employee.AttendanceRecord.length > 0
                      ? "On Duty"
                      : "Off Duty"}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-1">
                    {employee.department?.name || "No Department"}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No employees data available
          </div>
        )}
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
        {employees.length > 0 ? (
          employees.map((employee: any) => (
            <div
              key={employee.id}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {employee.firstName} {employee.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {employee.position}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Attendance records today:{" "}
                    {employee.AttendanceRecord?.length || 0}
                  </div>
                </div>
                <Badge variant="default">On Duty</Badge>
              </div>
            </div>
          ))
        ) : (
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
        {employees.length > 0 ? (
          employees.map((employee: any) => (
            <div
              key={employee.id}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {employee.firstName} {employee.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {employee.position}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Status: {employee.status}
                  </div>
                </div>
                <Badge variant="secondary">Off Duty</Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No employees off duty
          </div>
        )}
      </div>
    </div>
  </div>
);

const OnLeaveEmployeesDetails = ({ data }: { data: any }) => {
  const employeeData = data?.employeeSummary || {};
  const employees = data?.employees || [];

  // Get employees who are on leave (have approved leave requests)
  const employeesOnLeave = employees.filter(
    (employee: any) =>
      employee.leaveRequests && employee.leaveRequests.length > 0
  );

  return (
    <div className="space-y-4">
      <div className="text-center p-6 bg-red-50 rounded-lg">
        <div className="text-3xl font-bold text-red-600">
          {employeeData.onLeave || 0}
        </div>
        <div className="text-red-800 font-medium">Employees On Leave</div>
        <div className="text-sm text-red-600 mt-2">
          Currently on approved leave
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="p-4 font-semibold border-b">Employees On Leave</div>
        <div className="max-h-96 overflow-y-auto">
          {employeesOnLeave.length > 0 ? (
            employeesOnLeave.map((employee: any) => (
              <div
                key={employee.id}
                className="p-4 border-b last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {employee.position}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Leave requests: {employee.leaveRequests?.length || 0}
                    </div>
                  </div>
                  <Badge variant="destructive">On Leave</Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              No employees on leave
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
