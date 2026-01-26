import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarOff,
  Users,
  UserCheck,
  Briefcase,
  Building,
} from "lucide-react";

interface PayrollNoDataStateProps {
  selectedMonth: string;
  workerType: string;
  selectedDepartments: string[]; // Add this prop
}

export function PayrollNoDataState({
  selectedMonth,
  workerType,
  selectedDepartments,
}: PayrollNoDataStateProps) {
  const getWorkerTypeLabel = () => {
    switch (workerType) {
      case "employees":
        return "employees";
      case "freelancers":
        return "freelancers";
      default:
        return "workers";
    }
  };

  const getWorkerTypeIcon = () => {
    switch (workerType) {
      case "employees":
        return <UserCheck className="h-8 w-8" />;
      case "freelancers":
        return <Briefcase className="h-8 w-8" />;
      default:
        return <Users className="h-8 w-8" />;
    }
  };

  // Helper to format department message
  const getDepartmentMessage = () => {
    if (!selectedDepartments || selectedDepartments.length === 0) {
      return "";
    }

    if (selectedDepartments.length === 1) {
      return " in the selected department";
    }

    return ` in ${selectedDepartments.length} selected departments`;
  };

  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            {getWorkerTypeIcon()}
            <CalendarOff className="h-8 w-8" />
            {selectedDepartments.length > 0 && <Building className="h-8 w-8" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold">No Payroll Data Available</h3>
            <p className="text-muted-foreground mt-2">
              No {getWorkerTypeLabel()} found for {selectedMonth}
              {getDepartmentMessage()} with attendance records.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Make sure {getWorkerTypeLabel()} have clocked in/out records for
              this period.
            </p>

            {/* Show department-specific message if departments are selected */}
            {selectedDepartments.length > 0 && (
              <div className="mt-4 p-3 bg-muted/30 rounded-md">
                <p className="text-sm">
                  <Building className="h-4 w-4 inline mr-1" />
                  <span className="font-medium">
                    Department Filter Active:
                  </span>{" "}
                  Showing results for{" "}
                  {selectedDepartments.length === 1
                    ? "1 department"
                    : `${selectedDepartments.length} departments`}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
