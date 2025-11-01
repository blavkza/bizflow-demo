import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface PayrollNoDataStateProps {
  selectedMonth: string;
}

export function PayrollNoDataState({ selectedMonth }: PayrollNoDataStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          No payroll data available
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          No attendance records found for{" "}
          {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          })}
          . Please check if attendance records exist for this period.
        </p>
      </CardContent>
    </Card>
  );
}
