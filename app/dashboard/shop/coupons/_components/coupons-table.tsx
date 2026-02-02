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
import { Button } from "@/components/ui/button";
import { Edit, Trash, MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

import { CouponColumn } from "./columns";
import { CouponFilters } from "./coupon-filters";
import { PaginationControls } from "@/components/PaginationControls";

interface CouponsTableProps {
  data: CouponColumn[];
  onEdit: (coupon: CouponColumn) => void;
  onDelete: (id: string) => void;
}

export default function CouponsTable({
  data,
  onEdit,
  onDelete,
}: CouponsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredCoupons = useMemo(() => {
    let result = [...data];

    // Status Filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter((item) => item.isActive === isActive);
    }

    // Type Filter
    if (typeFilter !== "all") {
      result = result.filter((item) => item.type === typeFilter);
    }

    // Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) =>
        item.code.toLowerCase().includes(term)
      );
    }

    // Sorting
    if (sortOption === "newest") {
       // Assuming data comes sorted by default or handled elsewhere for now
    } else if (sortOption === "oldest") {
        result.reverse(); 
    } else if (sortOption === "usage-high") {
        result.sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0));
    } else if  (sortOption === "usage-low") {
        result.sort((a, b) => (a.usedCount || 0) - (b.usedCount || 0));
    }


    return result;
  }, [data, searchTerm, statusFilter, typeFilter, sortOption]);

  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const paginatedCoupons = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCoupons.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCoupons, currentPage, itemsPerPage]);

  const resetPagination = () => setCurrentPage(1);

  return (
    <div className="space-y-4">
      <CouponFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        sortOption={sortOption}
        onSearchChange={(v) => { setSearchTerm(v); resetPagination(); }}
        onStatusFilterChange={(v) => { setStatusFilter(v); resetPagination(); }}
        onTypeFilterChange={(v) => { setTypeFilter(v); resetPagination(); }}
        onSortOptionChange={(v) => { setSortOption(v); resetPagination(); }}
      />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Coupon Management</CardTitle>
              <CardDescription>
                {filteredCoupons.length} coupon(s) found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCoupons.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                              No results.
                          </TableCell>
                      </TableRow>
                  ) : (
                    paginatedCoupons.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                            <Link href={`/dashboard/shop/coupons/${item.id}`} className="hover:underline text-blue-600">
                                {item.code}
                            </Link>
                        </TableCell>
                        <TableCell>{item.type === "PERCENTAGE" ? "Percentage" : "Fixed Amount"}</TableCell>
                        <TableCell>
                             {item.type === "PERCENTAGE" ? `${item.value}%` : `$${item.value}`}
                        </TableCell>
                        <TableCell>
                            {item.startDate} {item.endDate !== "N/A" ? ` - ${item.endDate}` : ""}
                        </TableCell>
                        <TableCell>
                            {item.usedCount} / {item.usageLimit ? item.usageLimit : "∞"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? "default" : "secondary"}>
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/shop/coupons/${item.id}`} className="cursor-pointer flex items-center">
                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDelete(item.id)}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                              >
                                <Trash className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {filteredCoupons.length > 0 && (
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
        </CardContent>
      </Card>
    </div>
  );
}
