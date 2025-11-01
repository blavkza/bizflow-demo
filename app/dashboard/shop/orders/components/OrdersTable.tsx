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
import { Loader2, Clock } from "lucide-react";
import OrderActionsDropdown from "./OrderActionsDropdown";
import { useState, useMemo } from "react";
import { PaginationControls } from "@/components/PaginationControls";

const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
    icon: Clock,
  },
  PROCESSING: {
    label: "Processing",
    color: "bg-purple-100 text-purple-800",
    icon: Clock,
  },
  SHIPPED: {
    label: "Shipped",
    color: "bg-indigo-100 text-indigo-800",
    icon: Clock,
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: Clock,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: Clock,
  },
  RETURNED: {
    label: "Returned",
    color: "bg-orange-100 text-orange-800",
    icon: Clock,
  },
};

const paymentStatusConfig = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "Paid", color: "bg-green-100 text-green-800" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Refunded", color: "bg-orange-100 text-orange-800" },
  COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-800" },
};

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: number;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onPrintReceipt: (orderId: string) => void;
  onSendReceipt: (orderId: string, customerEmail: string) => void;
  searchTerm: string;
  statusFilter: string;
  paymentFilter: string;
}

export default function OrdersTable({
  orders,
  loading,
  onPrintReceipt,
  onSendReceipt,
  searchTerm,
  statusFilter,
  paymentFilter,
}: OrdersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerPhone &&
          order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      const matchesPayment =
        paymentFilter === "All" || order.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Reset to first page when filters change or items per page changes
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
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
        <CardTitle>
          All Orders ({filteredOrders.length})
          {filteredOrders.length > itemsPerPage && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (Showing {paginatedOrders.length} of {filteredOrders.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {orders.length === 0
              ? "No orders found"
              : "No orders match your filters"}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => {
                  const StatusIcon =
                    statusConfig[order.status as keyof typeof statusConfig]
                      ?.icon || Clock;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customerEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{order.items}</TableCell>
                      <TableCell className="font-semibold">
                        R{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusConfig[
                              order.status as keyof typeof statusConfig
                            ]?.color || "bg-gray-100 text-gray-800"
                          }
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[
                            order.status as keyof typeof statusConfig
                          ]?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            paymentStatusConfig[
                              order.paymentStatus as keyof typeof paymentStatusConfig
                            ]?.color || "bg-gray-100 text-gray-800"
                          }
                        >
                          {paymentStatusConfig[
                            order.paymentStatus as keyof typeof paymentStatusConfig
                          ]?.label || order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <OrderActionsDropdown
                          order={order}
                          onPrintReceipt={onPrintReceipt}
                          onSendReceipt={onSendReceipt}
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
