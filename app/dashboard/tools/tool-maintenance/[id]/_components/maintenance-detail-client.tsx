"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  User,
  Banknote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { UpdateStatusDialog } from "../../_components/update-status-dialog";

interface MaintenanceDetailClientProps {
  maintenanceId: string;
}

export function MaintenanceDetailClient({
  maintenanceId,
}: MaintenanceDetailClientProps) {
  const router = useRouter();
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const { data: log, isLoading } = useQuery({
    queryKey: ["maintenance-log", maintenanceId],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/tools/tool-maintenance/${maintenanceId}`,
      );
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-muted-foreground">
        <Wrench className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold">Maintenance Request Not Found</h2>
        <Button
          variant="link"
          onClick={() => router.push("/dashboard/tools/tool-maintenance")}
        >
          Return to List
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/15 text-emerald-700 border-emerald-200";
      case "IN_PROGRESS":
        return "bg-blue-500/15 text-blue-700 border-blue-200";
      case "PENDING":
        return "bg-amber-500/15 text-amber-700 border-amber-200";
      case "CANCELLED":
        return "bg-destructive/15 text-destructive border-destructive/30";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
      case "HIGH":
        return "text-red-600 bg-red-100 border-red-200";
      case "MEDIUM":
        return "text-amber-600 bg-amber-100 border-amber-200";
      case "LOW":
        return "text-slate-600 bg-slate-100 border-slate-200";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/10 pb-10">
      <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/tools/tool-maintenance")}
              className="text-muted-foreground hover:text-foreground pl-0 -ml-3 mb-1 h-auto py-1"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Maintenance List
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Maintenance #{log.id.slice(-6).toUpperCase()}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusColor(log.status)}`}
              >
                {log.status.replace("_", " ")}
              </Badge>
              {log.status === "COMPLETED" && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border-blue-100"
                >
                  Returned to Stock
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Created on {format(new Date(log.createdAt), "PPP")} at{" "}
              {format(new Date(log.createdAt), "p")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Potential future actions like Delete or Print could go here */}
            <Button
              size="lg"
              onClick={() => setUpdateDialogOpen(true)}
              className="shadow-sm"
            >
              <Wrench className="mr-2 h-4 w-4" /> Update Status & Details
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Metadata / Job Sheet */}
          <div className="space-y-6 lg:col-span-1">
            {/* Tool Card */}
            <Card className="overflow-hidden border-none shadow-md">
              <div className="bg-primary/5 p-4 border-b border-primary/10">
                <h3 className="font-semibold flex items-center gap-2 text-primary">
                  <Wrench className="h-4 w-4" /> Tool Details
                </h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tool Name
                  </label>
                  <p className="text-lg font-semibold text-foreground/90">
                    {log.toolName}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Serial Number
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">
                      {log.serialNumber || "N/A"}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Sheet Card */}
            <Card className="overflow-hidden border-none shadow-md h-full">
              <div className="bg-muted/30 p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Job
                  Sheet
                </h3>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase">
                      Priority
                    </label>
                    <Badge
                      variant="outline"
                      className={`px-2 py-0.5 border ${getPriorityColor(log.priority)}`}
                    >
                      {log.priority}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase">
                      Cost
                    </label>
                    <p className="font-semibold text-emerald-600 flex items-center gap-1">
                      <Banknote className="h-3.5 w-3.5" />
                      {new Intl.NumberFormat("en-ZA", {
                        style: "currency",
                        currency: "ZAR",
                      }).format(log.cost || 0)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">
                        Technician
                      </p>
                      <p className="text-sm font-medium">
                        {log.technician || "Unassigned"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-2 rounded-full">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">
                        Reported By
                      </p>
                      <p className="text-sm font-medium">
                        {log.reportedBy || "System"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Report & Timeline */}
          <div className="space-y-6 lg:col-span-2">
            {/* Core Issue & Notes */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">
                  Maintenance Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Issue Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Issue
                    Description
                  </h4>
                  <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-lg text-sm text-foreground/80 leading-relaxed shadow-sm">
                    {log.issueDescription ||
                      "No detailed description provided."}
                  </div>
                </div>

                {/* Technician Notes */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Resolution
                    Notes
                  </h4>
                  <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground leading-relaxed min-h-[100px] border">
                    {log.notes ? (
                      log.notes
                    ) : (
                      <span className="italic opacity-70">
                        No notes added by technician yet.
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" /> Activity
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border-l-2 border-muted ml-3 space-y-8 my-4">
                  {/* Event 1: Logged */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className="font-semibold text-sm">
                        Maintenance Logged
                      </p>
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(log.createdAt), "PP p")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reported by {log.reportedBy || "System"}
                    </p>
                  </div>

                  {/* Event 2: Started */}
                  {log.startDate && (
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-blue-500" />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <p className="font-semibold text-sm text-blue-700">
                          Maintenance Started
                        </p>
                        <span className="text-xs text-muted-foreground font-mono">
                          {format(new Date(log.startDate), "PP p")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status changed to IN PROGRESS
                      </p>
                    </div>
                  )}

                  {/* Event 3: Completed */}
                  {log.completionDate ? (
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-green-500 border-2 border-green-500 shadow-md shadow-green-200" />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <p className="font-bold text-sm text-green-700">
                          Maintenance Completed
                        </p>
                        <span className="text-xs text-muted-foreground font-mono">
                          {format(new Date(log.completionDate), "PP p")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-green-600">
                        Final cost:{" "}
                        {new Intl.NumberFormat("en-ZA", {
                          style: "currency",
                          currency: "ZAR",
                        }).format(log.cost || 0)}
                      </p>
                    </div>
                  ) : (
                    log.status !== "CANCELLED" && (
                      <div className="relative pl-6 opacity-50">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-muted border-2 border-muted-foreground/30" />
                        <p className="font-medium text-sm text-muted-foreground">
                          Completion Pending...
                        </p>
                      </div>
                    )
                  )}

                  {log.status === "CANCELLED" && (
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-destructive border-2 border-destructive" />
                      <p className="font-bold text-sm text-destructive">
                        Maintenance Cancelled
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <UpdateStatusDialog
        isOpen={updateDialogOpen}
        onClose={() => {
          setUpdateDialogOpen(false);
        }}
        record={log}
      />
    </div>
  );
}
