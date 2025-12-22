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
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Sale } from "@/types/sales";
import SaleActionsDropdown from "./SaleActionsDropdown";
import { CompanyInfo } from "@/lib/receipt-generator";
import { PaginationControls } from "@/components/PaginationControls";
import { useState, useMemo } from "react";

const statusConfig = {
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  REFUNDED: {
    label: "Refunded",
    color: "bg-red-100 text-red-800",
    icon: RefreshCw,
  },
  PARTIALLY_REFUNDED: {
    label: "Partial Refund",
    color: "bg-orange-100 text-orange-800",
    icon: RefreshCw,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
  },
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: RefreshCw,
  },
};

interface SalesTableProps {
  sales: Sale[];
  loading: boolean;
  onProcessRefund: (sale: Sale) => void;
  onPrintReceipt: (sale: Sale) => void;
  onEmailReceipt: (sale: Sale) => void;
  companyInfo: CompanyInfo | null;
}

export default function SalesTable({
  sales,
  loading,
  onProcessRefund,
  onPrintReceipt,
  onEmailReceipt,
  companyInfo,
}: SalesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formatPaymentMethod = (method: string) => {
    const methodMap: { [key: string]: string } = {
      CASH: "Cash",
      CREDIT_CARD: "Credit Card",
      DEBIT_CARD: "Debit Card",
      CARD: "Card Paymnet",
      STORE_CREDIT: "Store Credit",
      EFT: "EFT",
      MOBILE_PAYMENT: "Mobile Payment",
      BANK_TRANSFER: "Bank Transfer",
      CHEQUE: "Cheque",
    };
    return methodMap[method] || method;
  };

  const getItemsCount = (sale: Sale) => {
    return sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  // Calculate pagination
  const totalPages = Math.ceil(sales.length / itemsPerPage);

  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sales.slice(startIndex, endIndex);
  }, [sales, currentPage, itemsPerPage]);

  // Reset to first page when filters change or items per page changes
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
        <CardTitle>All Sales ({sales.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No sales found</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.map((sale) => {
                  const statusConfigItem =
                    statusConfig[sale.status as keyof typeof statusConfig] ||
                    statusConfig.PENDING;
                  const StatusIcon = statusConfigItem.icon;

                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.saleNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {sale.customerName || "Walk-in Customer"}
                          </p>
                          {sale.customerEmail && (
                            <p className="text-sm text-muted-foreground">
                              {sale.customerEmail}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getItemsCount(sale)}</TableCell>
                      <TableCell>
                        {formatPaymentMethod(sale.paymentMethod)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R{sale.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfigItem.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfigItem.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(sale.saleDate).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <SaleActionsDropdown
                          sale={sale}
                          onProcessRefund={onProcessRefund}
                          onPrintReceipt={onPrintReceipt}
                          onEmailReceipt={onEmailReceipt}
                          companyInfo={companyInfo}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <PaginationControls
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onItemsPerPageChange={handleItemsPerPageChange}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
