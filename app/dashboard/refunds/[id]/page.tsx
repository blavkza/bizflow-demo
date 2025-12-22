"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
  ShoppingCart,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Package,
  AlertCircle,
  Download,
  Printer,
  Share2,
  History,
  Receipt,
  Banknote,
  Store,
  ArrowUpDown,
  Tag,
  Image as ImageIcon,
  RefreshCw,
  AlertTriangle,
  Building,
  Edit,
  Plus,
  StickyNote,
  FileText as FileTextIcon,
  Smartphone,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { refundReceiptGenerator } from "@/lib/refund-receipt-generator";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { RefundDetailSkeleton } from "./components/RefundDetailSkeleton";

interface Refund {
  id: string;
  refundNumber: string;
  status: string;
  reason: string;
  method: string;
  amount: number;
  taxAmount: number;
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  sale: {
    id: string;
    saleNumber: string;
    customerName: string | null;
    customerPhone: string | null;
    customerEmail: string | null;
    total: number;
    paymentMethod: string;
    saleDate: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    taxAmount: number;
    saleItem: {
      id: string;
      quantity: number;
      price: string;
      total: string;
      ShopProduct: {
        id: string;
        name: string;
        sku: string;
        brand: string;
        category: string;
        description: string;
        price: string;
        images: string[];
      };
    };
  }>;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
    icon: Clock,
    progress: 25,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    icon: CheckCircle,
    progress: 50,
  },
  PROCESSING: {
    label: "Processing",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
    icon: ArrowUpDown,
    progress: 75,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    icon: CheckCircle,
    progress: 100,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-rose-500/10 text-rose-600 border-rose-200",
    icon: XCircle,
    progress: 100,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-500/10 text-gray-600 border-gray-200",
    icon: XCircle,
    progress: 100,
  },
};

const methodConfig = {
  ORIGINAL_METHOD: {
    label: "Original Method",
    icon: CreditCard,
    color: "bg-blue-500/10 text-blue-600",
  },
  CASH: {
    label: "Cash",
    icon: DollarSign,
    color: "bg-green-500/10 text-green-600",
  },
  CARD: {
    label: "Card Payment",
    icon: CreditCard,
    color: "bg-purple-500/10 text-purple-600",
  },
  CREDIT_CARD: {
    label: "Credit Card",
    icon: CreditCard,
    color: "bg-purple-500/10 text-purple-600",
  },
  BANK_TRANSFER: {
    label: "Bank Transfer",
    icon: Banknote,
    color: "bg-cyan-500/10 text-cyan-600",
  },
  STORE_CREDIT: {
    label: "Store Credit",
    icon: Store,
    color: "bg-orange-500/10 text-orange-600",
  },
};

type ReceiptSize = "thermal" | "A4";

