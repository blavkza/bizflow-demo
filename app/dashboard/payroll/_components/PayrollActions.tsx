import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

interface PayrollActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  canProcess: boolean;
}

export function PayrollActions({
  onCancel,
  isSubmitting,
  canProcess,
}: PayrollActionsProps) {
  return (
    <div className="flex justify-end gap-4 pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={!canProcess || isSubmitting}
        className="min-w-32"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Process Payroll
          </>
        )}
      </Button>
    </div>
  );
}
