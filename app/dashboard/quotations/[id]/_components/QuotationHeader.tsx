"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Mail,
  Download,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Edit,
} from "lucide-react";
import Link from "next/link";

type QuoteStatus = "PENDING" | "CONVERTED" | "EXPIRED" | "CANCELLED";

interface Quotation {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  total: number;
  customerName: string | null;
}

interface StatusConfig {
  [key: string]: {
    label: string;
    color: string;
    icon: any;
  };
}

interface QuotationHeaderProps {
  quotation: Quotation;
  statusConfig: StatusConfig;
  onPrintClick: () => void;
  onDownloadClick: () => void;
  onEmailClick: () => void;
  onQuickPrint: () => void;
  onConvertToSale: () => void;
  onCancelQuotation: () => void;
}

export default function QuotationHeader({
  quotation,
  statusConfig,
  onPrintClick,
  onDownloadClick,
  onEmailClick,
  onQuickPrint,
  onConvertToSale,
  onCancelQuotation,
}: QuotationHeaderProps) {
  const statusConfigItem = statusConfig[quotation.status];
  const StatusIcon = statusConfigItem.icon;

  const isConverted = quotation.status === "CONVERTED";
  const isCancelled = quotation.status === "CANCELLED";
  const canConvert = quotation.status === "PENDING";
  const canCancel = !isConverted && !isCancelled;

  return (
    <div className="space-y-4">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/shop/quotations">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Quotations
          </Link>
        </Button>
      </div>

      {/* Main header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Quotation #{quotation.quoteNumber}
            </h1>
            <Badge className={statusConfigItem.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfigItem.label}
            </Badge>
          </div>
          <div className="text-muted-foreground">
            <p>
              Customer:{" "}
              <span className="font-medium">
                {quotation.customerName || "No customer"}
              </span>
            </p>
            <p className="text-lg font-semibold mt-1">
              Total: R{quotation.total.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status management buttons */}
          {canConvert && (
            <Button
              onClick={onConvertToSale}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Convert to Sale
            </Button>
          )}

          {canCancel && (
            <Button onClick={onCancelQuotation} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Quotation
            </Button>
          )}

          {/* Edit button */}
          {!isConverted && !isCancelled && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/shop/quotations/${quotation.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}

          {/* Print & Export buttons */}
          <Button onClick={onQuickPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Quick Print
          </Button>

          <Button variant="outline" onClick={onPrintClick}>
            <Printer className="h-4 w-4 mr-2" />
            Print Options
          </Button>

          <Button variant="outline" onClick={onDownloadClick}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>

          {quotation.customerName && (
            <Button variant="outline" onClick={onEmailClick}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
