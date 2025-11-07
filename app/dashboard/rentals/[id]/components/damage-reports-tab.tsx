"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ToolRentalDetail } from "../types";

interface DamageReportsTabProps {
  rental: ToolRentalDetail;
  onRentalUpdated: () => void;
}

export default function DamageReportsTab({
  rental,
  onRentalUpdated,
}: DamageReportsTabProps) {
  const [isDamageDialogOpen, setIsDamageDialogOpen] = useState(false);
  const [damageType, setDamageType] = useState("");
  const [severity, setSeverity] = useState("LOW");
  const [description, setDescription] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleReportDamage = async (damageData: any) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/tool-rentals/${rental.id}/damage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(damageData),
      });

      if (response.ok) {
        toast.success("Damage reported successfully");
        setIsDamageDialogOpen(false);
        setDamageType("");
        setSeverity("LOW");
        setDescription("");
        setRepairCost("");
        onRentalUpdated();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error reporting damage:", error);
      toast.error("Error reporting damage");
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmit = () => {
    handleReportDamage({
      damageType,
      severity,
      description,
      repairCost: repairCost ? parseFloat(repairCost) : 0,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Damage Reports</CardTitle>
          <CardDescription>
            Track any damage or wear during rental period
          </CardDescription>
        </div>
        <Dialog open={isDamageDialogOpen} onOpenChange={setIsDamageDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Report Damage
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Report Tool Damage</DialogTitle>
              <DialogDescription>
                Document any damage or wear to the rental tool.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="damage-type">Damage Type</Label>
                <Input
                  id="damage-type"
                  placeholder="e.g., Scratch, Dent, Broken Part"
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="damage-desc">Description</Label>
                <Textarea
                  id="damage-desc"
                  placeholder="Describe the damage in detail"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repair-cost">Repair Cost (Optional)</Label>
                <Input
                  id="repair-cost"
                  type="number"
                  placeholder="0.00"
                  value={repairCost}
                  onChange={(e) => setRepairCost(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDamageDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={updating}>
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Report Damage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {rental.damageReported ? (
          <div className="space-y-3">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">Reported Damage</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  className={
                    rental.damageDescription?.toLowerCase().includes("minor")
                      ? "bg-yellow-100 text-yellow-800"
                      : rental.damageDescription
                            ?.toLowerCase()
                            .includes("major")
                        ? "bg-red-100 text-red-800"
                        : "bg-orange-100 text-orange-800"
                  }
                >
                  {rental.damageDescription?.toLowerCase().includes("minor")
                    ? "Low"
                    : rental.damageDescription?.toLowerCase().includes("major")
                      ? "High"
                      : "Medium"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {rental.damageDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">No damage reports recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
