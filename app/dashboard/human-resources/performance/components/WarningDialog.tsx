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
import { WarningFormData } from "../types";

interface WarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateWarning: (data: WarningFormData) => void;
  employeeId: string;
  employeeName: string;
  canEditPerfomance: boolean;
  hasFullAccess: boolean;
}

export default function WarningDialog({
  open,
  onOpenChange,
  onGenerateWarning,
  employeeId,
  employeeName,
  canEditPerfomance,
  hasFullAccess,
}: WarningDialogProps) {
  const [formData, setFormData] = useState<WarningFormData>({
    type: "",
    severity: "",
    reason: "",
    actionPlan: "",
    employeeId: employeeId,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleGenerate = async () => {
    setSubmitting(true);
    try {
      await onGenerateWarning(formData);
      setFormData({
        type: "",
        severity: "",
        reason: "",
        actionPlan: "",
        employeeId,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to generate warning:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      type: "",
      severity: "",
      reason: "",
      actionPlan: "",
      employeeId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Performance Warning</DialogTitle>
          <DialogDescription>
            Create a formal warning for {employeeName}. Warnings can be reversed
            later if performance improves.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="warningType">Warning Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select warning type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="conduct">Conduct</SelectItem>
                <SelectItem value="goals">Goal Achievement</SelectItem>
                <SelectItem value="quality">Quality Issues</SelectItem>
                <SelectItem value="teamwork">Teamwork</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="severity">Severity Level</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) =>
                setFormData({ ...formData, severity: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verbal">Verbal Warning</SelectItem>
                <SelectItem value="written">Written Warning</SelectItem>
                <SelectItem value="final">Final Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Warning</Label>
            <Textarea
              id="reason"
              placeholder="Describe the performance issues and specific incidents..."
              rows={4}
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actionPlan">Improvement Action Plan</Label>
            <Textarea
              id="actionPlan"
              placeholder="Outline specific steps for improvement and timeline..."
              rows={3}
              value={formData.actionPlan}
              onChange={(e) =>
                setFormData({ ...formData, actionPlan: e.target.value })
              }
            />
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
            onClick={handleGenerate}
            disabled={
              !formData.type ||
              !formData.severity ||
              !formData.reason ||
              submitting
            }
          >
            {submitting ? "Generating..." : "Generate Warning"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
