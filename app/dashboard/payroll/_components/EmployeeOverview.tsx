import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { EmployeeCard } from "./EmployeeCard";

interface EmployeeOverviewProps {
  payrollData: any[];
}

export function EmployeeOverview({ payrollData }: EmployeeOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Employee Payroll Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {payrollData.map((employee, index) => (
          <div key={employee.id}>
            {index > 0 && <Separator />}
            <EmployeeCard employee={employee} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
