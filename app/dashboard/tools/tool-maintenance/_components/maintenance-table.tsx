"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreVertical,
  Calendar,
  User,
} from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { UpdateStatusDialog } from "./update-status-dialog";

interface MaintenanceFilterTableProps {
  data: any[];
  isLoading: boolean;
}

export function MaintenanceFilterTable({
  data,
  isLoading,
}: MaintenanceFilterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
      case "HIGH":
        return <Badge variant="destructive">{priority}</Badge>; // Keep semantic meaning for urgent/high
      case "MEDIUM":
        return <Badge variant="secondary">{priority}</Badge>;
      case "LOW":
        return <Badge variant="outline">{priority}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600">
            COMPLETED
          </Badge>
        );
      case "IN_PROGRESS":
        return <Badge variant="secondary">IN PROGRESS</Badge>;
      case "PENDING":
        return <Badge variant="secondary">PENDING</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((item) => item.priority === priorityFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.toolName.toLowerCase().includes(term) ||
          item.serialNumber?.toLowerCase().includes(term) ||
          item.issueDescription?.toLowerCase().includes(term),
      );
    }

    return result;
  }, [data, searchTerm, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools, issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border shadow-sm bg-background/50 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            Maintenance Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="w-[80px] pl-6 text-[11px] uppercase font-bold tracking-wider">
                  Tool Details
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider">
                  Issue Description
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider">
                  Reported By
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider">
                  Priority
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider">
                  Date Logged
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider text-right pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading logs...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center py-12">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Wrench className="h-10 w-10 mb-2" />
                      <p>No maintenance records found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((record) => (
                  <TableRow
                    onClick={() =>
                      router.push(
                        `/dashboard/tools/tool-maintenance/${record.id}`,
                      )
                    }
                    key={record.id}
                    className="group cursor-pointer transition-colors"
                  >
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight">
                          {record.toolName}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/70">
                          {record.serialNumber || "No SN"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-2 max-w-[300px]">
                        {record.issueDescription || "No description provided."}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {record.reportedBy || "System"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(record.priority)}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(record.createdAt), "PPP")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRecord(record);
                              setUpdateDialogOpen(true);
                            }}
                          >
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/dashboard/tools/tool-maintenance/${record.id}`,
                              )
                            }
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Delete Log
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredData.length > 0 && (
        <PaginationControls
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(Number(val));
            setCurrentPage(1);
          }}
          onPageChange={setCurrentPage}
        />
      )}
      {selectedRecord && (
        <UpdateStatusDialog
          isOpen={updateDialogOpen}
          onClose={() => {
            setUpdateDialogOpen(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
        />
      )}
    </div>
  );
}
