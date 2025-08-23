"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import Link from "next/link";
import { QuotationWithRelations } from "@/types/quotation";
import { format } from "date-fns";
import { PaginationControls } from "../../../../components/PaginationControls";

interface QuotationTableProps {
  quotations: QuotationWithRelations[];
  itemsPerPage?: number;
}

export function QuotationTable({
  quotations,
  itemsPerPage: initialItemsPerPage = 10,
}: QuotationTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Calculate total pages
  const totalPages = Math.ceil(quotations.length / itemsPerPage);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = quotations.slice(indexOfFirstItem, indexOfLastItem);

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quotation #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Valid Until</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.length > 0 ? (
            currentItems.map((quotation) => (
              <TableRow key={quotation.id}>
                <TableCell className="font-medium">
                  <Link
                    className="underline text-blue-500"
                    href={`/dashboard/quotations/${quotation.id}`}
                  >
                    {quotation.quotationNumber}
                  </Link>
                </TableCell>
                <TableCell>{quotation.client.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {quotation.title}
                </TableCell>
                <TableCell>
                  {format(new Date(quotation.issueDate), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  {format(new Date(quotation.validUntil), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  R
                  {Number(quotation.totalAmount).toLocaleString("en-ZA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{quotation.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/quotations/${quotation.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No quotations found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {quotations.length > 0 && (
        <PaginationControls
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onItemsPerPageChange={handleItemsPerPageChange}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
