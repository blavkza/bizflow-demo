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
import { Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStatusColor, formatCurrency, formatDate } from "@/lib/invoiceUtils";
import { InvoiceFilters } from "../_components/InvoiceFilters";

import Link from "next/link";
import { PaginationControls } from "@/components/PaginationControls";
import { useRouter } from "next/navigation";
import { FullInvoice } from "@/types/invoice";

interface InvoicesFilterTableProps {
  invoices: FullInvoice[];
}

export default function InvoicesFilterTable({
  invoices,
}: InvoicesFilterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  // Check if invoice is overdue (includes both NOT_PAID and PARTIALLY_PAID)
  const isInvoiceOverdue = (invoice: FullInvoice) => {
    // Only check unpaid and partially paid invoices
    if (invoice.status === "PAID" || invoice.status === "CANCELLED")
      return false;
    if (!invoice.dueDate) return false;

    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return dueDate < today;
  };

  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Apply status filter
    if (statusFilter === "overdue") {
      result = result.filter(isInvoiceOverdue);
    } else if (statusFilter !== "all") {
      result = result.filter((invoice) => invoice.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(term) ||
          invoice.client.name.toLowerCase().includes(term) ||
          invoice.client?.clientNumber?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortOption === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      );
    } else if (sortOption === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
      );
    } else if (sortOption === "amount_high") {
      result.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (sortOption === "amount_low") {
      result.sort((a, b) => a.totalAmount - b.totalAmount);
    }

    return result;
  }, [invoices, searchTerm, statusFilter, sortOption]);

  // Count overdue invoices for display
  const overdueCount = invoices.filter(isInvoiceOverdue).length;

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

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

  // Get days overdue for display
  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get overdue badge text based on status
  const getOverdueBadgeText = (invoice: FullInvoice) => {
    if (invoice.status === "PARTIALLY_PAID") {
      return "PARTIALLY PAID - OVERDUE";
    }
    return "OVERDUE";
  };

  // Get badge variant based on status and overdue
  const getBadgeVariant = (invoice: FullInvoice, isOverdue: boolean) => {
    if (isOverdue) {
      return "destructive";
    }
    return getStatusColor(invoice.status);
  };

  // Get badge class based on status and overdue
  const getBadgeClass = (invoice: FullInvoice, isOverdue: boolean) => {
    if (isOverdue) {
      if (invoice.status === "PARTIALLY_PAID") {
        return "bg-orange-600"; // Orange for partially paid overdue
      }
      return "bg-red-600"; // Red for fully unpaid overdue
    }
    return "";
  };

  return (
    <div>
      <InvoiceFilters
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
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>
                {filteredInvoices.length} invoice(s) found
                {statusFilter === "overdue" && (
                  <span className="ml-2 text-red-600">
                    • {overdueCount} overdue invoice(s) in total
                  </span>
                )}
              </CardDescription>
            </div>
            {overdueCount > 0 && statusFilter !== "overdue" && (
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => {
                  setStatusFilter("overdue");
                  resetPagination();
                }}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                View Overdue ({overdueCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="flex items-center justify-center p-6">
              {statusFilter === "overdue"
                ? "No overdue invoices found"
                : "No invoices found"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    {statusFilter === "overdue" && (
                      <TableHead>Days Overdue</TableHead>
                    )}
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice) => {
                    const overdue = isInvoiceOverdue(invoice);
                    const isPartiallyPaidOverdue =
                      overdue && invoice.status === "PARTIALLY_PAID";

                    return (
                      <TableRow
                        key={invoice.id}
                        className={
                          overdue
                            ? isPartiallyPaidOverdue
                              ? "bg-orange-50 hover:bg-orange-100"
                              : "bg-red-50 hover:bg-red-100"
                            : ""
                        }
                      >
                        <TableCell className="font-medium">
                          <Link
                            className="underline text-blue-500"
                            href={`/dashboard/invoices/${invoice.id}`}
                          >
                            {invoice.invoiceNumber}
                            {overdue && (
                              <AlertTriangle
                                className="w-3 h-3 inline ml-1"
                                style={{
                                  color: isPartiallyPaidOverdue
                                    ? "#ea580c"
                                    : "#dc2626",
                                }}
                              />
                            )}
                          </Link>
                        </TableCell>
                        <TableCell
                          onClick={() =>
                            router.push(
                              `/dashboard/human-resources/clients/${invoice.client.id}`
                            )
                          }
                          className="cursor-pointer hover:underline"
                        >
                          {invoice.client.name}
                        </TableCell>
                        <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                        <TableCell
                          className={
                            overdue
                              ? isPartiallyPaidOverdue
                                ? "text-orange-600 font-semibold"
                                : "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {formatDate(invoice.dueDate)}
                        </TableCell>
                        {statusFilter === "overdue" && invoice.dueDate && (
                          <TableCell
                            className={
                              isPartiallyPaidOverdue
                                ? "text-orange-600 font-semibold"
                                : "text-red-600 font-semibold"
                            }
                          >
                            {getDaysOverdue(invoice.dueDate)} days
                          </TableCell>
                        )}
                        <TableCell>
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getBadgeVariant(invoice, overdue)}
                            className={getBadgeClass(invoice, overdue)}
                          >
                            {overdue
                              ? getOverdueBadgeText(invoice)
                              : invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline">
                            <Link
                              className="flex items-center gap-2"
                              href={`/dashboard/invoices/${invoice.id}`}
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredInvoices.length > 0 && (
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
