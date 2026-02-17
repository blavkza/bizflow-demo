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
  const [isPresent, setIsPresent] = useState(true);
  const [isLost, setIsLost] = useState(false);
  const [damageCost, setDamageCost] = useState("");
  const [damageDescription, setDamageDescription] = useState("");
  const [notes, setNotes] = useState("");

  // Reset form when tool changes or dialog opens
  useEffect(() => {
    if (tool && isOpen) {
      setCondition(tool.condition || "GOOD");
      setIsPresent(true);
      setIsLost(false);
      setDamageCost("");
      setDamageDescription("");
      setNotes("");
    }
  }, [tool, isOpen]);

  const handleSubmit = async () => {
    if (!tool) return;

    try {
      setLoading(true);

      const checkData = {
        toolId: tool.id,
        employeeId: tool.employeeId,
        freelancerId: tool.freelancerId,
        trainerId: tool.trainerId,
        condition,
        isPresent,
        isLost,
        damageCost: damageCost ? parseFloat(damageCost) : 0,
        damageDescription: damageDescription || null,
        notes: notes || null,
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

        <div className="space-y-4">
          {/* Tool Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{tool.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {tool.serialNumber}
                </p>
              </div>
              {tool.images && tool.images[0] && (
                <Image
                  src={tool.images[0]}
                  alt={tool.name}
                  width={80}
                  height={80}
                  className="rounded object-cover"
                />
              )}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Allocated to:</span>{" "}
              <span className="font-medium">{tool.workerName}</span>
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition *</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="GOOD">Good</SelectItem>
                <SelectItem value="FAIR">Fair</SelectItem>
                <SelectItem value="POOR">Poor</SelectItem>
                <SelectItem value="DAMAGED">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Present/Lost Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPresent"
                checked={isPresent}
                onCheckedChange={(checked) => {
                  setIsPresent(checked as boolean);
                  if (checked) setIsLost(false);
                }}
              />
              <Label htmlFor="isPresent" className="cursor-pointer">
                Tool is present
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isLost"
                checked={isLost}
                onCheckedChange={(checked) => {
                  setIsLost(checked as boolean);
                  if (checked) setIsPresent(false);
                }}
              />
              <Label htmlFor="isLost" className="cursor-pointer">
                Tool is lost
              </Label>
            </div>
          </div>

          {/* Damage Cost */}
          <div className="space-y-2">
            <Label htmlFor="damageCost">Damage/Repair Cost (R)</Label>
            <Input
              id="damageCost"
              type="number"
              step="0.01"
              min="0"
              value={damageCost}
              onChange={(e) => setDamageCost(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Damage Description */}
          {(damageCost || condition === "DAMAGED" || condition === "POOR") && (
            <div className="space-y-2">
              <Label htmlFor="damageDescription">Damage Description</Label>
              <Textarea
                id="damageDescription"
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                placeholder="Describe the damage or issues..."
                rows={3}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Check"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
