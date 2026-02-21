"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  User,
  Wrench,
  AlertTriangle,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tool, WorkerGroup } from "./types";

interface WorkerToolsTabProps {
  tools: Tool[];
  loading: boolean;
  onCheckTool: (tool: Tool) => void;
}

export function WorkerToolsTab({
  tools,
  loading,
  onCheckTool,
}: WorkerToolsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [workerTypeFilter, setWorkerTypeFilter] = useState<
    "all" | "employee" | "freelancer" | "trainee"
  >("all");

  const workerGroups = useMemo(() => {
    const grouped = tools.reduce(
      (acc, tool) => {
        const workerId =
          tool.employeeId ||
          tool.freelancerId ||
          tool.traineeId ||
          "unassigned";
        const workerType = tool.employeeId
          ? "employee"
          : tool.freelancerId
            ? "freelancer"
            : "trainee";

        if (!acc[workerId]) {
          acc[workerId] = {
            workerName: tool.workerName,
            workerNumber: tool.workerNumber,
            workerId,
            workerType,
            tools: [],
            totalTools: 0,
            toolsNeedingCheck: 0,
          };
        }

        acc[workerId].tools.push(tool);
        acc[workerId].totalTools++;
        if (tool.needsCheck) {
          acc[workerId].toolsNeedingCheck++;
        }

        return acc;
      },
      {} as Record<string, WorkerGroup>,
    );
    return Object.values(grouped);
  }, [tools]);

  const filteredWorkerGroups = useMemo(() => {
    return workerGroups.filter((group) => {
      // Filter by worker type
      if (workerTypeFilter !== "all" && group.workerType !== workerTypeFilter) {
        return false;
      }

      // Filter by search query
      return (
        group.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.workerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.tools.some(
          (tool) =>
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.serialNumber
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()),
        )
      );
    });
  }, [workerGroups, workerTypeFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workers or tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Worker Type Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground mr-2">Filter by:</span>
          <Button
            variant={workerTypeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setWorkerTypeFilter("all")}
          >
            All Workers
          </Button>
          <Button
            variant={workerTypeFilter === "employee" ? "default" : "outline"}
            size="sm"
            onClick={() => setWorkerTypeFilter("employee")}
          >
            Employees
          </Button>
          <Button
            variant={workerTypeFilter === "freelancer" ? "default" : "outline"}
            size="sm"
            onClick={() => setWorkerTypeFilter("freelancer")}
          >
            Freelancers
          </Button>
          <Button
            variant={workerTypeFilter === "trainee" ? "default" : "outline"}
            size="sm"
            onClick={() => setWorkerTypeFilter("trainee")}
          >
            Trainees
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              Loading workers and tools...
            </p>
          </CardContent>
        </Card>
      ) : filteredWorkerGroups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No workers with allocated tools found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWorkerGroups.map((group) => (
            <Card key={group.workerId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {group.workerName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                        >
                          {group.workerNumber}
                        </Badge>
                        <span>•</span>
                        <span className="capitalize">{group.workerType}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {group.totalTools} Tool
                      {group.totalTools !== 1 ? "s" : ""}
                    </Badge>
                    {group.toolsNeedingCheck > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {group.toolsNeedingCheck} Need Check
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                  {group.tools.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => {
                        if (tool.needsCheck) {
                          onCheckTool(tool);
                        }
                      }}
                      className={`relative p-2 border rounded transition-all ${
                        tool.needsCheck
                          ? "cursor-pointer hover:shadow-md hover:scale-105 border-orange-500 bg-orange-50"
                          : "cursor-not-allowed border-green-200 bg-green-50/30 opacity-80"
                      }`}
                    >
                      {/* Tool Image */}
                      <div className="aspect-square mb-1.5 rounded overflow-hidden bg-muted">
                        {tool.images && tool.images[0] ? (
                          <Image
                            src={tool.images[0]}
                            alt={tool.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Wrench className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Tool Info */}
                      <div className="space-y-0.5">
                        <h4
                          className="font-medium text-xs truncate"
                          title={tool.name}
                        >
                          {tool.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {tool.serialNumber || "No Serial"}
                        </p>

                        {/* Last Check */}
                        <div className="flex justify-between items-center mt-1">
                          {tool.lastCheckDate ? (
                            <p className="text-[10px] text-muted-foreground">
                              {tool.daysSinceCheck}d ago
                            </p>
                          ) : (
                            <p className="text-[10px] text-orange-600 font-medium">
                              Never
                            </p>
                          )}
                          <p className="text-[10px] font-bold text-blue-600">
                            R{tool.purchasePrice}
                          </p>
                        </div>
                      </div>

                      {/* Check Required Indicator */}
                      {tool.needsCheck ? (
                        <div className="absolute top-1 right-1">
                          <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                        </div>
                      ) : (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
