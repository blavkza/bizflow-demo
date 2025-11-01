"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import OrdersHeader from "./components/OrdersHeader";
import OrdersStats from "./components/OrdersStats";
import OrdersFilters from "./components/OrdersFilters";
import OrdersTable from "./components/OrdersTable";
import OrdersLoading from "./loading";

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

export default function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/shop/orders");
      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async (orderId: string) => {
    try {
      const response = await fetch(`/api/shop/orders/${orderId}/receipt`);
      if (!response.ok) throw new Error("Failed to generate receipt");

      const receiptHTML = await response.text();

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast({
        title: "Error",
        description: "Failed to generate receipt for printing",
        variant: "destructive",
      });
    }
  };

  const handleSendReceipt = async (orderId: string, customerEmail: string) => {
    try {
      const response = await fetch(`/api/shop/orders/${orderId}/receipt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: customerEmail }),
      });

      if (!response.ok) throw new Error("Failed to send receipt");

      toast({
        title: "Success",
        description: "Receipt has been sent successfully",
      });
    } catch (error) {
      console.error("Error sending receipt:", error);
      toast({
        title: "Error",
        description: "Failed to send receipt",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <OrdersLoading />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <OrdersHeader
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        paymentFilter={paymentFilter}
      />

      <OrdersStats orders={orders} />

      <OrdersFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
      />

      <OrdersTable
        orders={orders}
        loading={loading}
        onPrintReceipt={handlePrintReceipt}
        onSendReceipt={handleSendReceipt}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        paymentFilter={paymentFilter}
      />
    </div>
  );
}
