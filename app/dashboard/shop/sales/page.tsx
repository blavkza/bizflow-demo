"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { Sale } from "@/types/sales";
import { receiptGenerator } from "@/lib/receipt-generator";
import SalesHeader from "./components/SalesHeader";
import SalesStats from "./components/SalesStats";
import SalesFilters from "./components/SalesFilters";
import SalesTable from "./components/SalesTable";
import { RefundDialog } from "./components/refund-dialog";
import { PrintDialog } from "./components/print-dialog";
import { EmailDialog } from "./components/email-dialog";
import { SalesLoadingSkeleton } from "./components/SalesLoadingSkeleton";

export default function SalesPage() {
  const { toast } = useToast();
  const { companyInfo } = useCompanyInfo();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  // Dialog states
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Set company info for receipt generator
  useEffect(() => {
    if (companyInfo) {
      receiptGenerator.setCompanyInfo(companyInfo);
    }
  }, [companyInfo]);

  // Fetch sales data
  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/shop/sales");

      if (!response.ok) {
        throw new Error("Failed to fetch sales");
      }

      const data = await response.json();
      setSales(data.data || []);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = (sale: Sale) => {
    setSelectedSale(sale);
    setRefundDialogOpen(true);
  };

  const handlePrintReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setPrintDialogOpen(true);
  };

  const handleEmailReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setEmailDialogOpen(true);
  };

  const handleRefresh = () => {
    fetchSales();
  };

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName &&
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.customerEmail &&
        sale.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" || sale.status === statusFilter;

    const matchesPayment =
      paymentFilter === "All" || sale.paymentMethod === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (loading) {
    return <SalesLoadingSkeleton />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SalesHeader
        onRefresh={handleRefresh}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        paymentFilter={paymentFilter}
      />

      <SalesStats sales={sales} />

      <SalesFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
      />

      <SalesTable
        sales={filteredSales}
        loading={loading}
        onProcessRefund={handleProcessRefund}
        onPrintReceipt={handlePrintReceipt}
        onEmailReceipt={handleEmailReceipt}
        companyInfo={companyInfo}
      />

      {/* Dialogs */}
      <RefundDialog
        isOpen={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        sale={selectedSale}
      />

      <PrintDialog
        isOpen={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        sale={selectedSale}
        companyInfo={companyInfo}
      />

      <EmailDialog
        isOpen={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        sale={selectedSale}
        companyInfo={companyInfo}
      />
    </div>
  );
}
