import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, UserCheck, Briefcase } from "lucide-react";
import { formatCurrency, formatHours } from "../utils";

interface OvertimeBreakdownProps {
  employeesWithOvertime: any[];
}

export function OvertimeBreakdown({
  employeesWithOvertime,
}: OvertimeBreakdownProps) {
  // Count workers by type
  const employeesCount = employeesWithOvertime.filter(
    (emp) => !emp.isFreelancer
  ).length;
  const freelancersCount = employeesWithOvertime.filter(
    (emp) => emp.isFreelancer
  ).length;

  const getWorkerTypeIcon = (employee: any) => {
    return employee.isFreelancer ? Briefcase : UserCheck;
  };

  const getWorkerTypeBadge = (employee: any) => {
    const Icon = getWorkerTypeIcon(employee);
    return (
      <Badge
        variant={employee.isFreelancer ? "secondary" : "outline"}
        className="flex items-center gap-1 text-xs"
      >
        <Icon className="h-3 w-3" />
        {employee.isFreelancer ? "Freelancer" : "Employee"}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Overtime Breakdown
          {employeesWithOvertime.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <Badge variant="secondary">
                {employeesWithOvertime.length} workers
              </Badge>
              {employeesCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {employeesCount} emp
                </Badge>
              )}
              {freelancersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {freelancersCount} free
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {employeesWithOvertime.length === 0 ? (
          <div className="text-center p-8">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No overtime recorded for this period
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {employeesWithOvertime.map((employee) => {
              const WorkerTypeIcon = getWorkerTypeIcon(employee);

              return (
                <Card
                  key={employee.id}
                  className="bg-orange-50 border-orange-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </p>
                          {getWorkerTypeBadge(employee)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {employee.department?.name || "No department"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">
                          +{formatCurrency(employee.overtimeAmount)}
                        </p>
                        <p className="text-sm text-orange-600">
                          {formatHours(employee.overtimeHours)} overtime
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Calculation:
                        </span>
                        <p className="text-orange-700">
                          {employee.overtimeHours}h × R
                          {employee.overtimeFixedRate}/h
                          <span className="text-orange-600 text-xs ml-1">
                            (Individual Rate)
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {employee.isFreelancer ||
                          employee.salaryType === "DAILY"
                            ? "Daily Salary"
                            : "Monthly Salary"}
                          :
                        </span>
                        <p>{formatCurrency(employee.baseAmount)}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <WorkerTypeIcon className="h-3 w-3" />
                        <span>
                          {employee.isFreelancer
                            ? "Freelancer - Daily Rate"
                            : `${employee.salaryType} Employee`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
