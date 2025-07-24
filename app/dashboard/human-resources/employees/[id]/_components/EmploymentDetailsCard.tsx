"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmployeeWithDetails } from "@/types/employee";

export function EmploymentDetailsCard({
  employee,
}: {
  employee: EmployeeWithDetails;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800";
      case "Inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Manager</p>
          <p className="text-sm text-muted-foreground">
            {employee.department?.manager?.name}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Start Date</p>
          <p className="text-sm text-muted-foreground">
            {new Date(employee.hireDate).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Status</p>
          <Badge className={getStatusColor(employee.status)}>
            {employee.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
