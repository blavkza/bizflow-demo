"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  Users,
  AlertTriangle,
  History,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolModal } from "../../_components/tool-modal";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ToolHeader } from "./ToolHeader";
import { ToolInfo } from "./ToolInfo";
import { ToolAllocations } from "./ToolAllocations";
import { ToolStats } from "./ToolStats";

interface ToolDetailClientProps {
  toolId: string;
}

export function ToolDetailClient({ toolId }: ToolDetailClientProps) {
  const router = useRouter();
  const [allocationOpen, setAllocationOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [assignType, setAssignType] = useState<"EMPLOYEE" | "FREELANCER">(
    "EMPLOYEE",
  );

  // ... existing code ...

  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [quantityPerWorker, setQuantityPerWorker] = useState(1);

  // Queries
  const {
    data: tool,
    refetch: refetchTool,
    isLoading: isToolLoading,
  } = useQuery({
    queryKey: ["worker-tool", toolId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/worker-tools/${toolId}`);
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const { data } = await axios.get("/api/employees");
      return data;
    },
    enabled: allocationOpen && assignType === "EMPLOYEE",
  });

  const { data: freelancers } = useQuery({
    queryKey: ["freelancers-list"],
    queryFn: async () => {
      const { data } = await axios.get("/api/freelancers");
      return data;
    },
    enabled: allocationOpen && assignType === "FREELANCER",
  });

  const handleAllocate = async () => {
    if (selectedWorkerIds.length === 0) {
      toast.error("Please select at least one worker");
      return;
    }
    if (quantityPerWorker <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const totalNeeded = selectedWorkerIds.length * quantityPerWorker;
    if (tool.quantity < totalNeeded) {
      toast.error(
        `Insufficient stock! You need ${totalNeeded} but only have ${tool.quantity}`,
      );
      return;
    }

    try {
      setAllocating(true);

      const allocations = selectedWorkerIds.map((id) => ({
        workerId: id,
        workerType: assignType,
        quantity: quantityPerWorker,
      }));

      await axios.post("/api/worker-tools/allocate", {
        sourceToolId: toolId,
        allocations,
      });

      toast.success("Tools allocated successfully!");
      setAllocationOpen(false);
      setSelectedWorkerIds([]);
      setQuantityPerWorker(1);
      refetchTool();
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data || "Failed to allocate tools");
    } finally {
      setAllocating(false);
    }
  };

  if (isToolLoading) {
    return <div className="p-8 text-center">Loading tool details...</div>;
  }

  if (!tool) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Tool Not Found</h2>
        <Button onClick={() => router.push("/dashboard/tools/worker-tools")}>
          Back to List
        </Button>
      </div>
    );
  }

  const workerOptions =
    assignType === "EMPLOYEE"
      ? employees?.employees?.map((e: any) => ({
          label: e.name || `${e.firstName} ${e.lastName}`,
          value: e.id,
        })) || []
      : freelancers?.freelancers?.map((f: any) => ({
          label: `${f.firstName} ${f.lastName}`,
          value: f.id,
        })) || [];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <ToolHeader
        tool={tool}
        onAllocate={() => setAllocationOpen(true)}
        onEdit={() => setEditModalOpen(true)}
      />

      <ToolStats tool={tool} />

      <ToolInfo tool={tool} />

      <div className="pt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Allocations
        </h3>
        <ToolAllocations tool={tool} />
      </div>

      {/* Allocation Dialog */}
      <Dialog open={allocationOpen} onOpenChange={setAllocationOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Allocate Tools to Workers</DialogTitle>
            <DialogDescription>
              Select multiple workers to assign this tool. Each worker will
              receive the specified quantity.
            </DialogDescription>
          </DialogHeader>

          <div className="gap-4 py-4 space-y-4">
            {/* Worker Type Selector */}
            <div className="space-y-2">
              <Label>Worker Type</Label>
              <Tabs
                value={assignType}
                onValueChange={(v) => {
                  setAssignType(v as any);
                  setSelectedWorkerIds([]); // Clear selection on type change
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="EMPLOYEE">Employees</TabsTrigger>
                  <TabsTrigger value="FREELANCER">Freelancers</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Multi Select Workers */}
            <div className="space-y-2">
              <Label>Select Workers</Label>
              <MultiSelect
                options={workerOptions}
                selected={selectedWorkerIds}
                onChange={setSelectedWorkerIds}
                placeholder="Select workers..."
              />
              <p className="text-xs text-muted-foreground">
                Selected: {selectedWorkerIds.length} workers
              </p>
            </div>

            {/* Quantity per Worker */}
            <div className="space-y-2">
              <Label>Quantity per Worker</Label>
              <Input
                type="number"
                min={1}
                value={quantityPerWorker}
                onChange={(e) =>
                  setQuantityPerWorker(parseInt(e.target.value) || 0)
                }
              />
            </div>

            {/* Summary */}
            <div className="bg-muted p-3 rounded-md text-sm flex justify-between items-center">
              <span>Total Tools Required:</span>
              <span
                className={
                  tool.quantity < selectedWorkerIds.length * quantityPerWorker
                    ? "text-destructive font-bold"
                    : "font-bold"
                }
              >
                {selectedWorkerIds.length * quantityPerWorker} / {tool.quantity}{" "}
                Available
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocationOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAllocate}
              disabled={allocating || selectedWorkerIds.length === 0}
            >
              {allocating ? "Allocating..." : "Confirm Allocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToolModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialData={tool}
      />
    </div>
  );
}
