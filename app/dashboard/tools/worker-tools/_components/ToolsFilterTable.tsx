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
import { PaginationControls } from "@/components/PaginationControls";
import { ToolColumn } from "./tool-columns";
import Image from "next/image";
import { CellAction } from "./cell-action";
import { useRouter } from "next/navigation";
import { formatCurrency } from "../../utils";

interface ToolsFilterTableProps {
  tools: ToolColumn[];
}

export default function ToolsFilterTable({ tools }: ToolsFilterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const router = useRouter();

  const getConditionStyles = (condition: string) => {
    switch (condition) {
      default:
        return "bg-secondary text-secondary-foreground border-transparent";
    }
  };

  // Filter to show only main tools (not allocated to any employee/freelancer)
  const mainTools = useMemo(() => {
    return tools.filter((tool) => {
      // Check if tool is not allocated to anyone
      const isNotAllocated = !tool.employeeId && !tool.freelancerId;

      // Also check status if needed (optional)
      const isAvailable = tool.status !== "ALLOCATED";

      return isNotAllocated && isAvailable;
    });
  }, [tools]);

  const filteredTools = useMemo(() => {
    let result = [...mainTools];

    // Status Filter - only show statuses that make sense for main tools
    if (statusFilter !== "all") {
      result = result.filter((tool) => tool.status === statusFilter);
    }

    // Condition Filter
    if (conditionFilter !== "all") {
      result = result.filter((tool) => tool.condition === conditionFilter);
    }

    // Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (tool) =>
          tool.name.toLowerCase().includes(term) ||
          tool.serialNumber?.toLowerCase().includes(term),
      );
    }

    // Sort
    if (sortOption === "newest") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "price_high") {
      result.sort((a, b) => b.purchasePrice - a.purchasePrice);
    } else if (sortOption === "price_low") {
      result.sort((a, b) => a.purchasePrice - b.purchasePrice);
    }

    return result;
  }, [mainTools, searchTerm, statusFilter, conditionFilter, sortOption]);

  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  const paginatedTools = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTools.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTools, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <Input
            placeholder="Search unallocated tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[200px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="DAMAGED">Damaged</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="LOST">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="EXCELLENT">Excellent</SelectItem>
              <SelectItem value="GOOD">Good</SelectItem>
              <SelectItem value="FAIR">Fair</SelectItem>
              <SelectItem value="POOR">Poor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats badge showing count of unallocated tools */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredTools.length} unallocated tool
          {filteredTools.length !== 1 ? "s" : ""}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unallocated Tools (Inventory)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Serial/Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {tools.length === 0
                        ? "No tools in inventory."
                        : "All tools are currently allocated. No unallocated tools found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTools.map((tool) => (
                    <TableRow
                      onClick={() =>
                        router.push(`/dashboard/tools/worker-tools/${tool.id}`)
                      }
                      className="cursor-pointer hover:bg-muted/50"
                      key={tool.id}
                    >
                      <TableCell>
                        <div className="relative h-12 w-12 rounded-md overflow-hidden border border-gray-200">
                          {tool.images && tool.images.length > 0 ? (
                            <Image
                              src={tool.images[0]}
                              alt={tool.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-secondary text-secondary-foreground text-xs">
                              No Img
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell>{tool.quantity}</TableCell>
                      <TableCell>
                        {formatCurrency(tool.purchasePrice)}
                      </TableCell>
                      <TableCell>{tool.serialNumber || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tool.status === "AVAILABLE"
                              ? "default"
                              : tool.status === "DAMAGED"
                                ? "destructive"
                                : tool.status === "MAINTENANCE"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {tool.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getConditionStyles(tool.condition)}
                        >
                          {tool.condition}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <CellAction data={tool} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredTools.length > 0 && (
            <div className="mt-4">
              <PaginationControls
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                totalPages={totalPages}
                onItemsPerPageChange={(val) => handleItemsPerPageChange(val)}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
