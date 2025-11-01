import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
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
import { ManualCheckInData } from "../types";
import { Loader2 } from "lucide-react";

interface ManualCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkInType: "in" | "out";
  setCheckInType: (type: "in" | "out") => void;
  onCheckIn: (data: ManualCheckInData) => void;
  isLoading: boolean;
}

export function ManualCheckInDialog({
  open,
  onOpenChange,
  checkInType,
  setCheckInType,
  onCheckIn,
  isLoading,
}: ManualCheckInDialogProps) {
  const [formData, setFormData] = useState<ManualCheckInData>({
    employeeId: "",
    location: "",
    notes: "",
  });

  const handleSubmit = () => {
    if (!formData.employeeId || !formData.location) {
      return;
    }
    onCheckIn(formData);
    setFormData({ employeeId: "", location: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <div style={{ display: "none" }} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual Check-In/Out</DialogTitle>
          <DialogDescription>
            Record attendance manually without GPS or barcode
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Check-In Type</Label>
            <Select
              value={checkInType}
              onValueChange={(value: "in" | "out") => setCheckInType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Check In</SelectItem>
                <SelectItem value="out">Check Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID *</Label>
            <Input
              id="employeeId"
              placeholder="EMP001"
              value={formData.employeeId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  employeeId: e.target.value.toUpperCase(),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="Main Office, Client Site, etc."
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.employeeId || !formData.location}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : checkInType === "in" ? (
              "Check In"
            ) : (
              "Check Out"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
