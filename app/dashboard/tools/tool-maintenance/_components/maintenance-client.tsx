"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { MaintenanceFilterTable } from "./maintenance-table";

export function MaintenanceClient() {
  const { data: maintenanceLogs = [], isLoading } = useQuery({
    queryKey: ["maintenance-logs"],
    queryFn: async () => {
      const { data } = await axios.get("/api/tools/tool-maintenance");
      return data;
    },
  });

  const pendingCount = maintenanceLogs.filter(
    (log: any) => log.status === "PENDING",
  ).length;
  const inProgressCount = maintenanceLogs.filter(
    (log: any) => log.status === "IN_PROGRESS",
  ).length;
  const completedCount = maintenanceLogs.filter(
    (log: any) => log.status === "COMPLETED",
  ).length;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading
            title="Tool Maintenance"
            description="Track repairs, regular servicing, and maintenance costs."
          />
        </div>
        <Separator />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Maintenance
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingCount + inProgressCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tools currently being serviced
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Waiting for technician
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently being worked on
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Repairs finished (All time)
              </p>
            </CardContent>
          </Card>
        </div>

        <MaintenanceFilterTable data={maintenanceLogs} isLoading={isLoading} />
      </div>
    </div>
  );
}
