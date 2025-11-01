// components/payroll/PayrollAlerts.tsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PayrollAlertsProps {
  payrollRestriction: {
    canProcess: boolean;
    message?: string;
  } | null;
}

export function PayrollAlerts({ payrollRestriction }: PayrollAlertsProps) {
  if (!payrollRestriction) return null;

  if (!payrollRestriction.canProcess) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{payrollRestriction.message}</AlertDescription>
      </Alert>
    );
  }

  if (payrollRestriction.message) {
    return (
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          {payrollRestriction.message}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
