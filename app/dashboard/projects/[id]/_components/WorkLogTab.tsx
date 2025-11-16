"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Search, Trash2, User } from "lucide-react";
import { Project, WorkLog } from "../type";
import { format } from "date-fns";
import { toast } from "sonner";

interface WorkLogTabProps {
  project: Project;
  fetchProject: () => void;
  currentUserId: string;
  isManager: boolean;
  currentUserRole: string | null;
}

export function WorkLogTab({
  project,
  fetchProject,
  currentUserId,
  isManager,
  currentUserRole,
}: WorkLogTabProps) {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch work logs when component mounts
  useEffect(() => {
    const fetchWorkLogs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${project.id}/work-logs`);
        if (response.ok) {
          const data = await response.json();
          setWorkLogs(data || []);
        } else {
          console.error("Failed to fetch work logs");
          setWorkLogs([]);
        }
      } catch (error) {
        console.error("Error fetching work logs:", error);
        setWorkLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkLogs();
  }, [project.id]);

  // Get unique users for filter - with safe handling
  const uniqueUsers = Array.from(
    new Map(
      workLogs
        .filter((log) => log?.user?.id) // Filter out logs without user or user.id
        .map((log) => [log.user.id, log.user])
    ).values()
  );

  // Filter work logs with safe access
  const filteredWorkLogs = workLogs.filter((log) => {
    if (!log?.user) return false;

    const matchesSearch =
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUser = userFilter === "all" || log.user.id === userFilter;

    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "today" && isToday(new Date(log.date))) ||
      (dateFilter === "week" && isThisWeek(new Date(log.date))) ||
      (dateFilter === "month" && isThisMonth(new Date(log.date)));

    return matchesSearch && matchesUser && matchesDate;
  });

  // Calculate totals with safe access and ensure numbers
  const totalHours = workLogs.reduce((sum, log) => {
    const hours = Number(log.hours) || 0;
    return sum + hours;
  }, 0);

  const userHours = workLogs
    .filter((log) => log.user?.id === currentUserId)
    .reduce((sum, log) => {
      const hours = Number(log.hours) || 0;
      return sum + hours;
    }, 0);

  // Safe number formatting
  const formatHours = (hours: number): string => {
    if (isNaN(hours) || !isFinite(hours)) return "0.0";
    return hours.toFixed(1);
  };

  const handleDeleteWorkLog = async (workLogId: string) => {
    if (!confirm("Are you sure you want to delete this work log?")) return;

    try {
      const response = await fetch(
        `/api/projects/${project.id}/work-logs?workLogId=${workLogId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete work log");
      }

      setWorkLogs(workLogs.filter((log) => log.id !== workLogId));
      toast.success("Work log deleted successfully");
      fetchProject(); // Refresh project data
    } catch (error) {
      console.error("Error deleting work log:", error);
      toast.error("Failed to delete work log");
    }
  };

  const canDeleteWorkLog = (workLog: WorkLog) => {
    return (
      isManager ||
      currentUserRole === "ADMIN" ||
      workLog.user?.id === currentUserId
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading work logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Hours
                </p>
                <p className="text-2xl font-bold">{formatHours(totalHours)}h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Your Hours
                </p>
                <p className="text-2xl font-bold">{formatHours(userHours)}h</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Entries
                </p>
                <p className="text-2xl font-bold">{workLogs.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Work Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search work logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || "Unknown User"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Work Logs Table */}
          {filteredWorkLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No work logs found</p>
              <p className="text-sm">
                {workLogs.length === 0
                  ? "Start by adding your first work log entry"
                  : "No work logs match your current filters"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {format(new Date(log.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.user?.avatar ? (
                            <img
                              src={log.user.avatar}
                              alt={log.user.name || "User"}
                              className="h-6 w-6 rounded-full"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-3 w-3" />
                            </div>
                          )}
                          <span>{log.user?.name || "Unknown User"}</span>
                          {log.user?.id === currentUserId && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {formatHours(Number(log.hours) || 0)}h
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate" title={log.description}>
                          {log.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        {canDeleteWorkLog(log) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWorkLog(log.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions for date filtering
function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isThisWeek(date: Date): boolean {
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  return date >= startOfWeek && date <= endOfWeek;
}

function isThisMonth(date: Date): boolean {
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
