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
  History,
  User,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  CircleDollarSign,
} from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { format } from "date-fns";
import Image from "next/image";

interface HistoryReturnsFilterTableProps {
  data: any[];
  isLoading: boolean;
}

export default function HistoryReturnsFilterTable({
  data,
  isLoading,
}: HistoryReturnsFilterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case "EXCELLENT":
      case "GOOD":
        return <ShieldCheck className="h-3 w-3 text-muted-foreground" />;
      case "FAIR":
        return <AlertCircle className="h-3 w-3 text-muted-foreground" />;
      case "POOR":
      case "DAMAGED":
        return <ShieldAlert className="h-3 w-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getConditionStyles = (condition: string) => {
    switch (condition) {
      default:
        return "bg-secondary text-secondary-foreground border-transparent";
    }
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    if (conditionFilter !== "all") {
      result = result.filter((item) => item.condition === conditionFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.toolName.toLowerCase().includes(term) ||
          item.workerName.toLowerCase().includes(term) ||
          item.serialNumber?.toLowerCase().includes(term),
      );
    }

    return result;
  }, [data, searchTerm, conditionFilter]);

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
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
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
              <SelectItem value="DAMAGED">Damaged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border shadow-sm bg-background/50 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Return Audit History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="w-[80px] pl-6 text-[11px] uppercase font-bold tracking-wider">
                  Tool
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider">
                  Worker & ID
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider">
                  Return Details
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider">
                  Condition
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider text-right pr-6">
                  Processed On
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading history...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center py-12">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <History className="h-10 w-10 mb-2" />
                      <p>No return records found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((record) => (
                  <TableRow key={record.id} className="group transition-colors">
                    <TableCell className="pl-6">
                      <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-background group-hover:scale-105 transition-transform">
                        {record.images?.[0] ? (
                          <Image
                            src={record.images[0]}
                            alt={record.toolName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted text-[8px] text-muted-foreground font-bold">
                            IMG
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight">
                          {record.toolName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {record.workerName}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground/70">
                          {record.serialNumber || "No SN"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1 font-bold h-4"
                          >
                            QTY: {record.quantity}
                          </Badge>
                          {record.damageCost > 0 && (
                            <Badge className="bg-muted text-foreground border-transparent text-[9px] px-1 h-4 flex gap-1 items-center">
                              <CircleDollarSign className="h-2 w-2" />R
                              {record.damageCost}
                            </Badge>
                          )}
                        </div>
                        {record.damageDescription && (
                          <span className="text-[10px] text-muted-foreground line-clamp-1 italic max-w-[200px]">
                            "{record.damageDescription}"
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getConditionIcon(record.condition)}
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold px-1.5 h-4 ${getConditionStyles(record.condition)}`}
                        >
                          {record.condition}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-bold px-1.5 h-4 w-fit uppercase"
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(record.returnedDate), "PP")}
                        </div>
                        <div className="text-[9px] text-muted-foreground/60 mt-0.5">
                          By:{" "}
                          <span className="font-bold">
                            {record.processedBy}
                          </span>
                        </div>
                      </div>
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
