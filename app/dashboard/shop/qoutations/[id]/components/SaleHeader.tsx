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
  RefreshCw,
  CalendarX,
  CalendarCheck,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  onUndoCancelQuotation?: () => void;
  onMarkExpiredQuotation?: () => void;
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
  onUndoCancelQuotation,
  onMarkExpiredQuotation,
}: QuotationHeaderProps) {
  const statusConfigItem = statusConfig[quotation.status];
  const StatusIcon = statusConfigItem.icon;

  const router = useRouter();

  const isConverted = quotation.status === "CONVERTED";
  const isCancelled = quotation.status === "CANCELLED";
  const isExpired = quotation.status === "EXPIRED";
  const isPending = quotation.status === "PENDING";

  const canConvert = isPending;
  const canCancel = isPending || isExpired;
  const canRestore = isCancelled || isExpired;
  const canMarkExpired = isPending;

  return (
    <div className="space-y-4">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-2">
        <Button onClick={() => router.back()} variant="ghost" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Main header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {quotation.quoteNumber}
            </h1>
            <Badge className={statusConfigItem.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfigItem.label}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canCancel && (
            <Button onClick={onCancelQuotation} variant="destructive">
              <Ban className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}

          {canRestore && onUndoCancelQuotation && (
            <Button
              onClick={onUndoCancelQuotation}
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isCancelled ? "Undo Cancel" : "Restore"}
            </Button>
          )}
          {/* 
          {canMarkExpired && onMarkExpiredQuotation && (
            <Button
              onClick={onMarkExpiredQuotation}
              variant="outline"
              className="bg-orange-50 hover:bg-orange-100 text-orange-700"
            >
              <CalendarX className="h-4 w-4 mr-2" />
              Mark as Expired
            </Button>
          )} */}

          <Button variant="outline" onClick={onPrintClick}>
            <Printer className="h-4 w-4 mr-2" />
            Print Options
          </Button>

          <Button variant="outline" onClick={onDownloadClick}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>

          {quotation.status !== "CONVERTED" && (
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
