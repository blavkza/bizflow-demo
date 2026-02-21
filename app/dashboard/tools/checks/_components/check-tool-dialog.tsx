"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Tool } from "./types";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CheckToolDialogProps {
  tool: Tool | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckToolDialog({
  tool,
  isOpen,
  onClose,
  onSuccess,
}: CheckToolDialogProps) {
  const [loading, setLoading] = useState(false);
  const [condition, setCondition] = useState("GOOD");
  const [status, setStatus] = useState<"present" | "lost">("present");
  const [damageCost, setDamageCost] = useState("");
  const [damageDescription, setDamageDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [deductFromWorker, setDeductFromWorker] = useState(false);
  const [pushToMaintenance, setPushToMaintenance] = useState(false);

  // Reset form when tool changes or dialog opens
  useEffect(() => {
    if (tool && isOpen) {
      setCondition(tool.condition || "GOOD");
      setStatus("present");
      setDamageCost("");
      setDamageDescription("");
      setNotes("");
      setDeductFromWorker(false);
      setPushToMaintenance(false);
    }
  }, [tool, isOpen]);

  // Handle status change
  useEffect(() => {
    if (status === "lost" && tool) {
      setDamageCost(tool.purchasePrice.toString());
      setCondition("LOST");
      setDeductFromWorker(true);
    } else if (status === "present") {
      if (condition !== "DAMAGED") {
        setDamageCost("");
      }
    }
  }, [status, tool]);

  // Pre-fill cost if condition changes to DAMAGED while present
  useEffect(() => {
    if (status === "present" && condition === "DAMAGED" && !damageCost) {
      setDamageCost(""); // Let them enter it, or maybe pre-fill? User said "apply to cost".
      // I'll leave it empty for manual entry for repairs, but lost pre-fills.
    }
  }, [condition]);

  const handleSubmit = async () => {
    if (!tool) return;

    try {
      setLoading(true);

      const checkData = {
        toolId: tool.id,
        employeeId: tool.employeeId,
        freelancerId: tool.freelancerId,
        traineeId: tool.traineeId,
        condition: status === "lost" ? "DAMAGED" : condition,
        isPresent: status === "present",
        isLost: status === "lost",
        damageCost: damageCost ? parseFloat(damageCost) : 0,
        damageDescription: damageDescription || null,
        notes: notes || null,
        deductFromWorker,
        pushToMaintenance,
      };

      const response = await fetch("/api/tool-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to submit check");
      }

      toast.success("Tool check recorded successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error submitting check:", error);
      toast.error(error.message || "Failed to submit check");
    } finally {
      setLoading(false);
    }
  };

  const showCostInput = condition === "DAMAGED" || status === "lost";

  if (!tool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conduct Tool Check</DialogTitle>
          <DialogDescription>
            Record the current condition and status of {tool.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tool Info */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{tool.name}</h3>
                <p className="text-sm text-muted-foreground">
                  S/N: {tool.serialNumber || "N/A"}
                </p>
              </div>
              {tool.images && tool.images[0] && (
                <Image
                  src={tool.images[0]}
                  alt={tool.name}
                  width={80}
                  height={80}
                  className="rounded-md object-cover border bg-background"
                />
              )}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-muted-foreground/20">
              <div className="text-sm">
                <span className="text-muted-foreground">Allocated to:</span>{" "}
                <span className="font-medium">{tool.workerName}</span>
              </div>
              <div className="text-sm font-bold text-blue-600">
                Price: R {tool.purchasePrice.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label>Tool Availability Status</Label>
            <Tabs
              value={status}
              onValueChange={(v) => setStatus(v as "present" | "lost")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="present" className="text-sm font-medium">
                  Tool is Present
                </TabsTrigger>
                <TabsTrigger
                  value="lost"
                  className="text-sm font-medium data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
                >
                  Tool is Lost
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-6">
            {status === "present" && (
              <div className="space-y-2">
                <Label htmlFor="condition">Tool Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOOD">Good (Minor wear)</SelectItem>
                    <SelectItem value="FAIR">Fair (Functioning)</SelectItem>
                    <SelectItem value="POOR">Poor (Requires attn)</SelectItem>
                    <SelectItem value="DAMAGED">Damaged (Broken)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showCostInput && (
              <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <Label htmlFor="damageCost">
                    {status === "lost"
                      ? "Replacement Value (R)"
                      : "Repair Estimate (R)"}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                      R
                    </span>
                    <Input
                      id="damageCost"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      value={damageCost}
                      onChange={(e) => setDamageCost(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  {status === "lost" && (
                    <p className="text-[10px] text-muted-foreground italic">
                      Pre-filled with purchase price. Edit if necessary.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Deduct from worker?
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Apply this cost to the worker's record
                    </p>
                  </div>
                  <Switch
                    checked={deductFromWorker}
                    onCheckedChange={setDeductFromWorker}
                  />
                </div>

                {status !== "lost" && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        Push to Maintenance?
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Mark as Maintenance and Return from worker automatically
                      </p>
                    </div>
                    <Switch
                      checked={pushToMaintenance}
                      onCheckedChange={setPushToMaintenance}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="space-y-4 pt-2">
            {showCostInput && (
              <div className="space-y-2">
                <Label htmlFor="damageDescription">
                  {status === "lost" ? "Loss Details" : "Damage Details"}
                </Label>
                <Textarea
                  id="damageDescription"
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  placeholder={
                    status === "lost"
                      ? "Circumstances of loss..."
                      : "What specifically is broken?"
                  }
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Check Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional observations..."
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant={status === "lost" ? "destructive" : "default"}
          >
            {loading ? "Recording..." : "Finish Inspection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
