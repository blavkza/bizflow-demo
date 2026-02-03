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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Clock,
  User,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { format } from "date-fns";
import Image from "next/image";
import { ApproveReturnDialog } from "./ApproveReturnDialog";

interface PendingReturnsFilterTableProps {
  data: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function PendingReturnsFilterTable({
  data,
  isLoading,
  onRefresh,
}: PendingReturnsFilterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);

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

  const filteredData = useMemo(() => {
    let result = data.filter((item) => !item.isApproved);

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
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleAction = (record: any) => {
    setSelectedRecord(record);
    setIsApproveOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pending requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <Card className="border-orange-200 shadow-sm bg-background/50 overflow-hidden">
        <CardHeader className="bg-orange-50/50 pb-4 border-b border-orange-100">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-orange-700">
            <Clock className="h-5 w-5" />
            Pending Return Approvals
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
                  Details
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider">
                  Reported Cond.
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider">
                  Requested On
                </TableHead>
                <TableHead className="text-[11px] uppercase font-bold tracking-wider text-right pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading pending returns...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center py-12">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <CheckCircle2 className="h-10 w-10 mb-2 text-green-600" />
                      <p>All returns processed! No pending requests.</p>
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
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1 font-bold h-4 w-fit"
                        >
                          QTY: {record.quantity}
                        </Badge>
                        {record.damageDescription && (
                          <span className="text-[10px] text-destructive line-clamp-1 italic max-w-[200px] font-medium">
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
                          className="text-[9px] font-bold px-1.5 h-4 bg-secondary"
                        >
                          {record.condition}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(record.returnedDate), "PPp")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        size="sm"
                        className="h-8 bg-orange-600 hover:bg-orange-700 text-xs font-bold"
                        onClick={() => handleAction(record)}
                      >
                        Process Request
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

      <ApproveReturnDialog
        record={selectedRecord}
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
