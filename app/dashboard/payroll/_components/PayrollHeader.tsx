import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface PayrollHeaderProps {
  employeesWithOvertime: any[];
  onRecalculateOvertime: () => void;
}

export function PayrollHeader({
  employeesWithOvertime,
  onRecalculateOvertime,
}: PayrollHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Process Payroll</h2>
        <p className="text-muted-foreground">
          Generate and process payroll for your employees
        </p>
      </div>
      {employeesWithOvertime.length > 0 && (
        <Button
          onClick={onRecalculateOvertime}
          variant="outline"
          className="mt-2 sm:mt-0"
        >
          <Zap className="h-4 w-4 mr-2" />
          Recalculate Overtime
        </Button>
      )}
    </div>
  );
}
