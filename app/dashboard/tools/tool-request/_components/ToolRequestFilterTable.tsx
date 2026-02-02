"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ToolRequestFilters } from "./ToolRequestFilters";
import { PaginationControls } from "@/components/PaginationControls";
import { useRouter } from "next/navigation";
import { ToolRequest } from "./columns";
import { CellAction } from "./cell-action";

interface ToolRequestFilterTableProps {
  data: ToolRequest[];
}

export default function ToolRequestFilterTable({
  data,
}: ToolRequestFilterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply status filter
    if (statusFilter === "urgent") {
      result = result.filter((item) => item.priority === "URGENT");
    } else if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.toolName.toLowerCase().includes(term) ||
          item.employee?.firstName.toLowerCase().includes(term) ||
          item.employee?.lastName.toLowerCase().includes(term) ||
          item.freelancer?.firstName.toLowerCase().includes(term) ||
          item.freelancer?.lastName.toLowerCase().includes(term),
      );
    }

    // Apply sorting
    const priorityOrder: Record<string, number> = {
      URGENT: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    if (sortOption === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.requestedDate).getTime() -
          new Date(a.requestedDate).getTime(),
      );
    } else if (sortOption === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.requestedDate).getTime() -
          new Date(b.requestedDate).getTime(),
      );
    } else if (sortOption === "priority-high") {
      result.sort(
        (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
      );
    } else if (sortOption === "priority-low") {
      result.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
      );
    }

    return result;
  }, [data, searchTerm, statusFilter, sortOption]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const resetPagination = () => {
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <Badge variant="destructive">Urgent</Badge>;
      case "HIGH":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            High
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            Medium
          </Badge>
        );
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "APPROVED":
        return "default";
      case "REJECTED":
        return "destructive";
      case "WAITLIST":
        return "outline";
      default:
        return "default";
    }
  };

  const urgentCount = data.filter((item) => item.priority === "URGENT").length;

  return (
    <div>
      <ToolRequestFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        sortOption={sortOption}
        onSearchChange={(value) => {
          setSearchTerm(value);
          resetPagination();
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          resetPagination();
        }}
        onSortOptionChange={(value) => {
          setSortOption(value);
          resetPagination();
        }}
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Request History</CardTitle>
              <CardDescription>
                {filteredData.length} request(s) found
                {statusFilter === "urgent" && (
                  <span className="ml-2 text-red-600 font-medium">
                    • Viewing Urgent Requests
                  </span>
                )}
              </CardDescription>
            </div>
            {urgentCount > 0 && statusFilter !== "urgent" && (
              <button
                onClick={() => {
                  setStatusFilter("urgent");
                  resetPagination();
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                View Urgent ({urgentCount})
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="flex items-center justify-center p-6 text-muted-foreground italic">
              No tool requests found matching your filters.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item) => {
                    const worker = item.employee || item.freelancer;
                    const type = item.employee ? "Employee" : "Freelancer";

                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/dashboard/tools/tool-request/${item.id}`,
                          )
                        }
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center border shrink-0">
                              {item.toolImage ? (
                                <img
                                  src={item.toolImage}
                                  alt={item.toolName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="text-muted-foreground">
                                  <CardTitle className="p-0">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="20"
                                      height="20"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="lucide lucide-hammer"
                                    >
                                      <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
                                      <path d="M17.64 15 22 10.64" />
                                      <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.31a2 2 0 0 0-2-2h-.28a2 2 0 0 1-2-2V3a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v.42a2 2 0 0 1-2 2h-.37a2 2 0 0 0-2 2z" />
                                    </svg>
                                  </CardTitle>
                                </div>
                              )}
                            </div>
                            <div className="hover:underline text-blue-600 text-left line-clamp-1">
                              {item.toolName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {worker
                                ? `${worker.firstName} ${worker.lastName}`
                                : "Unknown"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {type} • {worker?.department?.name || "No Dept"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(item.status) as any}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(item.requestedDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CellAction data={item} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredData.length > 0 && (
                <PaginationControls
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
