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
import {
  Eye,
  Copy,
  Loader2,
  MoreVertical,
  Send,
  Download,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { InvoiceDocumentWithRelations } from "@/types/invoice-document";
import { format } from "date-fns";
import { PaginationControls } from "@/components/PaginationControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";
import { InvoiceDocumentReportGenerator } from "@/lib/invoice-document-report-generator";
import { useCompanyInfo } from "@/hooks/use-company-info";

interface InvoiceDocumentTableProps {
  documents: InvoiceDocumentWithRelations[];
  itemsPerPage?: number;
  canCreateDocuments?: boolean;
}

export function InvoiceDocumentTable({
  documents,
  itemsPerPage: initialItemsPerPage = 10,
  canCreateDocuments = false,
}: InvoiceDocumentTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const router = useRouter();
  const { companyInfo } = useCompanyInfo();

  // Calculate total pages
  const totalPages = Math.ceil(documents.length / itemsPerPage);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = documents.slice(indexOfFirstItem, indexOfLastItem);

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      DELIVERY_NOTE: "Delivery Note",
      PURCHASE_ORDER: "Purchase Order",
      PRO_FORMA_INVOICE: "Pro Forma",
      CREDIT_NOTE: "Credit Note",
      SUPPLIER_LIST: "Lists To Supplier",
      INVOICE: "Invoice",
    };
    return typeMap[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
      SENT: "bg-blue-100 text-blue-800 border-blue-200",
      DELIVERED: "bg-green-100 text-green-800 border-green-200",
      PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
      PARTIALLY_PAID: "bg-yellow-100 text-yellow-800 border-yellow-200",
      OVERDUE: "bg-red-100 text-red-800 border-red-200",
      CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const handleDuplicate = async (
    documentId: string,
    documentNumber: string
  ) => {
    if (!canCreateDocuments) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to duplicate documents",
        variant: "destructive",
      });
      return;
    }

    try {
      setDuplicatingId(documentId);
      const response = await axios.post(
        `/api/invoice-documents/${documentId}/duplicate`
      );
      const data = response.data;

      toast({
        title: "Success",
        description: `Document ${documentNumber} duplicated successfully`,
      });

      router.push(data.redirectUrl);
    } catch (error) {
      console.error("Error duplicating document:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Failed to duplicate document";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleSendDocument = async (documentId: string) => {
    try {
      // Implement send document functionality
      toast({
        title: "Sending document...",
        description: "This feature is under development",
      });
    } catch (error) {
      console.error("Error sending document:", error);
      toast({
        title: "Error",
        description: "Failed to send document",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (
    documentId: string,
    formatType: "pdf" | "excel" = "pdf"
  ) => {
    try {
      const response = await fetch(
        `/api/invoice-documents/${documentId}/export?format=${formatType}`
      );
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document-${documentId}.${formatType}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Document downloaded as ${formatType.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handlePrintDocument = async (
    document: InvoiceDocumentWithRelations
  ) => {
    setPrintingId(document.id);
    try {
      const documentHTML =
        InvoiceDocumentReportGenerator.generateInvoiceDocumentHTML(
          document,
          null
        );

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(documentHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }
    } catch (error) {
      console.error("Error printing document:", error);
      toast({
        title: "Error",
        description: "Failed to generate document report",
        variant: "destructive",
      });
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document #</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Client/Supplier</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.length > 0 ? (
            currentItems.map((document) => {
              const isDuplicating = duplicatingId === document.id;
              const isPrinting = printingId === document.id;

              return (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        className="underline text-blue-500 hover:text-blue-700 transition-colors"
                        href={`/dashboard/invoice-documents/${document.id}`}
                      >
                        {document.invoiceDocumentNumber}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getDocumentTypeLabel(document.invoiceDocumentType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {document.client?.name || document.supplier?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(document.issueDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {document.dueDate ? (
                      format(new Date(document.dueDate), "MMM dd, yyyy")
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    R{" "}
                    {Number(document.totalAmount).toLocaleString("en-ZA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusColor(document.status)}
                    >
                      {document.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrintDocument(document)}
                        disabled={isPrinting}
                        title="Print Document"
                      >
                        {isPrinting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Printer className="h-4 w-4" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/invoice-documents/${document.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>

                          {/*    <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/invoice-documents/${document.id}/edit`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Edit Document
                            </Link>
                          </DropdownMenuItem> */}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handlePrintDocument(document)}
                            disabled={isPrinting}
                          >
                            {isPrinting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Printer className="h-4 w-4 mr-2" />
                            )}
                            {isPrinting ? "Printing..." : "Print"}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleSendDocument(document.id)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleDownload(document.id, "pdf")}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/*  {canCreateDocuments && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleDuplicate(
                                  document.id,
                                  document.invoiceDocumentNumber
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
                          )} */}

                          {document.invoiceId && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/invoices/${document.invoiceId}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Original Invoice
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
                No documents found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {documents.length > 0 && (
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
