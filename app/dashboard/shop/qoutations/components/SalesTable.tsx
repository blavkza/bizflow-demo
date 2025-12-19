"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Mail,
  Printer,
} from "lucide-react";
import { CompanyInfo } from "@/lib/receipt-generator";
import { PaginationControls } from "@/components/PaginationControls";
import { useState, useMemo } from "react";
import QuotationActionsDropdown from "./SaleActionsDropdown";

// Quotation-specific status config
const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  CONVERTED: {
    label: "Converted",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  EXPIRED: {
    label: "Expired",
    color: "bg-orange-100 text-orange-800",
    icon: Clock,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

// Quotation type for table
type QuoteStatus = "PENDING" | "CONVERTED" | "EXPIRED" | "CANCELLED";

interface Quotation {
  id: string;
  quoteNumber: string;
  createdAt: string;
  expiryDate?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  status: QuoteStatus;
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax?: number;
  taxPercent?: number;
  deliveryFee: number;
  total: number;
  createdBy?: string;
  notes?: string;
  isDelivery?: boolean;
  deliveryAddress?: string;
  deliveryInstructions?: string;
  items?: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    product?: {
      name: string;
      sku: string;
    };
  }>;
}

interface QuotationTableProps {
  quotations?: Quotation[];
  loading: boolean;
  onPrintReceipt: (quotation: Quotation) => void;
  onEmailReceipt: (quotation: Quotation) => void;
  companyInfo: CompanyInfo | null;
}

export default function QuotationTable({
  quotations = [],
  loading,
  onPrintReceipt,
  onEmailReceipt,
  companyInfo,
}: QuotationTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Use safe quotations
  const safeQuotations = quotations || [];

  const getItemsCount = (quotation: Quotation) => {
    if (!quotation.items || !Array.isArray(quotation.items)) return 0;
    return quotation.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Calculate pagination with safe data
  const totalPages = Math.max(
    1,
    Math.ceil(safeQuotations.length / itemsPerPage)
  );

  const paginatedQuotations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return safeQuotations.slice(startIndex, endIndex);
  }, [safeQuotations, currentPage, itemsPerPage]);

  // Reset to first page when filters change or items per page changes
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Format expiry date
  const formatExpiryDate = (dateString?: string) => {
    if (!dateString) return "No expiry";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return "No expiry";
    }
  };

  // Format creation date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  // Check if quotation is expired
  const isExpired = (quotation: Quotation) => {
    if (!quotation.expiryDate) return false;

    const expiryDate = new Date(quotation.expiryDate);
    const today = new Date();
    return (
      expiryDate < today &&
      quotation.status !== "CONVERTED" &&
      quotation.status !== "CANCELLED"
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Quotations ({safeQuotations.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {safeQuotations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No quotations found</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedQuotations.map((quotation) => {
                  // Check if expired and update status
                  const isQuotationExpired = isExpired(quotation);
                  const effectiveStatus = isQuotationExpired
                    ? "EXPIRED"
                    : quotation.status;

                  const statusConfigItem =
                    statusConfig[
                      effectiveStatus as keyof typeof statusConfig
                    ] || statusConfig.PENDING;
                  const StatusIcon = statusConfigItem.icon;

                  return (
                    <TableRow
                      key={quotation.id}
                      className={isQuotationExpired ? "bg-gray-50" : ""}
                    >
                      <TableCell className="font-medium">
                        {quotation.quoteNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {quotation.customerName || "No Customer"}
                          </p>
                          {quotation.customerEmail && (
                            <p className="text-sm text-muted-foreground">
                              {quotation.customerEmail}
                            </p>
                          )}
                          {quotation.customerPhone && (
                            <p className="text-sm text-muted-foreground">
                              {quotation.customerPhone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getItemsCount(quotation)}</TableCell>

                      {/* Expiry Date column */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatExpiryDate(quotation.expiryDate)}</span>
                          {isQuotationExpired && (
                            <span className="text-xs text-red-500 font-medium">
                              Expired
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-semibold">
                        R{quotation.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfigItem.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfigItem.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(quotation.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Quick action buttons */}
                          <button
                            onClick={() => onPrintReceipt(quotation)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                            title="Print Quotation"
                          >
                            <Printer className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => onEmailReceipt(quotation)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                            title="Email Quotation"
                          >
                            <Mail className="h-4 w-4 text-gray-600" />
                          </button>

                          {/* Full actions dropdown */}
                          <QuotationActionsDropdown
                            quotation={quotation}
                            onPrintReceipt={onPrintReceipt}
                            onEmailReceipt={onEmailReceipt}
                            companyInfo={companyInfo}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Only show pagination if there are multiple pages */}
            {totalPages > 1 && (
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
  );
}
