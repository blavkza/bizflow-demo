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
  refresh: () => void;
}

export const QuotationHeader = ({
  quotation,
  refresh,
}: QuotationHeaderProps) => {
  const router = useRouter();
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const quotationRef = useRef<HTMLDivElement>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const daysUntilExpiry = Math.ceil(
    (new Date(quotation.validUntil).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  useEffect(() => {
    if (quotation.creator?.GeneralSetting?.[0]?.logo) {
      const img = new Image();
      img.src = quotation.creator.GeneralSetting[0].logo;
      img.onload = () => setLogoLoaded(true);
    }
  }, [quotation.creator?.GeneralSetting]);

  const handleDownloadPdf = async () => {
    if (!quotationRef.current) return;

    setIsGeneratingPdf(true);
    try {
      quotationRef.current.style.position = "fixed";
      quotationRef.current.style.top = "0";
      quotationRef.current.style.left = "0";
      quotationRef.current.style.zIndex = "9999";
      quotationRef.current.style.visibility = "visible";

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const canvas = await html2canvas(quotationRef.current, {
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: quotationRef.current.scrollWidth,
        windowHeight: quotationRef.current.scrollHeight,
        backgroundColor: "#ffffff",
      });

      if (!canvas) throw new Error("Canvas rendering failed");

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`${quotation.quotationNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(
        "Failed to generate PDF. Please try again or contact support."
      );
    } finally {
      if (quotationRef.current) {
        quotationRef.current.style.position = "absolute";
        quotationRef.current.style.visibility = "hidden";
      }
      setIsGeneratingPdf(false);
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
                <Button onClick={() => setIsConvertDialogOpen(true)}>
                  Convert to Invoice
                </Button>
              )}

              <Button variant="outline">
                <Link
                  className="flex items-center gap-2"
                  href={`/dashboard/quotations/${quotation.id}/edit`}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>

              <Button variant="outline" onClick={() => setSendDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
              {quotation.status !== "CONVERTED" && (
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
            <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
              <Undo2 className="mr-2 h-4 w-4" />
              Uncancel
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
          >
            <Download className="mr-2 h-4 w-4" />
            {isGeneratingPdf ? "Generating..." : "Download"}
          </Button>
          {quotation.status !== "CONVERTED" && (
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

      <QuotationPDF quotation={quotation} forwardedRef={quotationRef} />
    </div>
  );
};
