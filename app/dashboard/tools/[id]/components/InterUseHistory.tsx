import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Building,
  CheckCircle,
  XCircle,
  PlayCircle,
  Clock,
} from "lucide-react";
import { Tool } from "@/types/tool";
import { getInterUseStatusColor } from "../../utils";
import { toast } from "sonner";
import { ToolInterUseStatus } from "@prisma/client";

interface InterUseHistoryProps {
  tool: Tool;
  onAddInterUse: () => void;
  onUpdateTool: () => void;
}

export function InterUseHistory({
  tool,
  onAddInterUse,
  onUpdateTool,
}: InterUseHistoryProps) {
  const handleUpdateInterUseStatus = async (
    interUseId: string,
    status: ToolInterUseStatus,
    damageDescription?: string
  ) => {
    try {
      const response = await fetch(`/api/tools/${tool.id}/interuse`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interUseId,
          status,
          damageDescription,
        }),
      });

      if (response.ok) {
        let message = "";
        switch (status) {
          case "ACTIVE":
            message = "Internal use activated";
            break;
          case "COMPLETED":
            message = "Internal use completed successfully";
            break;
          case "CANCELLED":
            message = "Internal use cancelled";
            break;
          case "OVERDUE":
            message = "Marked as overdue";
            break;
          case "RETURNED_DAMAGED":
            message = "Marked as returned with damage";
            break;
          default:
            message = "Status updated successfully";
        }
        toast.success(message);
        onUpdateTool();
      } else {
        throw new Error("Failed to update internal use status");
      }
    } catch (error) {
      toast.error("Failed to update internal use status");
      console.error("Error updating internal use status:", error);
    }
  };

  const getStatusActions = (interUse: any) => {
    const actions = [];

    switch (interUse.status) {
      case "PENDING":
        actions.push(
          <Button
            key="activate"
            size="sm"
            variant="outline"
            onClick={() => handleUpdateInterUseStatus(interUse.id, "ACTIVE")}
          >
            <PlayCircle className="h-4 w-4 mr-1" />
            Activate
          </Button>,
          <Button
            key="cancel"
            size="sm"
            variant="outline"
            onClick={() => handleUpdateInterUseStatus(interUse.id, "CANCELLED")}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        );
        break;

      case "ACTIVE":
        actions.push(
          <Button
            key="complete"
            size="sm"
            variant="outline"
            onClick={() => handleUpdateInterUseStatus(interUse.id, "COMPLETED")}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Complete
          </Button>,
          <Button
            key="overdue"
            size="sm"
            variant="outline"
            onClick={() => handleUpdateInterUseStatus(interUse.id, "OVERDUE")}
          >
            <Clock className="h-4 w-4 mr-1" />
            Mark Overdue
          </Button>,
          <Button
            key="damaged"
            size="sm"
            variant="outline"
            onClick={() => {
              const damageDesc = prompt("Please describe the damage:");
              if (damageDesc) {
                handleUpdateInterUseStatus(
                  interUse.id,
                  "RETURNED_DAMAGED",
                  damageDesc
                );
              }
            }}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Report Damage
          </Button>
        );
        break;

      case "OVERDUE":
        actions.push(
          <Button
            key="complete"
            size="sm"
            variant="outline"
            onClick={() => handleUpdateInterUseStatus(interUse.id, "COMPLETED")}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Complete
          </Button>,
          <Button
            key="damaged"
            size="sm"
            variant="outline"
            onClick={() => {
              const damageDesc = prompt("Please describe the damage:");
              if (damageDesc) {
                handleUpdateInterUseStatus(
                  interUse.id,
                  "RETURNED_DAMAGED",
                  damageDesc
                );
              }
            }}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Report Damage
          </Button>
        );
        break;

      case "COMPLETED":
      case "CANCELLED":
      case "RETURNED_DAMAGED":
        // No actions for completed/cancelled/damaged records
        break;
    }

    return actions;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Internal Use History</CardTitle>
          <CardDescription>
            Records of tool usage within the business
          </CardDescription>
        </div>
        {tool.status === "AVAILABLE" && (
          <Button onClick={onAddInterUse}>
            <Plus className="h-4 w-4 mr-2" />
            Add Internal Use
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {(tool.InterUse || []).length > 0 ? (
          <div className="space-y-4">
            {(tool.InterUse || []).map((interUse) => (
              <div key={interUse.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">
                      {new Date(interUse.useStartDate).toLocaleDateString()} -{" "}
                      {new Date(interUse.useEndDate).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge
                        className={getInterUseStatusColor(interUse.status)}
                      >
                        {interUse.status.toLowerCase().replace("_", " ")}
                      </Badge>
                      {interUse.project && (
                        <Badge variant="secondary">
                          Project: {interUse.project.projectNumber} -{" "}
                          {interUse.project.title}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {interUse.damageReported && (
                      <Badge variant="destructive" className="mb-1">
                        Damage Reported
                      </Badge>
                    )}
                  </div>
                </div>
                {interUse.notes && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {interUse.notes}
                  </p>
                )}
                {interUse.damageDescription && (
                  <p className="text-sm text-red-600">
                    <strong>Damage:</strong> {interUse.damageDescription}
                  </p>
                )}

                {/* Status-specific action buttons */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {getStatusActions(interUse)}
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(interUse.createdAt).toLocaleDateString()}
                  {interUse.relisedBy && ` • By: ${interUse.relisedBy}`}
                  {interUse.updatedAt !== interUse.createdAt &&
                    ` • Updated: ${new Date(interUse.updatedAt).toLocaleDateString()}`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No internal use records found
            </p>
            {tool.status === "AVAILABLE" && (
              <Button onClick={onAddInterUse} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Internal Use
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
