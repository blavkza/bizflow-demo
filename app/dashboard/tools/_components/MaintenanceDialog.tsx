"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Hammer,
  Wrench,
  AlertTriangle,
  RotateCcw,
  MinusCircle,
  PlusCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MaintenanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tool: any;
  onSuccess: () => void;
}

export function MaintenanceDialog({
  isOpen,
  onClose,
  tool,
  onSuccess,
}: MaintenanceDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string>("RETURN");

  // Form states
  const [quantity, setQuantity] = useState(tool?.quantity || 1);
  const [condition, setCondition] = useState(tool?.condition || "GOOD");
  const [damageDescription, setDamageDescription] = useState("");
  const [damageCost, setDamageCost] = useState(0);
  const [notes, setNotes] = useState("");

  const handleMaintenance = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/worker-tools/${tool.id}/maintenance`, {
        action,
        quantity,
        condition,
        damageDescription,
        damageCost,
        notes,
      });

      toast.success(`Tool ${action.toLowerCase()}ed successfully`);
      onSuccess();
      onClose();
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data || "Failed to perform maintenance");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case "RETURN":
        return <RotateCcw className="h-4 w-4 mr-2" />;
      case "REPORT_DAMAGE":
        return <AlertTriangle className="h-4 w-4 mr-2" />;
      case "FIX":
        return <Wrench className="h-4 w-4 mr-2" />;
      case "ADJUST_QUANTITY":
        return <PlusCircle className="h-4 w-4 mr-2" />;
      default:
        return <Hammer className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Hammer className="h-5 w-5 mr-2 text-primary" />
            Tool Maintenance
          </DialogTitle>
          <DialogDescription>
            Perform maintenance actions, report damages, or adjust stock.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Action Type</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RETURN">Return to Inventory</SelectItem>
                <SelectItem value="ADJUST_QUANTITY">
                  Adjust Stock Quantity
                </SelectItem>
                <SelectItem value="REPORT_DAMAGE">Report Damage</SelectItem>
                <SelectItem value="FIX">Fixed / Ready for Use</SelectItem>
                <SelectItem value="MAINTENANCE">Send to Maintenance</SelectItem>
                <SelectItem value="REPORT_LOSS">Report as Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === "ADJUST_QUANTITY" && (
            <div className="space-y-2">
              <Label>New Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
          )}

          {(action === "RETURN" || action === "REPORT_DAMAGE") && (
            <div className="space-y-2">
              <Label>Current Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCELLENT">Excellent</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="POOR">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === "REPORT_DAMAGE" && (
            <>
              <div className="space-y-2">
                <Label>Damage Description</Label>
                <Textarea
                  placeholder="Describe the damage..."
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Repair Cost</Label>
                <Input
                  type="number"
                  value={damageCost}
                  onChange={(e) =>
                    setDamageCost(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any extra details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMaintenance} disabled={loading}>
            {loading ? (
              "Processing..."
            ) : (
              <span className="flex items-center">
                {getActionIcon()}
                Process{" "}
                {action
                  .split("_")
                  .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                  .join(" ")}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
