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
import { Eye, AlertTriangle, MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { LoanFilters } from "./LoanFilters";
import { calculateLoan } from "@/lib/loan-calc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";
import { PaginationControls } from "@/components/PaginationControls";
import { useRouter } from "next/navigation";
import { LoanColumn } from "./loan-columns";

interface LoansFilterTableProps {
  loans: LoanColumn[];
  onEdit: (loan: LoanColumn) => void;
}

export default function LoansFilterTable({
  loans,
  onEdit,
}: LoansFilterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  const filteredLoans = useMemo(() => {
    let result = [...loans];

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((loan) => loan.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (loan) =>
          loan.lender.toLowerCase().includes(term) ||
          (loan.loanType && loan.loanType.toLowerCase().includes(term)),
      );
    }

    // Apply sorting
    if (sortOption === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );
    } else if (sortOption === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
    } else if (sortOption === "amount_high") {
      result.sort((a, b) => b.amount - a.amount);
    } else if (sortOption === "amount_low") {
      result.sort((a, b) => a.amount - b.amount);
    }

    return result;
  }, [loans, searchTerm, statusFilter, sortOption]);

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const paginatedLoans = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLoans.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLoans, currentPage, itemsPerPage]);

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

  const getStatusBadge = (status: string) => {
    const colorClass =
      status === "ACTIVE"
        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
        : status === "PAID_OFF"
          ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
          : status === "DEFAULTED"
            ? "bg-red-100 text-red-800 hover:bg-red-100"
            : "bg-gray-100 text-gray-800";

    return (
      <Badge className={colorClass} variant="outline">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <LoanFilters
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
              <CardTitle>Loan Management</CardTitle>
              <CardDescription>
                {filteredLoans.length} loan(s) found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLoans.length === 0 ? (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              No loans found
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lender</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance & Progress</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLoans.map((loan) => {
                      const totalPaid = (loan.payments || []).reduce(
                        (acc: number, curr: any) => acc + curr.amount,
                        0,
                      );

                      let finalTotalPayable =
                        loan.calculationMethod === "COMPOUND_INTEREST"
                          ? null
                          : loan.totalPayable;
                      if (
                        finalTotalPayable === null ||
                        finalTotalPayable === undefined
                      ) {
                        const { totalPayable } = calculateLoan(
                          loan.amount,
                          loan.interestRate,
                          loan.termMonths || 12,
                          loan.calculationMethod || "AMORTIZED",
                        );
                        finalTotalPayable = totalPayable;
                        if (loan.monthlyPayment && loan.termMonths) {
                          finalTotalPayable =
                            loan.monthlyPayment * loan.termMonths;
                        }
                      }
                      const balance = Math.max(
                        0,
                        finalTotalPayable - totalPaid,
                      );
                      const progress = Math.min(
                        100,
                        Math.max(
                          0,
                          (totalPaid / (finalTotalPayable || 1)) * 100,
                        ),
                      );

                      return (
                        <TableRow
                          key={loan.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() =>
                            router.push(`/dashboard/loans/${loan.id}`)
                          }
                        >
                          <TableCell className="font-medium">
                            {loan.lender}
                          </TableCell>
                          <TableCell>
                            {loan.calculationMethod === "COMPOUND_INTEREST"
                              ? "Monthly Compound"
                              : loan.calculationMethod === "FIXED_INTEREST"
                                ? "Long Term Fixed"
                                : loan.loanType || "N/A"}
                          </TableCell>
                          <TableCell className="font-semibold">
                            R
                            {(finalTotalPayable || loan.amount).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="w-[120px]">
                              <div className="flex justify-between text-[10px] mb-1">
                                <span
                                  className={
                                    balance <= 0
                                      ? "text-green-600 font-bold"
                                      : "font-medium"
                                  }
                                >
                                  R
                                  {balance.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                <span className="text-muted-foreground">
                                  {progress.toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${balance <= 0 ? "bg-green-500" : "bg-blue-600"}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{loan.interestRate}%</TableCell>
                          <TableCell>{getStatusBadge(loan.status)}</TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {format(new Date(loan.startDate), "MMM do, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                                  <Link
                                    href={`/dashboard/loans/${loan.id}`}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                    Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onEdit(loan)}
                                  className="flex items-center cursor-pointer"
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredLoans.length > 0 && (
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
