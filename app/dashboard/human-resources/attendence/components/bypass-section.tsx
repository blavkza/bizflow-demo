"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  User,
  Briefcase,
  Zap,
  Calendar,
  Clock,
  Loader2,
  Plus,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SettingsDialog } from "./settingsDialog";

interface ApiEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface ApiFreelancer {
  id: string;
  freeLancerNumber: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface ApiTrainee {
  id: string;
  traineeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface BypassRule {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  bypassCheckIn: boolean;
  bypassCheckOut: boolean;
  customCheckInTime?: string | null;
  customCheckOutTime?: string | null;
  reason?: string | null;
  createdBy?: string | null;
  createdAt: Date | string;
  employees: ApiEmployee[];
  freelancers: ApiFreelancer[];
  trainees?: ApiTrainee[];
}

interface BypassSectionProps {
  initialRules?: BypassRule[];
}

export function BypassSection({ initialRules = [] }: BypassSectionProps) {
  const [rules, setRules] = useState<BypassRule[]>(initialRules);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BypassRule | null>(null);

  useEffect(() => {
    fetchBypassRules();
  }, []);

  const fetchBypassRules = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/attendance-bypass");
      if (response.data.bypassRules) {
        setRules(response.data.bypassRules);
      }
    } catch (err) {
      console.error("Error fetching bypass rules:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRule = (rule: BypassRule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await axios.delete(`/api/attendance-bypass?id=${id}`);
      setRules(rules.filter((r) => r.id !== id));
      toast.success("Rule deleted successfully");
    } catch (err) {
      toast.error("Failed to delete rule");
    }
  };

  const formatTimeDisplay = (time: string | null | undefined) => {
    if (!time || time === "none") return "Default";
    try {
      const [h, m] = time.split(":");
      return format(new Date().setHours(parseInt(h), parseInt(m)), "hh:mm a");
    } catch {
      return time;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">
            Active Bypass Rules
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage ongoing attendance overrides and custom schedules.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRule(null);
            setIsDialogOpen(true);
          }}
          className="gradient-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Rule
        </Button>
      </div>

      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px]">Period</TableHead>
                <TableHead>Assignees</TableHead>
                <TableHead>Bypass Settings</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Loading rules...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                      <Zap className="h-10 w-10 text-muted-foreground" />
                      <p className="text-muted-foreground font-medium">
                        No active bypass rules
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow
                    key={rule.id}
                    className="group hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <Calendar className="h-3 w-3 text-primary" />
                          <span>
                            {format(new Date(rule.startDate), "MMM dd")} -{" "}
                            {format(new Date(rule.endDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                          Created:{" "}
                          {format(new Date(rule.createdAt as string), "MMM dd")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {rule.employees.map((e) => (
                          <Badge
                            key={e.id}
                            variant="outline"
                            className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 gap-1"
                          >
                            <User className="h-2 w-2" /> {e.firstName}{" "}
                            {e.lastName.charAt(0)}.
                          </Badge>
                        ))}
                        {rule.freelancers.map((f) => (
                          <Badge
                            key={f.id}
                            variant="outline"
                            className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 gap-1"
                          >
                            <Briefcase className="h-2 w-2" /> {f.firstName}{" "}
                            {f.lastName.charAt(0)}.
                          </Badge>
                        ))}
                        {rule.trainees?.map((t) => (
                          <Badge
                            key={t.id}
                            variant="outline"
                            className="text-[10px] bg-green-50 text-green-700 border-green-200 gap-1"
                          >
                            {t.firstName} {t.lastName.charAt(0)}.
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        {rule.bypassCheckIn && (
                          <div className="flex items-center gap-2">
                            <Badge className="text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-100 border-none px-1.5 py-0">
                              Check-In:{" "}
                              {rule.customCheckInTime
                                ? formatTimeDisplay(rule.customCheckInTime)
                                : "Bypassed"}
                            </Badge>
                          </div>
                        )}
                        {rule.bypassCheckOut && (
                          <div className="flex items-center gap-2">
                            <Badge className="text-[10px] bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none px-1.5 py-0">
                              Check-Out:{" "}
                              {rule.customCheckOutTime
                                ? formatTimeDisplay(rule.customCheckOutTime)
                                : "Bypassed"}
                            </Badge>
                          </div>
                        )}
                        {!rule.bypassCheckIn && !rule.bypassCheckOut && (
                          <span className="text-xs text-muted-foreground italic">
                            No overrides
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {rule.reason || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRule(rule)}
                          className="text-primary hover:bg-primary/10 h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SettingsDialog
        isOpen={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingRule(null);
        }}
        editingRule={editingRule}
        onSaveRules={() => {
          fetchBypassRules();
          setIsDialogOpen(false);
          setEditingRule(null);
        }}
      />
    </div>
  );
}
