"use client";

import { useState } from "react";
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
  Loader2,
  Package,
  DollarSign,
  FileText,
  MoreVertical,
  Eye,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { QuotationWithRelations } from "@/types/quotation";
import { Badge } from "@/components/ui/badge";
import { ConvertToInvoiceDialog } from "./ConvertToInvoiceDialog";
import { SendQuotationDialog } from "./SendQuotationDialog";
import { CancelQuotationDialog } from "./CancelQuotationDialog";
import { DeleteQuotationDialog } from "./DeleteQuotationDialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { QuotationReportGenerator } from "@/lib/quotationReportGenerator";
import { QuotationDeliveryNoteGenerator } from "@/lib/QuotationDeliveryNoteGenerator";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  canCreateQuotations: boolean;
  refresh: () => void;
}

export const QuotationHeader = ({
  quotation,
  refresh,
  canEditQuotations,
  hasFullAccess,
  canCreateInvoice,
  canDeleteQuotations,
  canCreateQuotations,
}: QuotationHeaderProps) => {
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingDeliveryNote, setIsGeneratingDeliveryNote] =
    useState(false);
  const [isGeneratingPriceSheet, setIsGeneratingPriceSheet] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const router = useRouter();
  const { companyInfo } = useCompanyInfo();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const daysUntilExpiry = Math.ceil(
    (new Date(quotation.validUntil).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const canDuplicate = canCreateQuotations || hasFullAccess;
  const canEdit =
    (canEditQuotations || hasFullAccess) && quotation.status !== "CONVERTED";
  const canCancel =
    (canEditQuotations || hasFullAccess) && quotation.status !== "CONVERTED";
  const canDelete =
    (canDeleteQuotations || hasFullAccess) && quotation.status !== "CONVERTED";

  const handleDuplicate = async () => {
    if (!canDuplicate) {
      toast.error("You don't have permission to duplicate quotations");
      return;
    }

    try {
      setIsDuplicating(true);

      const response = await axios.post(
        `/api/quotations/${quotation.id}/duplicate`
      );
      const data = response.data;

      toast.success(
        `Quotation ${quotation.quotationNumber} duplicated successfully`
      );

      // Redirect to the edit page of the new quotation
      router.push(data.redirectUrl);
    } catch (error) {
      console.error("Error duplicating quotation:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Failed to duplicate quotation";

      toast.error(errorMessage);
    } finally {
      setIsDuplicating(false);
    }
  };

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

  const handlePrintDeliveryNote = async () => {
    setIsGeneratingDeliveryNote(true);
    try {
      const deliveryNoteHTML =
        QuotationDeliveryNoteGenerator.generateDeliveryNoteWithoutPrices(
          quotation,
          companyInfo
        );

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(deliveryNoteHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }
    } catch (error) {
      console.error("Error printing delivery note:", error);
      toast.error("Failed to generate delivery note");
    } finally {
      setIsGeneratingDeliveryNote(false);
    }
  };

  const handlePrintPriceSheet = async () => {
    setIsGeneratingPriceSheet(true);
    try {
      const priceSheetHTML = QuotationDeliveryNoteGenerator.generatePriceSheet(
        quotation,
        companyInfo
      );

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(priceSheetHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }
    } catch (error) {
      console.error("Error printing price sheet:", error);
      toast.error("Failed to generate price sheet");
    } finally {
      setIsGeneratingPriceSheet(false);
    }
  };

  return (
    <div>
      <div className="flex md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
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
                {quotation.convertedToInvoice && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    ✓ Converted to Invoice
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Convert to Invoice Button (Always Visible) */}
          {quotation.status !== "CANCELLED" &&
            quotation.status !== "CONVERTED" &&
            (canCreateInvoice || hasFullAccess) && (
              <Button onClick={() => setIsConvertDialogOpen(true)}>
                Convert to Invoice
              </Button>
            )}

          {/* Send Button (Always Visible if not cancelled) */}
          {quotation.status !== "CANCELLED" && (
            <Button variant="outline" onClick={() => setSendDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
                <span className="ml-2 hidden md:inline">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* View/Edit Group */}
              <DropdownMenuGroup>
                {canEdit && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/quotations/${quotation.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Quotation
                    </Link>
                  </DropdownMenuItem>
                )}

                {canDuplicate && (
                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    disabled={isDuplicating}
                  >
                    {isDuplicating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {isDuplicating ? "Duplicating..." : "Duplicate"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Print Group */}
              <DropdownMenuGroup>
                <DropdownMenuLabel>Print Documents</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handlePrintQuotation}
                  disabled={isGenerating}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generating..." : " Quotation PDF"}
                </DropdownMenuItem>

                {/*  <DropdownMenuItem
                  onClick={handlePrintDeliveryNote}
                  disabled={isGeneratingDeliveryNote}
                >
                  <Package className="mr-2 h-4 w-4" />
                  {isGeneratingDeliveryNote ? "Generating..." : "Delivery Note"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handlePrintPriceSheet}
                  disabled={isGeneratingPriceSheet}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  {isGeneratingPriceSheet ? "Generating..." : "Price Sheet"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    QuotationDeliveryNoteGenerator.generatePackingList(
                      quotation,
                      companyInfo
                    );
                    const packingListHTML =
                      QuotationDeliveryNoteGenerator.generatePackingList(
                        quotation,
                        companyInfo
                      );
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      printWindow.document.write(packingListHTML);
                      printWindow.document.close();
                      printWindow.onload = () => {
                        printWindow.focus();
                        printWindow.print();
                      };
                    }
                  }}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Packing List
                </DropdownMenuItem> */}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Status Management Group */}
              <DropdownMenuGroup>
                <DropdownMenuLabel>Status</DropdownMenuLabel>

                {quotation.status === "CANCELLED"
                  ? canEdit && (
                      <DropdownMenuItem
                        onClick={() => setCancelDialogOpen(true)}
                      >
                        <Undo2 className="mr-2 h-4 w-4" />
                        Uncancel Quotation
                      </DropdownMenuItem>
                    )
                  : canCancel && (
                      <DropdownMenuItem
                        onClick={() => setCancelDialogOpen(true)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel Quotation
                      </DropdownMenuItem>
                    )}

                {quotation.status !== "CONVERTED" && canDelete && (
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Quotation
                  </DropdownMenuItem>
                )}

                {quotation.convertedToInvoice && quotation.invoiceId && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/invoices/${quotation.invoiceId}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Invoice
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Quick Actions */}
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/clients/${quotation.clientId}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Client
                  </Link>
                </DropdownMenuItem>

                {quotation.projectId && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/projects/${quotation.projectId}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Project
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
