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
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
} from "lucide-react";
import { updateMaintenance } from "../actions";
import { toast } from "sonner";

interface MaintenanceStatusControlsProps {
  id: string;
  currentStatus: ServiceMaintenanceStatus;
}

export function MaintenanceStatusControls({
  id,
  currentStatus,
}: MaintenanceStatusControlsProps) {
  const [status, setStatus] = useState<ServiceMaintenanceStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: ServiceMaintenanceStatus) => {
    try {
      setLoading(true);
      const result = await updateMaintenance(id, { status: newStatus });
      if (result.success) {
        setStatus(newStatus);
        toast.success(
          `Maintenance marked as ${newStatus.toLowerCase().replace("_", " ")}`,
        );
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (s: ServiceMaintenanceStatus) => {
    switch (s) {
      case "COMPLETED":
        return {
          color: "bg-emerald-500 hover:bg-emerald-600",
          icon: <CheckCircle2 className="h-4 w-4 mr-2" />,
          label: "Completed",
        };
      case "IN_PROGRESS":
        return {
          color: "bg-blue-500 hover:bg-blue-600",
          icon: <PlayCircle className="h-4 w-4 mr-2" />,
          label: "In Progress",
        };
      case "CANCELLED":
        return {
          color: "bg-red-500 hover:bg-red-600",
          icon: <XCircle className="h-4 w-4 mr-2" />,
          label: "Cancelled",
        };
      default:
        return {
          color: "bg-amber-500 hover:bg-amber-600",
          icon: <Clock className="h-4 w-4 mr-2" />,
          label: "Pending",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 font-bold text-xs text-white border-none transition-all ${config.color}`}
          disabled={loading}
        >
          {config.icon}
          {config.label}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={() => handleStatusChange("PENDING")}>
          <Clock className="h-4 w-4 mr-2 text-amber-500" />
          Mark as Pending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("IN_PROGRESS")}>
          <PlayCircle className="h-4 w-4 mr-2 text-blue-500" />
          Mark as In Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("COMPLETED")}>
          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
          Mark as Completed
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusChange("CANCELLED")}
          className="text-red-600"
        >
          <XCircle className="h-4 w-4 mr-2 text-red-600" />
          Cancel Record
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
