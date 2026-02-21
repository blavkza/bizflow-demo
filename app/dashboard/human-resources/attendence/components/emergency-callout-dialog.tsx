"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface EmergencyCallOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmergencyCallOutDialog({
  open,
  onOpenChange,
}: EmergencyCallOutDialogProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    employeeIds: [] as string[],
    freelancerIds: [] as string[],
    traineeIds: [] as string[],
    title: "Emergency Call Out",
    message:
      "You are required for an emergency call out. Please respond immediately.",
    startTime: "", // Initialize empty
  });

  useEffect(() => {
    if (open) {
      fetchAllStaff();
      if (!formData.startTime) {
        setFormData((prev) => ({
          ...prev,
          startTime: new Date().toISOString().slice(0, 16),
        }));
      }
    }
  }, [open]);

  const fetchAllStaff = async () => {
    try {
      setIsLoading(true);
      const [empRes, freeRes, trainRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/freelancers"),
        fetch("/api/trainees"),
      ]);

      const [empData, freeData, trainData] = await Promise.all([
        empRes.ok ? empRes.json() : { employees: [] },
        freeRes.ok ? freeRes.json() : { freelancers: [] },
        trainRes.ok ? trainRes.json() : { trainees: [] },
      ]);

      setEmployees(Array.isArray(empData.employees) ? empData.employees : []);
      setFreelancers(
        Array.isArray(freeData.freelancers) ? freeData.freelancers : [],
      );
      setTrainees(Array.isArray(trainData.trainees) ? trainData.trainees : []);
    } catch (error) {
      toast.error("Failed to load staff");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const totalSelected =
      formData.employeeIds.length +
      formData.freelancerIds.length +
      formData.traineeIds.length;

    if (totalSelected === 0 || !formData.title || !formData.startTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      // Fix timezone issue:
      // datetime-local gives "2026-01-30T09:00" (no timezone)
      // We need to tell the server this is in the user's local timezone
      // Get user's timezone offset and append it
      const timezoneOffset = -new Date().getTimezoneOffset(); // in minutes, already negated for proper sign
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset >= 0 ? "+" : "-";
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;

      // Append timezone: "2026-01-30T09:00" becomes "2026-01-30T09:00+02:00"
      const startTimeWithTZ = `${formData.startTime}:00${offsetString}`;

      const payload = {
        ...formData,
        startTime: startTimeWithTZ,
      };

      const res = await fetch("/api/attendance/callout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to trigger call out");
      }

      toast.success(
        `${totalSelected} emergency call outs triggered successfully`,
      );
      onOpenChange(false);
      // Reset form
      setFormData({
        employeeIds: [],
        freelancerIds: [],
        traineeIds: [],
        title: "Emergency Call Out",
        message:
          "You are required for an emergency call out. Please respond immediately.",
        startTime: new Date().toISOString().slice(0, 16),
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const staffOptions = [
    ...(employees || []).map((emp) => ({
      label: `[EMP] ${emp.name || `${emp.firstName} ${emp.lastName}`} (${emp.employeeNumber})`,
      value: `emp-${emp.id}`,
    })),
    ...(freelancers || []).map((free) => ({
      label: `[FREE] ${free.firstName} ${free.lastName} (${free.freeLancerNumber})`,
      value: `free-${free.id}`,
    })),
    ...(trainees || []).map((train) => ({
      label: `[TRAIN] ${train.firstName} ${train.lastName} (${train.traineeNumber})`,
      value: `train-${train.id}`,
    })),
  ];

  const selectedValues = [
    ...formData.employeeIds.map((id) => `emp-${id}`),
    ...formData.freelancerIds.map((id) => `free-${id}`),
    ...formData.traineeIds.map((id) => `train-${id}`),
  ];

  const handleStaffChange = (vals: string[]) => {
    const employeeIds = vals
      .filter((v) => v.startsWith("emp-"))
      .map((v) => v.replace("emp-", ""));
    const freelancerIds = vals
      .filter((v) => v.startsWith("free-"))
      .map((v) => v.replace("free-", ""));
    const traineeIds = vals
      .filter((v) => v.startsWith("train-"))
      .map((v) => v.replace("train-", ""));

    setFormData({ ...formData, employeeIds, freelancerIds, traineeIds });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Trigger Emergency Call Out
          </DialogTitle>
          <DialogDescription>
            This will send high-priority notifications to the selected
            employees' mobile app.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="staff">Select Recipients *</Label>
            <MultiSelect
              options={staffOptions}
              selected={selectedValues}
              onChange={handleStaffChange}
              placeholder="Select employees, freelancers or trainees..."
              loading={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="startTime">Expected Start Time *</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Provide more details about the emergency..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (formData.employeeIds.length === 0 &&
                formData.freelancerIds.length === 0 &&
                formData.traineeIds.length === 0)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Triggering...
              </>
            ) : (
              "Send Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

