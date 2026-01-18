"use client";

import { useEffect, useRef, useState } from "react";
import { InvoiceDocumentWithRelations } from "@/types/invoice-document";
import { InvoiceDocumentReportGenerator } from "@/lib/invoice-document-report-generator";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  Download,
  Printer,
  ArrowLeft,
  Edit,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SendEmailDialog } from "./send-email-dialog";

interface InvoiceDocumentPreviewProps {
  document: InvoiceDocumentWithRelations;
  canEdit?: boolean;
}

export const InvoiceDocumentPreview = ({
  document,
  canEdit = false,
}: InvoiceDocumentPreviewProps) => {
  const { companyInfo, loading } = useCompanyInfo();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();

  const [showEmailDialog, setShowEmailDialog] = useState(false);

  useEffect(() => {
    if (!loading) {
      const html = InvoiceDocumentReportGenerator.generateInvoiceDocumentHTML(
        document,
        companyInfo
      );
      setHtmlContent(html);
    }
  }, [document, companyInfo, loading]);

  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent]);

  const handlePrint = () => {
    setIsPrinting(true);
    try {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        printWindow.onafterprint = () => {
          printWindow.close();
          setIsPrinting(false);
        };
      }
    } catch (error) {
      console.error("Error printing document:", error);
      toast.error("Failed to print document");
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Generate HTML content
      const htmlContent =
        InvoiceDocumentReportGenerator.generateInvoiceDocumentHTML(
          document,
          companyInfo
        );

      // Create a blob from the HTML content
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      const link = window.document.createElement("a");

      const linkElement = window.document.createElement("a");
      linkElement.href = url;
      linkElement.download = `${document.invoiceDocumentNumber}_${document.invoiceDocumentType.toLowerCase()}.html`;

      // Trigger download
      window.document.body.appendChild(linkElement);
      linkElement.click();
      window.document.body.removeChild(linkElement);

      // Clean up
      URL.revokeObjectURL(url);

      toast.success("Document downloaded successfully");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    } finally {
      setIsDownloading(false);
    }
  };

  const hasEmailContact = () => {
    if (document.client?.email) return true;
    if (document.supplier?.email) return true;
    return false;
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      DELIVERY_NOTE: "Delivery Note",
      PURCHASE_ORDER: "Purchase Order",
      PRO_FORMA_INVOICE: "Pro Forma Invoice",
      CREDIT_NOTE: "Credit Note",
      SUPPLIER_LIST: "Supplier List",
      INVOICE: "Invoice",
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header with document info and actions */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {getDocumentTypeLabel(document.invoiceDocumentType)}
              </h1>
              <p className="text-sm text-muted-foreground">
                {document.invoiceDocumentNumber} •{" "}
                {document.client?.name ||
                  document.supplier?.name ||
                  "No contact"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/invoice-documents/${document.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}

            {/* Download Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload()}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download
            </Button>

            {/* Send Email Button */}
            <Button
              size="sm"
              onClick={() => setShowEmailDialog(true)}
              disabled={!hasEmailContact()}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>

            {/* Print Button */}
            <Button size="sm" onClick={handlePrint} disabled={isPrinting}>
              {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Print
            </Button>
          </div>
        </div>
      </Card>

      {/* Document Preview */}
      <Card className="overflow-hidden border-muted bg-muted/20 p-4">
        <div className="mx-auto max-w-[210mm] shadow-lg">
          <iframe
            ref={iframeRef}
            title="Document Preview"
            className="h-[297mm] w-full bg-white"
            style={{ border: "none" }}
          />
        </div>
      </Card>

      {/* Document Details Card */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Document Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Basic Info
            </h3>
            <ul className="space-y-1 text-sm">
              <li>
                <span className="font-medium">Document Number:</span>{" "}
                {document.invoiceDocumentNumber}
              </li>
              <li>
                <span className="font-medium">Status:</span> {document.status}
              </li>
              <li>
                <span className="font-medium">Issue Date:</span>{" "}
                {new Date(document.issueDate).toLocaleDateString()}
              </li>
              {document.dueDate && (
                <li>
                  <span className="font-medium">Due Date:</span>{" "}
                  {new Date(document.dueDate).toLocaleDateString()}
                </li>
              )}
              {document.currency && (
                <li>
                  <span className="font-medium">Currency:</span>{" "}
                  {document.currency}
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Financials
            </h3>
            <ul className="space-y-1 text-sm">
              <li>
                <span className="font-medium">Subtotal:</span> R{" "}
                {Number(document.subtotal).toLocaleString("en-ZA", {
                  minimumFractionDigits: 2,
                })}
              </li>
              {document.taxAmount && (
                <li>
                  <span className="font-medium">Tax:</span> R{" "}
                  {Number(document.taxAmount).toLocaleString("en-ZA", {
                    minimumFractionDigits: 2,
                  })}
                </li>
              )}
              {document.discountAmount && (
                <li>
                  <span className="font-medium">Discount:</span> R{" "}
                  {Number(document.discountAmount).toLocaleString("en-ZA", {
                    minimumFractionDigits: 2,
                  })}
                </li>
              )}
              <li>
                <span className="font-medium">Total:</span> R{" "}
                {Number(document.totalAmount).toLocaleString("en-ZA", {
                  minimumFractionDigits: 2,
                })}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Additional Info
            </h3>
            <ul className="space-y-1 text-sm">
              {document.referenceNumber && (
                <li>
                  <span className="font-medium">Reference:</span>{" "}
                  {document.referenceNumber}
                </li>
              )}
              {document.createdBy && (
                <li>
                  <span className="font-medium">Created By:</span>{" "}
                  {document.creator?.name || "Unknown"}
                </li>
              )}
              <li>
                <span className="font-medium">Created:</span>{" "}
                {new Date(document.createdAt).toLocaleDateString()}
              </li>
              <li>
                <span className="font-medium">Updated:</span>{" "}
                {new Date(document.updatedAt).toLocaleDateString()}
              </li>
            </ul>
          </div>
        </div>

        {/* Items Summary */}
        {document.items && document.items.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Items Summary
            </h3>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-center">Quantity</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {document.items.slice(0, 5).map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="p-2">{item.description}</td>
                      <td className="p-2 text-center">
                        {Number(item.quantity).toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        R{" "}
                        {Number(item.unitPrice).toLocaleString("en-ZA", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-right">
                        R{" "}
                        {Number(item.amount).toLocaleString("en-ZA", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {document.items.length > 5 && (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  + {document.items.length - 5} more items
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <SendEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        document={document}
        htmlContent={htmlContent}
        companyInfo={companyInfo}
        onSuccess={() => {
          toast.success("Email sent successfully");
          setShowEmailDialog(false);
        }}
      />
    </div>
  );
};
