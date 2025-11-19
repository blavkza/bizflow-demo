import { Card, CardContent } from "@/components/ui/card";
import { CalendarOff, Users, UserCheck, Briefcase } from "lucide-react";

interface PayrollNoDataStateProps {
  selectedMonth: string;
  workerType: string;
}

export function PayrollNoDataState({
  selectedMonth,
  workerType,
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

  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            {getWorkerTypeIcon()}
            <CalendarOff className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No Payroll Data Available</h3>
            <p className="text-muted-foreground mt-2">
              No {getWorkerTypeLabel()} found for {selectedMonth} with
              attendance records.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Make sure {getWorkerTypeLabel()} have clocked in/out records for
              this period.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
