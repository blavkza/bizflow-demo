"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResolveWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolveWarning: (
    warningId: string,
    status: string,
    notes: string,
    adminDecision?: string,
  ) => void;
  warning: any;
}

export default function ResolveWarningDialog({
  open,
  onOpenChange,
  onResolveWarning,
  warning,
}: ResolveWarningDialogProps) {
  const [status, setStatus] = useState<string>("RESOLVED");
  const [notes, setNotes] = useState("");
  const [adminDecision, setAdminDecision] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset state when warning changes or dialog opens
  useEffect(() => {
    if (open && warning) {
      if (warning.status === "APPEALED") {
        setStatus("REJECTED");
      } else {
        setStatus("RESOLVED");
      }
      setNotes("");
      setAdminDecision("");
    }
  }, [open, warning]);

  const handleAction = async () => {
    if (status === "RESOLVED" && !notes.trim()) {
      alert("Please provide resolution notes");
      return;
    }

    if (
      (status === "REJECTED" || status === "NEXT_STEP") &&
      !adminDecision.trim()
    ) {
      alert("Please provide the admin decision / reasons");
      return;
    }

    setSubmitting(true);
    try {
      await onResolveWarning(warning.id, status, notes, adminDecision);
      setNotes("");
      setAdminDecision("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update warning:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNotes("");
    setAdminDecision("");
    onOpenChange(false);
  };

  if (!warning) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Handle Warning: {warning.type}</DialogTitle>
          <DialogDescription>
            Manage the warning status for {warning.employee.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground font-bold">
                Original Reason
              </Label>
              <p className="text-sm border p-2 rounded bg-muted/30">
                {warning.reason}
              </p>
            </div>
            {warning.appealReason && (
              <div className="space-y-1">
                <Label className="text-xs uppercase text-amber-600 font-bold">
                  Worker Appeal
                </Label>
                <p className="text-sm border border-amber-200 p-2 rounded bg-amber-50 italic">
                  "{warning.appealReason}"
                </p>
              </div>
            )}
            {warning.adminDecision && (
              <div className="space-y-1">
                <Label className="text-xs uppercase text-blue-600 font-bold">
                  Issued Next Steps
                </Label>
                <p className="text-sm border border-blue-200 p-2 rounded bg-blue-50">
                  {warning.adminDecision}
                </p>
              </div>
            )}
            {warning.workerResponse === "ACCEPTED" && (
              <div className="space-y-1">
                <Label className="text-xs uppercase text-green-600 font-bold">
                  Worker Acknowledgment
                </Label>
                <div className="text-sm border border-green-200 p-2 rounded bg-green-50 flex flex-col">
                  <span className="font-medium text-green-800">ACCEPTED</span>
                  <span className="text-xs text-green-600 mt-1">
                    Acknowledged on{" "}
                    {warning.workerResponseDate
                      ? new Date(
                          warning.workerResponseDate,
                        ).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Action to Take</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESOLVED">
                  Mark as Resolved (End Warning)
                </SelectItem>
                <SelectItem value="REJECTED">
                  Reject Appeal (Keep Active)
                </SelectItem>
                <SelectItem value="NEXT_STEP">
                  Issue Next Step (Action Required)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "RESOLVED" ? (
            <div className="space-y-2">
              <Label htmlFor="resolutionNotes">Resolution Notes *</Label>
              <Textarea
                id="resolutionNotes"
                placeholder="Describe how the issue was resolved..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="adminDecision">
                Admin Decision / Instructions *
              </Label>
              <Textarea
                id="adminDecision"
                placeholder={
                  status === "REJECTED"
                    ? "Reason for rejection..."
                    : "What the worker needs to do next..."
                }
                rows={3}
                value={adminDecision}
                onChange={(e) => setAdminDecision(e.target.value)}
              />
              <p className="text-xs text-muted-foreground italic">
                {status === "REJECTED"
                  ? "This will be shown to the worker to explain why their appeal was not accepted."
                  : "The worker will be notified and asked to acknowledge these next steps."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={submitting}
            className={
              status === "RESOLVED"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            }
          >
            {submitting ? "Processing..." : "Submit Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
