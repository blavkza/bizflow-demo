import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Wrench } from "lucide-react";
import { Tool } from "@/types/tool";
import { formatCurrency } from "../../utils";

interface MaintenanceHistoryProps {
  tool: Tool;
  onAddMaintenance: () => void;
}

export function MaintenanceHistory({
  tool,
  onAddMaintenance,
}: MaintenanceHistoryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Maintenance History</CardTitle>
          <CardDescription>
            All maintenance and repair records for this tool
          </CardDescription>
        </div>
        <Button onClick={onAddMaintenance}>
          <Plus className="h-4 w-4 mr-2" />
          Add Maintenance
        </Button>
      </CardHeader>
      <CardContent>
        {(tool.maintenanceLogs || []).length > 0 ? (
          <div className="space-y-4">
            {(tool.maintenanceLogs || []).map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{log.maintenanceType}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.maintenanceDate).toLocaleDateString()}
                    </p>
                    {(log.assignedTo || log.processedBy) && (
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        {log.assignedTo && (
                          <span>Assigned: {log.assignedTo}</span>
                        )}
                        {log.processedBy && (
                          <span>Processed: {log.processedBy}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline">{formatCurrency(log.cost)}</Badge>
                </div>
                {log.notes && (
                  <p className="text-sm text-muted-foreground">{log.notes}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(log.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No maintenance records found
            </p>
            <Button onClick={onAddMaintenance} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add First Maintenance
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
