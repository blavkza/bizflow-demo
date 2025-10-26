"use client";

import { useState } from "react";
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
  onResolveWarning: (warningId: string, resolutionNotes: string) => void;
  warningId: string;
  employeeName: string;
  warningType: string;
  warningReason: string;
}

export default function ResolveWarningDialog({
  open,
  onOpenChange,
  onResolveWarning,
  warningId,
  employeeName,
  warningType,
  warningReason,
}: ResolveWarningDialogProps) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      alert("Please provide resolution notes");
      return;
    }

    setSubmitting(true);
    try {
      await onResolveWarning(warningId, resolutionNotes);
      setResolutionNotes("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to resolve warning:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setResolutionNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Warning</DialogTitle>
          <DialogDescription>
            Mark this warning as resolved for {employeeName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Warning Type</Label>
            <p className="text-sm text-muted-foreground capitalize">
              {warningType}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Original Reason</Label>
            <p className="text-sm text-muted-foreground">{warningReason}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resolutionNotes">Resolution Notes *</Label>
            <Textarea
              id="resolutionNotes"
              placeholder="Describe how the issue was resolved, improvements made, or reasons for reversal..."
              rows={4}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Required. Explain what actions were taken to resolve this warning.
            </p>
          </div>
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
            onClick={handleResolve}
            disabled={!resolutionNotes.trim() || submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? "Resolving..." : "Mark as Resolved"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