export default function RefundDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const { companyInfo } = useCompanyInfo();
  const [refund, setRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false);
  const [selectedReceiptSize, setSelectedReceiptSize] =
    useState<ReceiptSize>("A4");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();

  const refundId = params.id as string;

  useEffect(() => {
    if (refundId) {
      fetchRefund();
    }
  }, [refundId]);

  // Set company info for receipt generator
  useEffect(() => {
    if (companyInfo) {
      refundReceiptGenerator.setCompanyInfo(companyInfo);
    }
  }, [companyInfo]);

  const fetchRefund = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/refunds/${refundId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch refund");
      }

      const data = await response.json();
      setRefund(data.data);
      setAdditionalNotes(data.data?.notes || "");
    } catch (error) {
      console.error("Error fetching refund:", error);
      toast({
        title: "Error",
        description: "Failed to load refund details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, data?: any) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/refunds/${refundId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId: "current-user-id",
          notes: additionalNotes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: `Refund ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          description: `Refund has been ${action}ed successfully`,
        });
        fetchRefund();

        if (action === "reject") {
          setRejectionDialogOpen(false);
          setRejectionReason("");
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`Error ${action}ing refund:`, error);
      toast({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`,
        description: `Failed to ${action} refund`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSubmittingNotes(true);
      const response = await fetch(`/api/refunds/${refundId}/notes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: additionalNotes }),
      });
      setIsSubmittingNotes(false);
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Notes Saved",
          description: "Additional notes have been saved",
        });
        setNotesDialogOpen(false);
        fetchRefund();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save notes",
        variant: "destructive",
      });
    }
  };

  const handlePrintRefund = async (size: ReceiptSize) => {
    if (!refund) return;

    try {
      setIsPrinting(true);
      toast({
        title: "Generating Receipt",
        description: `Preparing ${size} refund receipt for printing...`,
      });

      await refundReceiptGenerator.printRefundReceipt(refund, size);

      toast({
        title: "Print Ready",
        description: `Refund receipt opened in new window for printing`,
      });
    } catch (error) {
      console.error("Error printing refund receipt:", error);
      toast({
        title: "Print Failed",
        description: "Failed to generate refund receipt",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
      setPrintDialogOpen(false);
    }
  };

  const handleDownloadRefund = async (size: ReceiptSize) => {
    if (!refund) return;

    try {
      setIsDownloading(true);
      toast({
        title: "Downloading Receipt",
        description: `Preparing ${size} refund receipt download...`,
      });

      const pdfBlob = await refundReceiptGenerator.generateRefundReceiptPDF(
        refund,
        size
      );
      await refundReceiptGenerator.downloadRefundReceipt(
        pdfBlob,
        `refund-${refund.refundNumber}-${new Date().toISOString().split("T")[0]}.html`
      );

      toast({
        title: "Download Complete",
        description: "Refund receipt has been downloaded",
      });
    } catch (error) {
      console.error("Error downloading refund receipt:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download refund receipt",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setPrintDialogOpen(false);
    }
  };

  const handleShareRefund = async () => {
    if (!refund) return;

    if (navigator.share) {
      try {
        // Generate HTML receipt for sharing
        const htmlReceipt =
          await refundReceiptGenerator.generateRefundReceiptForEmail(refund);

        // Create a blob for the receipt
        const blob = new Blob([htmlReceipt], { type: "text/html" });
        const receiptFile = new File(
          [blob],
          `refund-${refund.refundNumber}.html`,
          { type: "text/html" }
        );

        await navigator.share({
          title: `Refund Receipt - ${refund.refundNumber}`,
          text: `Refund receipt for ${refund.sale.saleNumber}`,
          files: [receiptFile],
        });

        toast({
          title: "Receipt Shared",
          description: "Refund receipt has been shared",
        });
      } catch (error) {
        console.error("Error sharing refund receipt:", error);
        toast({
          title: "Share Failed",
          description: "Failed to share refund receipt",
          variant: "destructive",
        });
      }
    } else {
      // Fallback: Copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Refund link copied to clipboard",
      });
    }
  };

  const getProductImage = (product: any) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return "/placeholder-product.png";
  };

  const getInitials = (name: string | null) => {
    if (!name) return "WC";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return <RefundDetailSkeleton />;
  }

  if (!refund) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">
            Refund Not Found
          </h2>
          <p className="text-muted-foreground mt-2">
            The refund you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.back()} className="mt-4">
            Back to Refunds
          </Button>
        </div>
      </div>
    );
  }

  const statusConfigItem =
    statusConfig[refund.status as keyof typeof statusConfig];
  const StatusIcon = statusConfigItem.icon;
  const totalItems = refund.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = refund.amount - refund.taxAmount;
  const methodConfigItem =
    methodConfig[refund.method as keyof typeof methodConfig];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {refund.refundNumber}
              </h1>
              <Badge className={`${statusConfigItem.color} border`}>
                <StatusIcon className="h-3 w-3 mr-1.5" />
                {statusConfigItem.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Refund for Sale{" "}
              <Link
                href={`/dashboard/shop/sales/${refund.sale.id}`}
                className="text-primary hover:underline font-medium"
              >
                {refund.sale.saleNumber}
              </Link>
              {" • "}
              {new Date(refund.createdAt).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotesDialogOpen(true)}
            className="gap-2"
          >
            <StickyNote className="h-4 w-4" />
            {additionalNotes ? "Edit Notes" : "Add Notes"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPrintDialogOpen(true)}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareRefund}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRefund}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Refund Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Refund Items Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  Refund Items ({totalItems} items)
                </CardTitle>
                <Badge variant="secondary" className="text-sm">
                  {refund.items.length}{" "}
                  {refund.items.length === 1 ? "product" : "products"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {refund.items.map((item) => {
                  const product = item.saleItem.ShopProduct;
                  const originalQuantity = item.saleItem.quantity;
                  const refundQuantity = item.quantity;
                  const remainingQuantity = originalQuantity - refundQuantity;
                  const productImage = getProductImage(product);

                  return (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-20 w-20 border flex-shrink-0">
                          <AvatarImage
                            src={productImage}
                            alt={product.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-muted">
                            <Package className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-base">
                                {product.name}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  SKU: {product.sku}
                                </Badge>
                                {product.brand && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {product.brand}
                                  </Badge>
                                )}
                                {product.category && (
                                  <Badge variant="outline" className="text-xs">
                                    <Tag className="h-2.5 w-2.5 mr-1" />
                                    {product.category}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                {formatCurrency(item.total)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(item.price)} × {refundQuantity}
                              </p>
                            </div>
                          </div>

                          {/* Quantity Summary */}
                          <div className="grid grid-cols-3 gap-4 mt-4 p-3 bg-muted/30 rounded-lg">
                            <div className="text-center">
                              <p className="text-sm font-medium text-muted-foreground">
                                Original
                              </p>
                              <p className="text-lg font-semibold">
                                {originalQuantity}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-muted-foreground">
                                Refund
                              </p>
                              <p className="text-lg font-semibold text-rose-600">
                                -{refundQuantity}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-muted-foreground">
                                Remaining
                              </p>
                              <p className="text-lg font-semibold text-emerald-600">
                                {remainingQuantity}
                              </p>
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Unit Price:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                VAT (15%):
                              </span>
                              <span>{formatCurrency(item.taxAmount)}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span>Item Total:</span>
                              <span className="text-base">
                                {formatCurrency(item.total)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Summary Section */}
                <div className="border rounded-lg p-6 bg-gradient-to-r from-muted/50 to-background">
                  <h4 className="font-semibold text-lg mb-4">Refund Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Items Subtotal:
                      </span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">VAT (15%):</span>
                      <span>{formatCurrency(refund.taxAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total Refund Amount:</span>
                      <span className="text-primary text-xl">
                        {formatCurrency(refund.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Details Card */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Notes & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Internal Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-blue-500" />
                    <Label className="text-sm font-medium">
                      Internal Notes
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotesDialogOpen(true)}
                    className="gap-1 h-7"
                  >
                    <Edit className="h-3 w-3" />
                    {additionalNotes ? "Edit" : "Add"}
                  </Button>
                </div>
                <div
                  className={`p-4 rounded-lg border ${additionalNotes ? "bg-blue-50 border-blue-200" : "bg-muted/30 border"}`}
                >
                  {additionalNotes ? (
                    <p className="text-sm whitespace-pre-wrap">
                      {additionalNotes}
                    </p>
                  ) : (
                    <div className="text-center py-4">
                      <StickyNote className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No internal notes added
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNotesDialogOpen(true)}
                        className="mt-2 gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Notes
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Refund Reason */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <Label className="text-sm font-medium">Refund Reason</Label>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm">{refund.reason}</p>
                </div>
              </div>

              {/* Method */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Refund Method</Label>
                <div className="flex items-center gap-4 p-4 bg-card border rounded-lg">
                  <div
                    className={`p-3 rounded-lg ${methodConfigItem?.color} flex-shrink-0`}
                  >
                    {methodConfigItem?.icon && (
                      <methodConfigItem.icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {methodConfigItem?.label || refund.method}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Refund initiated via{" "}
                          {refund.method.toLowerCase().replace("_", " ")}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {refund.status === "COMPLETED"
                          ? "Processed"
                          : "Pending"}
                      </Badge>
                    </div>
                    {refund.processedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Processed on{" "}
                        {new Date(refund.processedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Refund Timeline</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Requested</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(refund.createdAt).toLocaleString()} by{" "}
                        {refund.requestedBy}
                      </p>
                    </div>
                  </div>

                  {refund.approvedAt && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Approved</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(refund.approvedAt).toLocaleString()} by{" "}
                          {refund.approvedBy}
                        </p>
                      </div>
                    </div>
                  )}

                  {refund.processedAt && (
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <ArrowUpDown className="h-4 w-4 text-indigo-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Processed</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(refund.processedAt).toLocaleString()} by{" "}
                          {refund.processedBy}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg ${statusConfigItem.color.split(" ")[0]}`}
                >
                  <StatusIcon className="h-5 w-5" />
                </div>
                Refund Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {statusConfigItem.progress}%
                  </span>
                </div>
                <Progress value={statusConfigItem.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Items</p>
                  <p className="text-lg font-semibold">{totalItems}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatCurrency(refund.amount)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t">
                {refund.status === "PENDING" && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleAction("approve")}
                      disabled={actionLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Approve Refund
                    </Button>
                    <Button
                      onClick={() => setRejectionDialogOpen(true)}
                      disabled={actionLoading}
                      variant="outline"
                      className="w-full border-rose-600 text-rose-600 hover:bg-rose-50 gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Refund
                    </Button>
                  </div>
                )}

                {refund.status === "APPROVED" && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleAction("complete")}
                      disabled={actionLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark as Complete
                    </Button>
                  </div>
                )}

                {refund.status === "PROCESSING" && (
                  <Button
                    onClick={() => handleAction("complete")}
                    disabled={actionLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Complete Refund
                  </Button>
                )}

                {(refund.status === "COMPLETED" ||
                  refund.status === "REJECTED") && (
                  <div className="text-center py-4">
                    <div
                      className={`p-3 rounded-full ${statusConfigItem.color.split(" ")[0]} inline-flex mb-3`}
                    >
                      <StatusIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This refund has been{" "}
                      {statusConfigItem.label.toLowerCase()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(refund.sale.customerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {refund.sale.customerName || "Walk-in Customer"}
                  </p>
                  {refund.sale.customerEmail && (
                    <p className="text-sm text-muted-foreground truncate">
                      {refund.sale.customerEmail}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {refund.sale.customerPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {refund.sale.customerPhone}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Building className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Sale Reference</p>
                    <Link
                      href={`/dashboard/shop/sales/${refund.sale.id}`}
                      className="text-primary hover:underline text-sm"
                    >
                      {refund.sale.saleNumber}
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Sale Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(refund.sale.saleDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sale Summary Card */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Sale Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Original Sale Total:
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(refund.sale.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Refund Amount:
                  </span>
                  <span className="font-semibold text-rose-600">
                    -{formatCurrency(refund.amount)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-base font-bold">
                  <span>Balance After Refund:</span>
                  <span className="text-emerald-600">
                    {formatCurrency(refund.sale.total - refund.amount)}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Payment Information
                  </span>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Method:
                    </span>
                    <span className="text-sm font-medium">
                      {refund.sale.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Refund Method:
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {methodConfigItem?.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Internal Notes
            </DialogTitle>
            <DialogDescription>
              Add internal notes about this refund. These notes are only visible
              to staff members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add internal notes about this refund..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Notes can include:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Communication with customer</li>
                <li>Internal decisions about the refund</li>
                <li>Special instructions for processing</li>
                <li>Any other relevant information</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>
              {isSubmittingNotes ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Notes..
                </>
              ) : (
                "Save Notes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print Refund Receipt
            </DialogTitle>
            <DialogDescription>
              Choose the receipt format and action for {refund.refundNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Receipt Size Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Receipt Format</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReceiptSize("A4")}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${
                    selectedReceiptSize === "A4"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <FileTextIcon className="h-8 w-8 mb-2" />
                  <span className="font-medium">A4 Format</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Full page
                  </span>
                  {selectedReceiptSize === "A4" && (
                    <div className="mt-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedReceiptSize("thermal")}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${
                    selectedReceiptSize === "thermal"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Smartphone className="h-8 w-8 mb-2" />
                  <span className="font-medium">Thermal</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    80mm receipt
                  </span>
                  {selectedReceiptSize === "thermal" && (
                    <div className="mt-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Action Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Action</Label>
              <div className="space-y-2">
                <Button
                  onClick={() => handlePrintRefund(selectedReceiptSize)}
                  disabled={isPrinting || isDownloading}
                  className="w-full gap-2"
                >
                  {isPrinting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing Print...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4" />
                      Print Receipt
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleDownloadRefund(selectedReceiptSize)}
                  disabled={isDownloading || isPrinting}
                  variant="outline"
                  className="w-full gap-2"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download as HTML
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Format Information:</p>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>
                      <strong>A4 Format:</strong> Full-page receipt suitable for
                      official documentation
                    </li>
                    <li>
                      <strong>Thermal:</strong> Compact 80mm width for receipt
                      printers
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <XCircle className="h-5 w-5" />
              Reject Refund Request
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this refund request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this refund is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Important</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                This action cannot be undone and will notify the customer.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleAction("reject", { rejectionReason })}
              disabled={actionLoading || !rejectionReason.trim()}
              variant="destructive"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
