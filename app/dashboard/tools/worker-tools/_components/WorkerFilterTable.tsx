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
import { PaginationControls } from "@/components/PaginationControls";
import { CellAction } from "./cell-action"; // Or custom action if needed
import { useRouter } from "next/navigation";
import { WorkerColumn } from "./worker-columns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

interface WorkerFilterTableProps {
  workers: WorkerColumn[];
  title: string;
}

export default function WorkerFilterTable({
  workers,
  title,
}: WorkerFilterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("tools_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const router = useRouter();

  const filteredWorkers = useMemo(() => {
    let result = [...workers];

    // Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((worker) =>
        worker.name.toLowerCase().includes(term),
      );
    }

    // Sort
    if (sortOption === "tools_desc") {
      result.sort((a, b) => b.toolsCount - a.toolsCount);
    } else if (sortOption === "tools_asc") {
      result.sort((a, b) => a.toolsCount - b.toolsCount);
    } else if (sortOption === "value_desc") {
      result.sort((a, b) => b.totalValue - a.totalValue);
    } else if (sortOption === "damage_desc") {
      result.sort((a, b) => b.damageCost - a.damageCost);
    }

    return result;
  }, [workers, searchTerm, sortOption]);

  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
  const paginatedWorkers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWorkers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWorkers, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filters Section matching InvoiceFilters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[250px]"
          />
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tools_desc">Tools (Most)</SelectItem>
              <SelectItem value="tools_asc">Tools (Least)</SelectItem>
              <SelectItem value="value_desc">Total Value (High)</SelectItem>
              <SelectItem value="damage_desc">Damage Cost (High)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tools Count</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Damage Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedWorkers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No workers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedWorkers.map((worker) => {
                    const type = (worker as any).type
                      ? (worker as any).type.toLowerCase()
                      : "employee";
                    return (
                      <TableRow
                        onClick={() =>
                          router.push(
                            `/dashboard/tools/worker-tools/allocation/${type}/${worker.id}`,
                          )
                        }
                        key={worker.id}
                        className="hover:bg-muted/50 cursor-pointer"
                      >
                        <TableCell className="font-medium">
                          {worker.name}
                        </TableCell>
                        <TableCell>{worker.toolsCount}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("en-ZA", {
                            style: "currency",
                            currency: "ZAR",
                          }).format(worker.totalValue)}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("en-ZA", {
                            style: "currency",
                            currency: "ZAR",
                          }).format(worker.damageCost)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {filteredWorkers.length > 0 && (
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
