"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCompanyInfo } from "@/hooks/use-company-info";
import QuotationHeader from "./components/SalesHeader";
import QuotationStats from "./components/SalesStats";
import QuotationFilters from "./components/SalesFilters";
import QuotationTable from "./components/SalesTable";
import { PrintDialog } from "./components/print-dialog";
import { EmailDialog } from "./components/email-dialog";
import { SalesLoadingSkeleton } from "./components/SalesLoadingSkeleton";

// Define Quotation type with correct status
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
    shopProduct?: {
      name: string;
      sku: string;
    };
  }>;
}

export default function QuotationPage() {
  const { toast } = useToast();
  const { companyInfo } = useCompanyInfo();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Dialog states
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null
  );

  // Fetch quotations data
  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/shop/quotations");

      if (!response.ok) {
        throw new Error("Failed to fetch quotations");
      }

      const data = await response.json();
      console.log("Fetched quotations data:", data);

      // Transform items to match expected structure
      const transformedQuotations = data.map((quote: any) => ({
        ...quote,
        // Ensure status is one of the valid QuoteStatus values
        status:
          quote.status === "PENDING" ||
          quote.status === "CONVERTED" ||
          quote.status === "EXPIRED" ||
          quote.status === "CANCELLED"
            ? quote.status
            : "PENDING",
        items:
          quote.items?.map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            price: parseFloat(item.price) || 0,
            total: parseFloat(item.total) || 0,
            product: item.shopProduct
              ? {
                  name: item.shopProduct.name || "Product",
                  sku: item.shopProduct.sku || "N/A",
                }
              : undefined,
          })) || [],
      }));

      setQuotations(transformedQuotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast({
        title: "Error",
        description: "Failed to load quotations data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setPrintDialogOpen(true);
  };

  const handleEmailReceipt = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setEmailDialogOpen(true);
  };

  const handleRefresh = () => {
    fetchQuotations();
  };

  // Filter quotations based on search and status
  const filteredQuotations = quotations.filter((quote) => {
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.customerName &&
        quote.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (quote.customerEmail &&
        quote.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (quote.customerPhone && quote.customerPhone.includes(searchTerm));

    const matchesStatus =
      statusFilter === "All" || quote.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <SalesLoadingSkeleton />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <QuotationHeader
        onRefresh={handleRefresh}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
      />

      <QuotationStats quotations={quotations} loading={loading} />

      <QuotationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <QuotationTable
        quotations={filteredQuotations}
        loading={loading}
        onPrintReceipt={handlePrintReceipt}
        onEmailReceipt={handleEmailReceipt}
        companyInfo={companyInfo}
      />

      {/* Dialogs */}
      <PrintDialog
        isOpen={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        quotation={selectedQuotation}
        companyInfo={companyInfo}
      />

      <EmailDialog
        isOpen={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        quotation={selectedQuotation}
        companyInfo={companyInfo}
      />
    </div>
  );
}
