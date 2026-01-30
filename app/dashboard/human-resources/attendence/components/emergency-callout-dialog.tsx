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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    employeeIds: [] as string[],
    title: "Emergency Call Out",
    message: "You are required for an emergency call out. Please respond immediately.",
    startTime: "", // Initialize empty
  });

  useEffect(() => {
    if (open) {
      fetchEmployees();
      if (!formData.startTime) {
        setFormData(prev => ({ 
          ...prev, 
          startTime: new Date().toISOString().slice(0, 16) 
        }));
      }
    }
  }, [open]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      setEmployees(Array.isArray(data.employees) ? data.employees : []);
    } catch (error) {
      toast.error("Failed to load employees");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.employeeIds.length === 0 || !formData.title || !formData.startTime) {
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
      const offsetSign = timezoneOffset >= 0 ? '+' : '-';
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
      
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

      toast.success(`${formData.employeeIds.length} emergency call outs triggered successfully`);
      onOpenChange(false);
      // Reset form
      setFormData({
        employeeIds: [],
        title: "Emergency Call Out",
        message: "You are required for an emergency call out. Please respond immediately.",
        startTime: new Date().toISOString().slice(0, 16),
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const employeeOptions = (employees || []).map(emp => ({
    label: `${emp.name || `${emp.firstName} ${emp.lastName}`} (${emp.employeeNumber})`,
    value: emp.id
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Trigger Emergency Call Out
          </DialogTitle>
          <DialogDescription>
            This will send high-priority notifications to the selected employees' mobile app.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="employee">Select Employees *</Label>
            <MultiSelect
              options={employeeOptions}
              selected={formData.employeeIds}
              onChange={(vals) => setFormData({ ...formData, employeeIds: vals })}
              placeholder="Select employees..."
              loading={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="startTime">Expected Start Time *</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Provide more details about the emergency..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
            disabled={isSubmitting || formData.employeeIds.length === 0}
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
