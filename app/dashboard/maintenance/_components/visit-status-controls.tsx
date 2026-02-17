"use client";

import { useState } from "react";
import { ServiceMaintenanceStatus } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateMaintenanceVisit } from "../actions";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
  AlertCircle,
  Edit2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface VisitStatusControlsProps {
  visit: any;
  maintenanceId: string;
}

export function VisitStatusControls({
  visit,
  maintenanceId,
}: VisitStatusControlsProps) {
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [task, setTask] = useState(visit.task || "");
  const [location, setLocation] = useState(visit.location || "");

  const handleStatusChange = async (newStatus: ServiceMaintenanceStatus) => {
    try {
      setLoading(true);
      const result = await updateMaintenanceVisit(visit.id, maintenanceId, {
        status: newStatus,
        completedAt: newStatus === "COMPLETED" ? new Date() : null,
      });
      if (result.success) {
        toast.success(`Visit marked as ${newStatus.toLowerCase()}`);
      } else {
        toast.error("Failed to update visit status");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDetails = async () => {
    try {
      setLoading(true);
      const result = await updateMaintenanceVisit(visit.id, maintenanceId, {
        task,
        location,
      });
      if (result.success) {
        toast.success("Visit details updated");
        setEditOpen(false);
      } else {
        toast.error("Failed to update visit details");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "COMPLETED":
        return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
      case "IN_PROGRESS":
        return <PlayCircle className="h-3 w-3 text-blue-500" />;
      case "CANCELLED":
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-amber-500" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Edit2 className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Visit Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Location / Site</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where is this visit happening?"
              />
            </div>
            <div className="space-y-2">
              <Label>Task Details</Label>
              <Textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="What needs to be done during this visit?"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDetails} disabled={loading}>
              Save Updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] font-bold uppercase gap-1"
            disabled={loading}
          >
            {getStatusIcon(visit.status)}
            {visit.status}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleStatusChange("PENDING")}>
            <Clock className="h-4 w-4 mr-2 text-amber-500" /> Mark Pending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange("IN_PROGRESS")}>
            <PlayCircle className="h-4 w-4 mr-2 text-blue-500" /> Mark In
            Progress
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange("COMPLETED")}>
            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> Mark
            Completed
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleStatusChange("CANCELLED")}
            className="text-red-600"
          >
            <XCircle className="h-4 w-4 mr-2 text-red-600" /> Cancel Visit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
