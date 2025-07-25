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
import {
  Send,
  Eye,
  Download,
  EllipsisVertical,
  ArrowDownToLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Invoice, InvoicesFilterTableProps } from "@/types/invoice";
import { getStatusColor, formatCurrency, formatDate } from "@/lib/invoiceUtils";
import { InvoiceFilters } from "../_components/InvoiceFilters";
import { PaginationControls } from "@/components/PaginationControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function InvoicesFilterTable({
  invoices = [],
}: InvoicesFilterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(term) ||
          invoice.client.toLowerCase().includes(term) ||
          invoice.description.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((invoice) => invoice.status === statusFilter);
    }

    switch (sortOption) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
        );
        break;
      case "amount-high":
        result.sort((a, b) => b.amount - a.amount);
        break;
      case "amount-low":
        result.sort((a, b) => a.amount - b.amount);
        break;
      default:
        break;
    }

    return result;
  }, [invoices, searchTerm, statusFilter, sortOption]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const resetPagination = () => {
    setCurrentPage(1);
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
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="flex items-center justify-center p-6">
              No invoices found
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link
                          className=" underline text-blue-500"
                          href={`/dashboard/invoices/${invoice.id}`}
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.client}</TableCell>

                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline">
                          <Link
                            className="flex items-center gap-2 "
                            href={`/dashboard/invoices/${invoice.id}`}
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevious={handlePreviousPage}
                  onNext={handleNextPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
