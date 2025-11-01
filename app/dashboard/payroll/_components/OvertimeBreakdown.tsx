// components/payroll/OvertimeBreakdown.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { formatCurrency, formatHours } from "../utils";

interface OvertimeBreakdownProps {
  employeesWithOvertime: any[];
}

export function OvertimeBreakdown({
  employeesWithOvertime,
}: OvertimeBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Overtime Breakdown
          {employeesWithOvertime.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {employeesWithOvertime.length} employees
            </Badge>
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
            {employeesWithOvertime.map((employee) => (
              <Card
                key={employee.id}
                className="bg-orange-50 border-orange-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </p>
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
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Base Salary:
                      </span>
                      <p>{formatCurrency(employee.baseAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
