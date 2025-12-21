"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CircleCheck,
  CircleX,
  HandCoins,
  Loader2,
  Package,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { receiptGenerator } from "@/lib/receipt-generator";
import SaleHeader from "./components/SaleHeader";
import SaleInfoCards from "./components/SaleInfoCards";
import SaleItemsTable from "./components/SaleItemsTable";
import ReceiptPreview from "./components/ReceiptPreview";
import PrintReceiptDialog from "./components/PrintReceiptDialog";
import EmailReceiptDialog from "./components/EmailReceiptDialog";
import { LoadingSkeleton } from "./components/LoadingSkeleton";

interface SaleItem {
  id: string;
  shopProductId: string;
  quantity: number;
  price: number;
  total: number;
  hadNegativeStock?: boolean;
  awaitedQuantity?: number;
  ShopProduct?: {
    name: string;
    sku: string;
    stock?: number;
    status?: string;
  };
  stockInfo?: {
    hadNegativeStock: boolean;
    awaitedQuantity: number;
    stockStatus: string;
    currentStock: number;
    needsStock: boolean;
  };
}

interface Sale {
  id: string;
  saleNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  discount: number;
  discountPercent: number;
  total: number;
  amountReceived: number | null;
  change: number | null;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
  items: SaleItem[];
  refundedAmount?: number;
  awaitingStockCount?: number;
  awaitingStockProducts?: number;
  StockAwait?: Array<{
    id: string;
    quantity: number;
    status: string;
    shopProductId: string;
    shopProduct?: {
      name: string;
    };
  }>;
}

const statusConfig = {
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    icon: CircleCheck,
  },
  AWAITING_STOCK: {
    label: "Awaiting Stock",
    color: "bg-yellow-100 text-yellow-800",
    icon: Package,
  },
  REFUNDED: {
    label: "Refunded",
    color: "bg-red-100 text-red-800",
    icon: HandCoins,
  },
  PARTIALLY_REFUNDED: {
    label: "Partial Refund",
    color: "bg-orange-100 text-orange-800",
    icon: HandCoins,
  },
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Loader2,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: CircleX,
  },
};

export default function SaleDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const { companyInfo } = useCompanyInfo();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [receiptEmail, setReceiptEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Set company info when available
  useEffect(() => {
    if (companyInfo) {
      receiptGenerator.setCompanyInfo(companyInfo);
    }
  }, [companyInfo]);

  const saleId = params.id as string;

  useEffect(() => {
    if (saleId) {
      fetchSale();
    }
  }, [saleId]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      console.log("Fetching sale:", saleId);

      const response = await fetch(`/api/shop/sales/${saleId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch sale");
      }

      const data = await response.json();
      console.log("Sale data received:", data);

      if (data.success && data.data) {
        console.log("Sale items:", data.data.items);
        if (data.data.items && data.data.items.length > 0) {
          console.log("First item:", data.data.items[0]);
          console.log(
            "First item ShopProduct:",
            data.data.items[0].ShopProduct
          );
        }
        setSale(data.data);

        if (data.data.customerEmail) {
          setReceiptEmail(data.data.customerEmail);
        }
      } else {
        throw new Error(data.error || "No sale data returned");
      }
    } catch (error) {
      console.error("Error fetching sale:", error);
      toast({
        title: "Error",
        description: "Failed to load sale details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const transformSaleForReceipt = (saleData: Sale) => {
    return {
      ...saleData,
      items: saleData.items.map((item) => ({
        ...item,
        product: item.ShopProduct
          ? {
              name: item.ShopProduct.name,
              sku: item.ShopProduct.sku,
            }
          : undefined,
      })),
    };
  };

  const handlePrintReceipt = async (size: "thermal" | "A4" = "thermal") => {
    if (!sale) return;

    setIsPrinting(true);
    try {
      const transformedSale = transformSaleForReceipt(sale);
      await receiptGenerator.printReceipt(transformedSale, size);
      toast({
        title: "Printing Receipt",
        description: `Receipt sent to printer (${size === "thermal" ? "80mm" : "A4"})`,
      });
      setIsPrintDialogOpen(false);
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast({
        title: "Print Failed",
        description: "Could not print receipt",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleQuickPrint = async () => {
    await handlePrintReceipt("thermal");
  };

  const handleDownloadReceipt = async () => {
    if (!sale) return;

    try {
      const transformedSale = transformSaleForReceipt(sale);
      const blob = await receiptGenerator.generateReceiptPDF(
        transformedSale,
        "A4"
      );
      await receiptGenerator.downloadReceipt(
        blob,
        `receipt-${sale.saleNumber}.html`
      );
      toast({
        title: "Receipt Downloaded",
        description: "Receipt has been downloaded",
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Download Failed",
        description: "Could not download receipt",
        variant: "destructive",
      });
    }
  };

  const handleEmailReceipt = async (
    email: string,
    size: "thermal" | "A4" = "A4"
  ) => {
    if (!sale) return;

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
      const transformedSale = transformSaleForReceipt(sale);
      const receiptHTML =
        await receiptGenerator.generateReceiptForEmail(transformedSale);

      const response = await fetch("/api/shop/sales/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: `Receipt ${sale.saleNumber} - Thank you for your purchase`,
          html: receiptHTML,
          saleNumber: sale.saleNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Receipt Sent",
          description: `Receipt sent to ${email}`,
        });
        setIsEmailDialogOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Failed to Send",
        description: "Could not send receipt email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!sale) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">
            Sale Not Found
          </h2>
          <p className="text-muted-foreground mt-2">
            The sale you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/shop/sales">Back to Sales</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusConfigItem =
    statusConfig[sale.status as keyof typeof statusConfig] ||
    statusConfig.PENDING;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <SaleHeader
        sale={sale}
        statusConfig={statusConfig}
        onPrintClick={() => setIsPrintDialogOpen(true)}
        onDownloadClick={handleDownloadReceipt}
        onEmailClick={() => setIsEmailDialogOpen(true)}
        onQuickPrint={handleQuickPrint}
      />

      <SaleInfoCards sale={sale} />

      <SaleItemsTable sale={sale} />

      {/*  <ReceiptPreview sale={sale} companyInfo={companyInfo} /> */}

      <PrintReceiptDialog
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        onPrint={handlePrintReceipt}
        isPrinting={isPrinting}
      />

      <EmailReceiptDialog
        isOpen={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        onSendEmail={handleEmailReceipt}
        isSending={isSendingEmail}
        defaultEmail={receiptEmail}
      />
    </div>
  );
}
