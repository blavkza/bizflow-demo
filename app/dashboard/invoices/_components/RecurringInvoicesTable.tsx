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
import { Eye, Play, Pause, Square, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/invoiceUtils";
import { RecurringInvoiceFilters } from "./RecurringInvoiceFilters";
import Link from "next/link";
import { PaginationControls } from "@/components/PaginationControls";
import { RecurringInvoice } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface RecurringInvoicesTableProps {
  recurringInvoices: RecurringInvoice[];
  loading: boolean;
}

export default function RecurringInvoicesTable({
  recurringInvoices,
  loading,
}: RecurringInvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-blue-500 text-white";
      case "PAUSED":
        return "bg-orange-500 text-white";
      case "COMPLETED":
        return "bg-green-500 text-white";
      case "CANCELLED":
        return "bg-red-500 text-white";
      default:
        return "bg-red-500 text-white";
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "DAILY":
        return "bg-blue-100 text-blue-800";
      case "WEEKLY":
        return "bg-green-100 text-green-800";
      case "MONTHLY":
        return "bg-purple-100 text-purple-800";
      case "QUARTERLY":
        return "bg-orange-100 text-orange-800";
      case "YEARLY":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateNextAmount = (invoice: RecurringInvoice) => {
    const items = invoice.items as any[];
    return (
      items?.reduce((sum: number, item: any) => {
        return sum + item.quantity * item.unitPrice;
      }, 0) || 0
    );
  };

  const filteredInvoices = useMemo(() => {
    let result = [...recurringInvoices];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (invoice) =>
          invoice.description?.toLowerCase().includes(term) ||
          invoice.clientId.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((invoice) => invoice.status === statusFilter);
    }

    if (frequencyFilter !== "all") {
      result = result.filter(
        (invoice) => invoice.frequency === frequencyFilter
      );
    }

    return result;
  }, [recurringInvoices, searchTerm, statusFilter, frequencyFilter]);

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

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/recurring/${invoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh the page or update local state
      window.location.reload();
    } catch (error) {
      console.error("Failed to update recurring invoice status:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div>Loading recurring invoices...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <RecurringInvoiceFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        frequencyFilter={frequencyFilter}
        onSearchChange={(value) => {
          setSearchTerm(value);
          resetPagination();
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          resetPagination();
        }}
        onFrequencyFilterChange={(value) => {
          setFrequencyFilter(value);
          resetPagination();
        }}
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recurring Invoices</CardTitle>
              <CardDescription>
                {filteredInvoices.length} recurring invoice(s) found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="flex items-center justify-center p-6">
              No recurring invoices found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      onClick={() =>
                        router.push(
                          `/dashboard/invoices/recurring/${invoice.id}`
                        )
                      }
                    >
                      <TableCell className="font-medium">
                        {invoice.description || "Recurring Invoice"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getFrequencyColor(invoice.frequency)}>
                          {invoice.frequency.toLowerCase()}
                        </Badge>
                        {invoice.interval > 1 && ` every ${invoice.interval}`}
                      </TableCell>
                      <TableCell>{formatDate(invoice.nextDate)}</TableCell>
                      <TableCell>
                        {formatCurrency(calculateNextAmount(invoice))}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.totalInvoicesGenerated || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Link
                              className="flex items-center gap-2"
                              href={`/dashboard/invoices/recurring/${invoice.id}`}
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {invoice.status === "ACTIVE" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(invoice.id, "PAUSED")
                                  }
                                >
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause
                                </DropdownMenuItem>
                              )}
                              {invoice.status === "PAUSED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(invoice.id, "ACTIVE")
                                  }
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Resume
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(invoice.id, "CANCELLED")
                                }
                                className="text-red-600"
                              >
                                <Square className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
