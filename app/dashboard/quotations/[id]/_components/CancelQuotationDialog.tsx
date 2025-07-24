"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";

interface CancelQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  status: string;
  refresh: () => void;
}

export const CancelQuotationDialog = ({
  open,
  onOpenChange,
  quotationId,
  status,
  refresh,
}: CancelQuotationDialogProps) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async () => {
    try {
      setIsProcessing(true);

      await axios.patch(`/api/quotations/${quotationId}/cancel`);
      toast.success(
        `Quotation ${status === "CANCELLED" ? "uncancelled" : "cancelled"} successfully`
      );

      router.refresh();
      refresh;
    } catch (error) {
      console.error("Error processing quotation:", error);
      toast.error(
        `Failed to ${status === "CANCELLED" ? "uncancel" : "cancel"} quotation`
      );
    } finally {
      setIsProcessing(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {status === "CANCELLED"
              ? "Undo Cancel Quotation"
              : "Cancel Quotation"}
          </DialogTitle>
          <DialogDescription>
            {status === "CANCELLED"
              ? "Are you sure you want to undo the cancellation of this quotation?"
              : "Are you sure you want to cancel this quotation? This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            No, keep it
          </Button>
          <Button
            variant={status === "CANCELLED" ? "default" : "destructive"}
            onClick={handleAction}
            disabled={isProcessing}
          >
            {isProcessing ? (
              "Processing..."
            ) : (
              <>
                {status === "CANCELLED" && <Undo2 className="mr-2 h-4 w-4" />}
                {status === "CANCELLED" ? "Yes, undo cancel" : "Yes, cancel it"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
