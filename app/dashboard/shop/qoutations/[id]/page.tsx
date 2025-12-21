"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CircleCheck, CircleX, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { quotationGenerator } from "@/lib/quotation-generator";

import { LoadingSkeleton } from "./components/LoadingSkeleton";
import QuotationHeader from "./components/SaleHeader";
import QuotationInfoCards from "./components/SaleInfoCards";
import QuotationItemsTable from "./components/SaleItemsTable";
import QuotationPreview from "./components/ReceiptPreview";
import PrintQuotationDialog from "./components/PrintReceiptDialog";
import EmailQuotationDialog from "./components/EmailReceiptDialog";

type QuoteStatus = "PENDING" | "CONVERTED" | "EXPIRED" | "CANCELLED";

interface QuotationItem {
  id: string;
  quoteId: string;
  shopProductId: string;
  quantity: number;
  price: string | number;
  total: string | number;
  shopProduct?: {
    name: string;
    sku: string;
  };
}

interface Quotation {
  id: string;
  quoteNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  status: QuoteStatus;
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax: number;
  deliveryFee: number;
  total: number;
  notes: string | null;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  isDelivery: boolean;
  deliveryAddress: string | null;
  deliveryInstructions: string | null;
  items: QuotationItem[];
  convertedTo: any | null;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  CONVERTED: {
    label: "Converted",
    color: "bg-green-100 text-green-800",
    icon: CircleCheck,
  },
  EXPIRED: {
    label: "Expired",
    color: "bg-orange-100 text-orange-800",
    icon: Clock,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: CircleX,
  },
};

