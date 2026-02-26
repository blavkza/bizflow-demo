"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { Employee, Warning } from "../types";

interface WarningWithEmployee extends Warning {
  employee: Employee;
}

interface WarningsTabProps {
  warnings?: WarningWithEmployee[];
  loading?: boolean;
  onResolveWarning: (warning: any, employee: Employee) => void;
  onRefresh?: () => void;
  canEditPerfomance: boolean;
  hasFullAccess: boolean;
}

export default function WarningsTab({
  warnings = [],
  loading = false,
  onResolveWarning,
  onRefresh,
  canEditPerfomance,
  hasFullAccess,
}: WarningsTabProps) {
  const [warningFilter, setWarningFilter] = useState<
    "all" | "active" | "resolved"
  >("all");

  const getWarningStatus = (warning: Warning): string => {
    return warning.status || "ACTIVE";
  };

  const getFilteredWarnings = (warnings: WarningWithEmployee[]) => {
    switch (warningFilter) {
      case "active":
        return warnings.filter((warning) =>
          [
            "ACTIVE",
            "APPEALED",
            "NEXT_STEP",
            "NEXT_STEP_ACCEPTED",
            "REJECTED",
          ].includes(getWarningStatus(warning)),
        );
      case "resolved":
        return warnings.filter(
          (warning) => getWarningStatus(warning) === "RESOLVED",
        );
      default:
        return warnings;
    }
  };

  const getWarningBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "destructive";
      case "APPEALED":
        return "secondary";
      case "NEXT_STEP":
        return "outline";
      case "NEXT_STEP_ACCEPTED":
        return "secondary";
      case "RESOLVED":
        return "default";
      case "REJECTED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getWarningBadgeText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "APPEALED":
        return "Appealed";
      case "NEXT_STEP":
        return "Next Step Issued";
      case "NEXT_STEP_ACCEPTED":
        return "Step Accepted";
      case "RESOLVED":
        return "Resolved";
      case "REJECTED":
        return "Appeal Rejected";
      default:
        return status.replace(/_/g, " ");
    }
  };

  const getWarningCardStyle = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-red-50 border-red-200";
      case "APPEALED":
        return "bg-amber-50 border-amber-200";
      case "NEXT_STEP":
        return "bg-blue-50 border-blue-200";
      case "NEXT_STEP_ACCEPTED":
        return "bg-indigo-50 border-indigo-200";
      case "RESOLVED":
        return "bg-green-50 border-green-200";
      case "REJECTED":
        return "bg-red-100 border-red-300";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getWarningTextStyle = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-red-800";
      case "APPEALED":
        return "text-amber-800";
      case "NEXT_STEP":
        return "text-blue-800";
      case "NEXT_STEP_ACCEPTED":
        return "text-indigo-800";
      case "RESOLVED":
        return "text-green-800";
      case "REJECTED":
        return "text-red-900";
      default:
        return "text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Warning Management</CardTitle>
              <CardDescription>
                View and manage all warnings - both active and resolved
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center p-4 bg-gray-100 rounded-lg">
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 w-full bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredWarnings = getFilteredWarnings(warnings);

  const warningsByEmployee = filteredWarnings.reduce(
    (acc, warning) => {
      const employeeId = warning.employee.id;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employee: warning.employee,
          warnings: [],
        };
      }
      acc[employeeId].warnings.push(warning);
      return acc;
    },
    {} as Record<
      string,
      { employee: Employee; warnings: WarningWithEmployee[] }
    >,
  );

  const totalWarnings = warnings.length;
  const activeWarnings = warnings.filter(
    (w) => getWarningStatus(w) === "ACTIVE",
  ).length;
  const resolvedWarnings = warnings.filter(
    (w) => getWarningStatus(w) === "RESOLVED",
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Warning Management</CardTitle>
            <CardDescription>
              View and manage all warnings - both active and resolved
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {totalWarnings}
              </div>
              <div className="text-sm text-blue-800">Total Warnings</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {activeWarnings}
              </div>
              <div className="text-sm text-red-800">Active Warnings</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {resolvedWarnings}
              </div>
              <div className="text-sm text-green-800">Resolved Warnings</div>
            </div>
          </div>

          <Tabs
            value={warningFilter}
            onValueChange={(value: any) => setWarningFilter(value)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All Warnings ({totalWarnings})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeWarnings})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({resolvedWarnings})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={warningFilter} className="space-y-4">
              {Object.keys(warningsByEmployee).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No warnings found
                </div>
              ) : (
                Object.values(warningsByEmployee).map(
                  ({ employee, warnings: employeeWarnings }) => (
                    <div key={employee.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={employee.avatar || "/placeholder.svg"}
                            />
                            <AvatarFallback>
                              {employee.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {employee.position} • {employee.department}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Performance Score: {employee.currentPoints} •{" "}
                              {employee.status}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {employeeWarnings.length} Warning(s)
                        </Badge>
                      </div>

                      {employeeWarnings.map((warning) => {
                        const status = getWarningStatus(warning);
                        return (
                          <div
                            key={warning.id}
                            className={`ml-11 p-3 border rounded mb-2 ${getWarningCardStyle(status)}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <p
                                    className={`font-medium capitalize ${getWarningTextStyle(status)}`}
                                  >
                                    {warning.severity} Warning - {warning.type}
                                  </p>
                                  <Badge
                                    variant={getWarningBadgeVariant(status)}
                                  >
                                    {getWarningBadgeText(status)}
                                  </Badge>
                                </div>
                                <p
                                  className={`text-sm ${getWarningTextStyle(status)}`}
                                >
                                  {warning.reason}
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`text-xs ${getWarningTextStyle(status)}`}
                                >
                                  Issued:{" "}
                                  {new Date(warning.date).toLocaleDateString()}
                                </p>
                                {warning.resolvedAt && (
                                  <p className="text-xs text-green-600">
                                    Resolved:{" "}
                                    {new Date(
                                      warning.resolvedAt,
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>

                            {warning.actionPlan && (
                              <div
                                className={`mt-2 p-2 rounded ${status === "ACTIVE" || status === "APPEALED" ? "bg-red-100" : "bg-green-100"}`}
                              >
                                <p
                                  className={`text-xs font-medium ${getWarningTextStyle(status)}`}
                                >
                                  Action Plan:
                                </p>
                                <p
                                  className={`text-xs ${getWarningTextStyle(status)}`}
                                >
                                  {warning.actionPlan}
                                </p>
                              </div>
                            )}

                            {warning.appealReason && (
                              <div className="mt-2 p-2 bg-amber-100 rounded border border-amber-200">
                                <p className="text-xs font-medium text-amber-800 flex justify-between">
                                  <span>Appeal from worker:</span>
                                  <span>
                                    {warning.appealDate
                                      ? new Date(
                                          warning.appealDate,
                                        ).toLocaleDateString()
                                      : ""}
                                  </span>
                                </p>
                                <p className="text-sm text-amber-900 mt-1 italic">
                                  "{warning.appealReason}"
                                </p>
                              </div>
                            )}

                            {warning.adminDecision && (
                              <div className="mt-2 p-2 bg-blue-100 rounded border border-blue-200">
                                <p className="text-xs font-medium text-blue-800">
                                  Admin Decision/Next Steps:
                                </p>
                                <p className="text-sm text-blue-900 mt-1">
                                  {warning.adminDecision}
                                </p>
                                {warning.workerResponse === "ACCEPTED" && (
                                  <div className="mt-1 flex items-center text-xs text-green-700 font-medium">
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-200 text-green-800 mr-2"
                                    >
                                      ACCEPTED
                                    </Badge>
                                    Worker acknowledged on{" "}
                                    {warning.workerResponseDate
                                      ? new Date(
                                          warning.workerResponseDate,
                                        ).toLocaleDateString()
                                      : ""}
                                  </div>
                                )}
                              </div>
                            )}

                            {warning.resolutionNotes && (
                              <div className="mt-2 p-2 bg-green-100 rounded">
                                <p className="text-xs font-medium text-green-800">
                                  Resolution Notes:
                                </p>
                                <p className="text-xs text-green-700">
                                  {warning.resolutionNotes}
                                </p>
                              </div>
                            )}

                            {(canEditPerfomance || hasFullAccess) &&
                              [
                                "ACTIVE",
                                "APPEALED",
                                "NEXT_STEP",
                                "NEXT_STEP_ACCEPTED",
                              ].includes(status) && (
                                <div className="flex justify-end mt-3 space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      onResolveWarning(warning, employee)
                                    }
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                  >
                                    {status === "APPEALED" ||
                                    status === "NEXT_STEP_ACCEPTED"
                                      ? "Review Response"
                                      : "Mark as Resolved"}
                                  </Button>
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  ),
                )
              )}
            </TabsContent>
          </Tabs>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">
              Warning Management System
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>
                • <strong>Active Warnings</strong> (Red) - Currently affecting
                performance scores
              </li>
              <li>
                • <strong>Resolved Warnings</strong> (Green) - Archived but
                maintained for record keeping
              </li>
              <li>
                • Resolve active warnings when performance issues are addressed
              </li>
              <li>• All warning history is preserved for audit purposes</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
