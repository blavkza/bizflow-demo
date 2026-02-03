"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
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
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface ApproveReturnDialogProps {
  record: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApproveReturnDialog({
  record,
  isOpen,
  onClose,
  onSuccess,
}: ApproveReturnDialogProps) {
  const [loading, setLoading] = useState(false);
  const [damageCost, setDamageCost] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [status, setStatus] = useState<string>("");

  const handleProcess = async (reject: boolean = false) => {
    try {
      setLoading(true);
      await axios.patch(`/api/worker-tools/return/${record.id}/approve`, {
        damageCost: damageCost ? parseFloat(damageCost) : 0,
        status: status || undefined,
        adminNotes,
        reject,
      });

      toast.success(
        reject ? "Return request rejected" : "Return approved successfully",
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Process Return: {record.toolName}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Worker:</span>
              <span className="font-bold">{record.workerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-bold">{record.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Condition reported:</span>
              <span className="font-bold">{record.condition}</span>
            </div>
            {record.damageDescription && (
              <div className="mt-2 pt-2 border-t">
                <span className="text-muted-foreground block mb-1">
                  Damage Description:
                </span>
                <p className="italic font-medium text-destructive">
                  "{record.damageDescription}"
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="damageCost">Damage Cost (R)</Label>
            <Input
              id="damageCost"
              type="number"
              placeholder="0.00"
              value={damageCost}
              onChange={(e) => setDamageCost(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Final Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select final status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">
                  Available (Back to stock)
                </SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="DAMAGED">Damaged</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Admin Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for the worker..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => handleProcess(true)}
            disabled={loading}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={() => handleProcess(false)} disabled={loading}>
              {loading && (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve Return
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
