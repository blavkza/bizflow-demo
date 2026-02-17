"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
} from "lucide-react";
import {
  Maintenance,
  ServiceMaintenanceStatus,
  MaintenanceType,
} from "@prisma/client";

interface MaintenanceStatsProps {
  maintenances: Maintenance[];
}

export function MaintenanceStats({ maintenances }: MaintenanceStatsProps) {
  // Calculate stats
  const total = maintenances.length;

  const completed = maintenances.filter(
    (m) => m.status === ServiceMaintenanceStatus.COMPLETED,
  ).length;

  const inProgress = maintenances.filter(
    (m) => m.status === ServiceMaintenanceStatus.IN_PROGRESS,
  ).length;

  const pending = maintenances.filter(
    (m) => m.status === ServiceMaintenanceStatus.PENDING,
  ).length;

  const routine = maintenances.filter(
    (m) => m.type === MaintenanceType.ROUTINE,
  ).length;

  const oneOff = maintenances.filter(
    (m) => m.type === MaintenanceType.ONE_OFF,
  ).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">
            {routine} Routine • {oneOff} One-off
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{completed}</div>
          <p className="text-xs text-muted-foreground">
            {completionRate}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{inProgress}</div>
          <p className="text-xs text-muted-foreground">
            Active maintenance tasks
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <AlertCircle className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{pending}</div>
          <p className="text-xs text-muted-foreground">Tasks awaiting start</p>
        </CardContent>
      </Card>
    </div>
  );
}
