import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Save } from "lucide-react";

interface PayrollActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  canProcess: boolean;
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
  isDraft?: boolean;
}

export function PayrollActions({
  onCancel,
  isSubmitting,
  canProcess,
  onSaveDraft,
  isSavingDraft,
  isDraft,
}: PayrollActionsProps) {
  return (
    <div className="flex justify-end gap-4 pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting || isSavingDraft}
      >
        Cancel
      </Button>

      {onSaveDraft && (
        <Button
          type="button"
          variant="secondary"
          onClick={onSaveDraft}
          disabled={isSubmitting || isSavingDraft}
          className="min-w-32"
        >
          {isSavingDraft ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </>
          )}
        </Button>
      )}

      <Button
        type="submit"
        disabled={!canProcess || isSubmitting || isSavingDraft}
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
            {isDraft ? "Process Draft" : "Process Payroll"}
          </>
        )}
      </Button>
    </div>
  );
}
