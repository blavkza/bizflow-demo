"use client";

import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Copy,
  Send,
  Download,
  Edit,
  Clock,
  X,
  Trash,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { QuotationWithRelations } from "@/types/quotation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ConvertToInvoiceDialog } from "./ConvertToInvoiceDialog";
import { QuotationPDF } from "./QuotationPDF";
import { SendQuotationDialog } from "./SendQuotationDialog";
import { CancelQuotationDialog } from "./CancelQuotationDialog";
import { DeleteQuotationDialog } from "./DeleteQuotationDialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { QuotationReportGenerator } from "@/lib/quotationReportGenerator";

interface QuotationHeaderProps {
  quotation: QuotationWithRelations & {
    creator?: {
      GeneralSetting?: Array<{
        logo?: string;
        companyName?: string;
        Address?: string;
        city?: string;
        province?: string;
        postCode?: string;
        email?: string;
        phone?: string;
        phone2?: string;
        phone3?: string;
        website?: string;
        bankAccount?: string;
        bankAccount2?: string;
        bankName?: string;
        bankName2?: string;
      }>;
    };
  };
  canEditQuotations: boolean;
  hasFullAccess: boolean;
  canCreateInvoice: boolean;
  canDeleteQuotations: boolean;
  refresh: () => void;
}

export const QuotationHeader = ({
  quotation,
  refresh,
  canEditQuotations,
  hasFullAccess,
  canCreateInvoice,
  canDeleteQuotations,
}: QuotationHeaderProps) => {
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { companyInfo } = useCompanyInfo();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const daysUntilExpiry = Math.ceil(
    (new Date(quotation.validUntil).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const handlePrintQuotation = async () => {
    setIsGenerating(true);
    try {
      const quotationReportHTML =
        QuotationReportGenerator.generateQuotationReportHTML(
          quotation,
          companyInfo
        );

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(quotationReportHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        // Optional: Close the window after printing
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }
    } catch (error) {
      console.error("Error printing quotation:", error);
      toast.error("Failed to generate quotation report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/quotations">
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{quotation.quotationNumber}</h1>
            <div>
              <div className="flex items-center space-x-4 mt-2">
                <StatusBadge status={quotation.status} />
                {daysUntilExpiry > 0 && daysUntilExpiry <= 7 && (
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-600"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Expires in {daysUntilExpiry} days
                  </Badge>
                )}
                {daysUntilExpiry <= 0 && (
                  <Badge variant="destructive">
                    <Clock className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {quotation.status !== "CANCELLED" ? (
            <>
              {quotation.status !== "CONVERTED" && (
                <>
                  {(canCreateInvoice || hasFullAccess) && (
                    <Button onClick={() => setIsConvertDialogOpen(true)}>
                      Convert to Invoice
                    </Button>
                  )}

                  {(canEditQuotations || hasFullAccess) && (
                    <Button variant="outline" asChild>
                      <Link
                        className="flex items-center gap-2"
                        href={`/dashboard/quotations/${quotation.id}/edit`}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  )}
                </>
              )}

              <Button variant="outline" onClick={() => setSendDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
              {quotation.status !== "CONVERTED" &&
                (canEditQuotations || hasFullAccess) && (
                  <Button
                    variant="outline"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
            </>
          ) : (
            (canEditQuotations || hasFullAccess) && (
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(true)}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Uncancel
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintQuotation}
            disabled={isGenerating}
            aria-label="Print quotation"
          >
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Print"}
          </Button>
          {quotation.status !== "CONVERTED" &&
            (canDeleteQuotations || hasFullAccess) && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
        </div>
      </div>

      <ConvertToInvoiceDialog
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
        quotation={quotation}
        refresh={() => {
          if (refresh) refresh();
        }}
      />

      <SendQuotationDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        quotation={quotation}
      />

      <CancelQuotationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        quotationId={quotation.id}
        status={quotation.status}
        refresh={() => {
          if (refresh) refresh();
        }}
      />

      <DeleteQuotationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        quotationId={quotation.id}
      />
    </div>
  );
};