export default function QuotationDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const { companyInfo } = useCompanyInfo();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [quotationEmail, setQuotationEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Set company info when available
  useEffect(() => {
    if (companyInfo) {
      quotationGenerator.setCompanyInfo(companyInfo);
    }
  }, [companyInfo]);

  const quotationId = params.id as string;

  useEffect(() => {
    if (quotationId) {
      fetchQuotation();
    }
  }, [quotationId]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shop/quotations/${quotationId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch quotation");
      }

      const data = await response.json();
      setQuotation(data);

      // Set customer email for quotation
      if (data.customerEmail) {
        setQuotationEmail(data.customerEmail);
      }
    } catch (error) {
      console.error("Error fetching quotation:", error);
      toast({
        title: "Error",
        description: "Failed to load quotation details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Transform quotation items to match quotation generator format
  const transformQuotationForPrint = (quotationData: Quotation) => {
    return {
      ...quotationData,
      items: quotationData.items.map((item) => ({
        ...item,
        price:
          typeof item.price === "string" ? parseFloat(item.price) : item.price,
        total:
          typeof item.total === "string" ? parseFloat(item.total) : item.total,
        product: item.shopProduct
          ? {
              name: item.shopProduct.name,
              sku: item.shopProduct.sku,
            }
          : undefined,
      })),
    };
  };

  const handlePrintQuotation = async (size: "thermal" | "A4" = "A4") => {
    if (!quotation) return;

    setIsPrinting(true);
    try {
      const transformedQuotation = transformQuotationForPrint(quotation);
      await quotationGenerator.printQuotation(transformedQuotation, size);
      toast({
        title: "Printing Quotation",
        description: `Quotation sent to printer (${size === "thermal" ? "80mm" : "A4"})`,
      });
      setIsPrintDialogOpen(false);
    } catch (error) {
      console.error("Error printing quotation:", error);
      toast({
        title: "Print Failed",
        description: "Could not print quotation",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleQuickPrint = async () => {
    await handlePrintQuotation("A4");
  };

  const handleDownloadQuotation = async () => {
    if (!quotation) return;

    try {
      const transformedQuotation = transformQuotationForPrint(quotation);
      const blob = await quotationGenerator.generateQuotationPDF(
        transformedQuotation,
        "A4"
      );
      await quotationGenerator.downloadQuotation(
        blob,
        `quotation-${quotation.quoteNumber}.html`
      );
      toast({
        title: "Quotation Downloaded",
        description: "Quotation has been downloaded",
      });
    } catch (error) {
      console.error("Error downloading quotation:", error);
      toast({
        title: "Download Failed",
        description: "Could not download quotation",
        variant: "destructive",
      });
    }
  };

  const handleEmailQuotation = async (
    email: string,
    size: "thermal" | "A4" = "A4"
  ) => {
    if (!quotation) return;

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      const transformedQuotation = transformQuotationForPrint(quotation);
      const quotationHTML =
        await quotationGenerator.generateQuotationForEmail(
          transformedQuotation
        );

      const response = await fetch("/api/shop/sales/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: `Quotation ${quotation.quoteNumber} - ${companyInfo?.companyName || "Your Company"}`,
          html: quotationHTML,
          saleNumber: quotation.quoteNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Quotation Sent",
          description: `Quotation sent to ${email}`,
        });
        setIsEmailDialogOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Failed to Send",
        description: "Could not send quotation email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleConvertToSale = async () => {
    if (!quotation) return;

    try {
      const response = await fetch(
        `/api/shop/quotations/${quotationId}/convert`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to convert quotation");
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Quotation Converted",
          description: "Quotation has been converted to a sale",
        });
        fetchQuotation(); // Refresh to show updated status
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error converting quotation:", error);
      toast({
        title: "Conversion Failed",
        description: "Could not convert quotation to sale",
        variant: "destructive",
      });
    }
  };

  // In your QuotationDetailPage component, update the handleCancelQuotation function:

  const handleCancelQuotation = async () => {
    if (!quotation) return;

    if (!confirm("Are you sure you want to cancel this quotation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/shop/quotations/${quotationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "cancel", // Use action instead of direct status
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel quotation");
      }

      toast({
        title: "Quotation Cancelled",
        description: result.message || "Quotation has been cancelled",
      });
      fetchQuotation(); // Refresh to show updated status
    } catch (error: any) {
      console.error("Error cancelling quotation:", error);
      toast({
        title: "Cancellation Failed",
        description: error.message || "Could not cancel quotation",
        variant: "destructive",
      });
    }
  };

  // Add undo cancel function
  const handleUndoCancelQuotation = async () => {
    if (!quotation) return;

    if (!confirm("Are you sure you want to restore this quotation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/shop/quotations/${quotationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "undo-cancel", // Use action to undo cancellation
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to restore quotation");
      }

      toast({
        title: "Quotation Restored",
        description: result.message || "Quotation has been restored to pending",
      });
      fetchQuotation(); // Refresh to show updated status
    } catch (error: any) {
      console.error("Error restoring quotation:", error);
      toast({
        title: "Restoration Failed",
        description: error.message || "Could not restore quotation",
        variant: "destructive",
      });
    }
  };

  // Add mark as expired function
  const handleMarkExpiredQuotation = async () => {
    if (!quotation) return;

    if (!confirm("Are you sure you want to mark this quotation as expired?")) {
      return;
    }

    try {
      const response = await fetch(`/api/shop/quotations/${quotationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark-expired",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to mark quotation as expired");
      }

      toast({
        title: "Quotation Expired",
        description: result.message || "Quotation has been marked as expired",
      });
      fetchQuotation();
    } catch (error: any) {
      console.error("Error expiring quotation:", error);
      toast({
        title: "Operation Failed",
        description: error.message || "Could not mark quotation as expired",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!quotation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">
            Quotation Not Found
          </h2>
          <p className="text-muted-foreground mt-2">
            The quotation you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/shop/quotations">Back to Quotations</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusConfigItem = statusConfig[quotation.status];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <QuotationHeader
        quotation={quotation}
        statusConfig={statusConfig}
        onPrintClick={() => setIsPrintDialogOpen(true)}
        onDownloadClick={handleDownloadQuotation}
        onEmailClick={() => setIsEmailDialogOpen(true)}
        onQuickPrint={handleQuickPrint}
        onConvertToSale={handleConvertToSale}
        onCancelQuotation={handleCancelQuotation}
        onUndoCancelQuotation={handleUndoCancelQuotation}
        onMarkExpiredQuotation={handleMarkExpiredQuotation}
      />

      <QuotationInfoCards quotation={quotation} />

      <QuotationItemsTable quotation={quotation} />

      {/*       <QuotationPreview quotation={quotation} companyInfo={companyInfo} />
       */}
      <PrintQuotationDialog
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        onPrint={handlePrintQuotation}
        isPrinting={isPrinting}
      />

      <EmailQuotationDialog
        isOpen={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        onSendEmail={handleEmailQuotation}
        isSending={isSendingEmail}
        defaultEmail={quotationEmail}
      />
    </div>
  );
}
