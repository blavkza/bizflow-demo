"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle2, AlertTriangle, Users, Box } from "lucide-react";

interface ToolStatsProps {
  tool: any;
}

export function ToolStats({ tool }: ToolStatsProps) {
  const fleet = tool.fleet || [];

  const totalQty =
    fleet.length > 0
      ? fleet.reduce((sum: number, t: any) => sum + (t.quantity || 1), 0)
      : tool.quantity;

  const allocatedQty =
    fleet.length > 0
      ? fleet
          .filter((t: any) => t.status === "ASSIGNED")
          .reduce((sum: number, t: any) => sum + (t.quantity || 1), 0)
      : tool.status === "ASSIGNED"
        ? tool.quantity
        : 0;

  const availableQty = totalQty - allocatedQty;

  const damagedQty =
    fleet.length > 0
      ? fleet
          .filter((t: any) => t.status === "DAMAGED" || t.status === "LOST")
          .reduce((sum: number, t: any) => sum + (t.quantity || 1), 0)
      : tool.status === "DAMAGED"
        ? tool.quantity
        : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Total Fleet
            </p>
            <p className="text-2xl font-bold">{totalQty}</p>
          </div>
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Box className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Allocated
            </p>
            <p className="text-2xl font-bold text-blue-600">{allocatedQty}</p>
          </div>
          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Available
            </p>
            <p className="text-2xl font-bold text-green-600">{availableQty}</p>
          </div>
          <div className="h-10 w-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {damagedQty > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Damaged/Lost
              </p>
              <p className="text-2xl font-bold text-destructive">
                {damagedQty}
              </p>
            </div>
            <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
