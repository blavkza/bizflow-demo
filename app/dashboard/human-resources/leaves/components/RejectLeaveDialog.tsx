import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface RejectLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (comments: string) => Promise<boolean>;
  employeeName: string;
  leaveType: string;
}

export default function RejectLeaveDialog({
  open,
  onOpenChange,
  onReject,
  employeeName,
  leaveType,
}: RejectLeaveDialogProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for rejecting this leave request",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onReject(rejectReason);
      if (success) {
        setRejectReason("");
        onOpenChange(false);
      }
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRejectReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Leave Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting {employeeName}'s {leaveType}{" "}
            leave request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejectReason">Reason for Rejection *</Label>
            <Textarea
              id="rejectReason"
              placeholder="Enter the reason for rejecting this leave request..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              This reason will be visible to the employee.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting || !rejectReason.trim()}
          >
            {isSubmitting ? "Rejecting..." : "Reject Leave"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
