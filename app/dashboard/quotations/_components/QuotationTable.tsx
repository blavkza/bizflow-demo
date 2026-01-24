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
import { Eye, Copy, Loader2, Edit } from "lucide-react";
import Link from "next/link";
import { QuotationWithRelations } from "@/types/quotation";
import { format } from "date-fns";
import { PaginationControls } from "../../../../components/PaginationControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";

interface QuotationTableProps {
  quotations: QuotationWithRelations[];
  itemsPerPage?: number;
  canCreateQuotations?: boolean;
}

export function QuotationTable({
  quotations,
  itemsPerPage: initialItemsPerPage = 10,
  canCreateQuotations = false,
}: QuotationTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const router = useRouter();

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

  const handleDuplicate = async (
    quotationId: string,
    quotationNumber: string
  ) => {
    if (!canCreateQuotations) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to duplicate quotations",
        variant: "destructive",
      });
      return;
    }

    try {
      setDuplicatingId(quotationId);

      const response = await axios.post(
        `/api/quotations/${quotationId}/duplicate`
      );
      const data = response.data;

      toast({
        title: "Success",
        description: `Quotation ${quotationNumber} duplicated successfully`,
      });

      // Redirect to the edit page of the new quotation
      router.push(data.redirectUrl);
    } catch (error) {
      console.error("Error duplicating quotation:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Failed to duplicate quotation";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  const canDuplicateQuotation = (quotation: QuotationWithRelations) => {
    return canCreateQuotations;
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
            currentItems.map((quotation) => {
              const isDuplicating = duplicatingId === quotation.id;
              const canDuplicate = canDuplicateQuotation(quotation);

              return (
                <TableRow
                  key={quotation.id}
                  className=" cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/quotations/${quotation.id}`)
                  }
                >
                  <TableCell className="font-medium">
                    <Link
                      className="underline text-blue-500 hover:text-blue-700 transition-colors"
                      href={`/dashboard/quotations/${quotation.id}`}
                    >
                      {quotation.quotationNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{quotation.client.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {quotation.title}
                    {quotation.convertedToInvoice && (
                      <span className="ml-2 text-xs text-gray-500">
                        (Converted)
                      </span>
                    )}
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
                    <Badge
                      variant="outline"
                      className={
                        quotation.status === "ACCEPTED"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : quotation.status === "REJECTED"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : quotation.status === "CONVERTED"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                      }
                    >
                      {quotation.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/quotations/${quotation.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/quotations/${quotation.id}/edit`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Quotation
                            </Link>
                          </DropdownMenuItem>

                          {canDuplicate && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDuplicate(
                                    quotation.id,
                                    quotation.quotationNumber
                                  )
                                }
                                disabled={isDuplicating}
                                className="text-blue-600"
                              >
                                {isDuplicating ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-2" />
                                )}
                                {isDuplicating ? "Duplicating..." : "Duplicate"}
                              </DropdownMenuItem>
                            </>
                          )}

                          {quotation.convertedToInvoice &&
                            quotation.invoiceId && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/invoices/${quotation.invoiceId}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Invoice
                                </Link>
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
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
