import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Share2,
  MoreHorizontal,
  Wrench,
  Building,
  CheckCircle,
  XCircle,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { Tool } from "@/types/tool";
import {
  getStatusColor,
  getConditionColor,
  getRentalAvailabilityColor,
} from "../../utils";
import { useRouter } from "next/navigation";

interface ToolHeaderProps {
  tool: Tool;
  canBeRented: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddMaintenance: () => void;
  onAddInterUse: () => void;
  onPrintReport: () => void;
  isPrinting?: boolean;
}

export function ToolHeader({
  tool,
  canBeRented,
  onEdit,
  onDelete,
  onAddMaintenance,
  onAddInterUse,
  onPrintReport,
  isPrinting = false,
}: ToolHeaderProps) {
  const router = useRouter();
  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          {tool.status === "AVAILABLE" && (
            <Button onClick={onAddInterUse} variant="outline">
              <Building className="h-4 w-4 mr-2" />
              Internal Use
            </Button>
          )}
          <Button onClick={onAddMaintenance} variant="outline">
            <Wrench className="h-4 w-4 mr-2" />
            Add Maintenance
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPrintReport} disabled={isPrinting}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{tool.name}</h2>
        <p className="text-muted-foreground">
          {tool.category || "Uncategorized"}
        </p>
      </div>
      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className={getStatusColor(tool.status)}>
          {tool.status.charAt(0) + tool.status.slice(1).toLowerCase()}
        </Badge>
        <Badge variant="outline" className={getConditionColor(tool.condition)}>
          {tool.condition.charAt(0) + tool.condition.slice(1).toLowerCase()}{" "}
          Condition
        </Badge>
        <Badge className={getRentalAvailabilityColor(canBeRented)}>
          {canBeRented ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Available for Rent
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Not for Rent
            </>
          )}
        </Badge>
        <Badge variant="secondary">Created by {tool.createdBy}</Badge>
      </div>
    </>
  );
}
