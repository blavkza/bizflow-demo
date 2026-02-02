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
import { Button } from "@/components/ui/button";
import { Search, Calendar, User, Hammer } from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { format } from "date-fns";
import Image from "next/image";

interface ActiveReturnsFilterTableProps {
  data: any[];
  onReturn: (tool: any) => void;
  isLoading: boolean;
}

export default function ActiveReturnsFilterTable({
  data,
  onReturn,
  isLoading,
}: ActiveReturnsFilterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getConditionStyles = (condition: string) => {
    switch (condition) {
      default:
        return "bg-secondary text-secondary-foreground border-transparent";
    }
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    if (workerTypeFilter !== "all") {
      result = result.filter((item) => item.workerType === workerTypeFilter);
    }

    if (conditionFilter !== "all") {
      result = result.filter((item) => item.condition === conditionFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.workerName.toLowerCase().includes(term) ||
          item.serialNumber?.toLowerCase().includes(term),
      );
    }

    return result;
  }, [data, searchTerm, workerTypeFilter, conditionFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="relative w-[250px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search allocations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={workerTypeFilter} onValueChange={setWorkerTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Worker Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workers</SelectItem>
              <SelectItem value="EMPLOYEE">Employees</SelectItem>
              <SelectItem value="FREELANCER">Freelancers</SelectItem>
            </SelectContent>
          </Select>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-[150px]">
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
        </div>
      </div>

      <Card className="border shadow-sm bg-background/50 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            Active Allocations Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="w-[80px] pl-6">Tool</TableHead>
                <TableHead>Worker Details</TableHead>
                <TableHead>ID / Serial</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Assigned On</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center py-12">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Hammer className="h-10 w-10 mb-2" />
                      <p>No active allocations found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className="group transition-colors">
                    <TableCell className="pl-6">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg border bg-background">
                        {item.images?.[0] ? (
                          <Image
                            src={item.images[0]}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] text-muted-foreground font-medium">
                            NO IMG
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground">
                            {item.workerName}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1 h-3.5 uppercase"
                          >
                            {item.workerType}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {item.serialNumber || "No Serial"}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground py-0.5">
                          QTY: {item.quantity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${getConditionStyles(item.condition)}`}
                      >
                        {item.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {item.assignedDate
                          ? format(new Date(item.assignedDate), "PP")
                          : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-bold rounded-full transition-all"
                        onClick={() => onReturn(item)}
                      >
                        Return Tool
                      </Button>
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
    </div>
  );
}
