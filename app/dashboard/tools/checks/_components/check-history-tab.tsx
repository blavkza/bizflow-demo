"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  Wrench,
  CheckCircle2,
  XCircle,
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
import { Label } from "@/components/ui/label";
import { ToolCheck } from "./types";

interface CheckHistoryTabProps {
  checkHistory: ToolCheck[];
}

export function CheckHistoryTab({ checkHistory }: CheckHistoryTabProps) {
  // History filters
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [historyWorkerFilter, setHistoryWorkerFilter] = useState("");

  const filteredHistory = useMemo(() => {
    return checkHistory.filter((check) => {
      // Date filter
      if (historyStartDate) {
        const checkDate = new Date(check.checkDate);
        const startDate = new Date(historyStartDate);
        if (checkDate < startDate) return false;
      }
      if (historyEndDate) {
        const checkDate = new Date(check.checkDate);
        const endDate = new Date(historyEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (checkDate > endDate) return false;
      }
      // Worker filter
      if (historyWorkerFilter) {
        return check.workerName
          .toLowerCase()
          .includes(historyWorkerFilter.toLowerCase());
      }
      return true;
    });
  }, [checkHistory, historyStartDate, historyEndDate, historyWorkerFilter]);

  const workerGroups = useMemo(() => {
    const grouped = filteredHistory.reduce(
      (acc, check) => {
        if (!acc[check.workerName]) {
          acc[check.workerName] = {
            workerName: check.workerName,
            workerNumber: check.workerNumber,
            checks: [],
          };
        }
        acc[check.workerName].checks.push(check);
        return acc;
      },
      {} as Record<
        string,
        {
          workerName: string;
          workerNumber: string;
          checks: ToolCheck[];
        }
      >,
    );
    return Object.values(grouped);
  }, [filteredHistory]);

  return (
    <div className="space-y-4">
      {/* History Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workerFilter">Filter by Worker</Label>
              <Input
                id="workerFilter"
                placeholder="Search worker name..."
                value={historyWorkerFilter}
                onChange={(e) => setHistoryWorkerFilter(e.target.value)}
              />
            </div>
          </div>
          {(historyStartDate || historyEndDate || historyWorkerFilter) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHistoryStartDate("");
                  setHistoryEndDate("");
                  setHistoryWorkerFilter("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {checkHistory.length === 0
                ? "No check history available"
                : "No checks found matching your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workerGroups.map((group) => (
            <Card key={group.workerName}>
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
                      <CardDescription className="text-xs">
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                        >
                          {group.workerNumber}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {group.checks.length} Check
                    {group.checks.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.checks.map((check) => (
                    <Card key={check.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex gap-2 mb-2">
                          {check.toolImage ? (
                            <Image
                              src={check.toolImage}
                              alt={check.toolName}
                              width={50}
                              height={50}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <Wrench className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">
                              {check.toolName}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {check.toolSerialNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(check.checkDate), "PP")}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1 flex-wrap mb-2">
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0"
                          >
                            {check.condition}
                          </Badge>
                          {check.isPresent ? (
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                              Present
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="text-xs px-1.5 py-0"
                            >
                              <XCircle className="h-2.5 w-2.5 mr-0.5" />
                              Missing
                            </Badge>
                          )}
                          {check.isLost && (
                            <Badge
                              variant="destructive"
                              className="text-xs px-1.5 py-0"
                            >
                              Lost
                            </Badge>
                          )}
                        </div>

                        {check.damageCost > 0 && (
                          <div className="p-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-900 mb-1">
                            <p className="font-medium">
                              Damage: R {check.damageCost.toFixed(2)}
                            </p>
                            {check.damageDescription && (
                              <p className="text-red-700 text-[10px] mt-0.5 line-clamp-1">
                                {check.damageDescription}
                              </p>
                            )}
                          </div>
                        )}

                        {check.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {check.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
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
