"use client";

import { useEffect, useRef, useState } from "react";
import { QuotationWithRelations } from "@/types/quotation";
import { QuotationDeliveryNoteGenerator } from "@/lib/QuotationDeliveryNoteGenerator";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentPreviewProps {
  quotation: QuotationWithRelations;
  defaultDocumentType?: string;
}

type DocumentType = "delivery" | "price" | "packing" | "product" | "quotation";

const documentTypes = [
  { value: "delivery", label: "Delivery Note", emoji: "🚚" },
  { value: "price", label: "Price Sheet", emoji: "💰" },
  { value: "packing", label: "Packing List", emoji: "📦" },
  { value: "product", label: "Product List", emoji: "📋" },
];

export const DocumentPreview = ({
  quotation,
  defaultDocumentType = "delivery",
}: DocumentPreviewProps) => {
  const { companyInfo, loading } = useCompanyInfo();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>(defaultDocumentType);
  const [previewLoading, setPreviewLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!loading) {
      setPreviewLoading(true);
      let html = "";

      switch (documentType) {
        case "delivery":
          html =
            QuotationDeliveryNoteGenerator.generateDeliveryNoteWithoutPrices(
              quotation,
              companyInfo
            );
          break;
        case "price":
          html = QuotationDeliveryNoteGenerator.generatePriceSheet(
            quotation,
            companyInfo
          );
          break;
        case "packing":
          html = QuotationDeliveryNoteGenerator.generatePackingList(
            quotation,
            companyInfo
          );
          break;
        case "product":
          html = QuotationDeliveryNoteGenerator.generateProductList(
            quotation,
            companyInfo
          );
          break;
        default:
          // For quotation, you would need to import and use QuotationReportGenerator
          // For now, let's use delivery note as fallback
          html =
            QuotationDeliveryNoteGenerator.generateDeliveryNoteWithoutPrices(
              quotation,
              companyInfo
            );
      }

      setHtmlContent(html);
      setPreviewLoading(false);
    }
  }, [quotation, companyInfo, loading, documentType]);

  useEffect(() => {
    if (iframeRef.current && htmlContent && !previewLoading) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent, previewLoading]);

  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
    setPreviewLoading(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading company information...</span>
      </div>
    );
  }

  const selectedDocument = documentTypes.find(
    (doc) => doc.value === documentType
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {selectedDocument?.emoji} {selectedDocument?.label} Preview
          </h3>
          <p className="text-sm text-muted-foreground">
            Preview the document before printing
          </p>
        </div>

        <Select value={documentType} onValueChange={handleDocumentTypeChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((doc) => (
              <SelectItem key={doc.value} value={doc.value}>
                {doc.emoji} {doc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {previewLoading ? (
        <Card className="h-[297mm] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">
              Generating {selectedDocument?.label.toLowerCase()} preview...
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-muted bg-muted/20">
          <CardContent className="p-4">
            <div className="mx-auto max-w-[210mm] shadow-lg">
              <iframe
                ref={iframeRef}
                title={`${selectedDocument?.label} Preview`}
                className="h-[297mm] w-full bg-white"
                style={{ border: "none" }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="mb-2 font-medium">Document Information:</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Total Items: {quotation.items.length}</li>
          <li>
            • Total Products:{" "}
            {quotation.items.filter((item) => item.shopProductId).length}
          </li>
          <li>
            • Total Services:{" "}
            {quotation.items.filter((item) => item.serviceId).length}
          </li>
          <li>• Generated: {new Date().toLocaleDateString()}</li>
          <li>• Preview shows actual print layout</li>
        </ul>
      </div>
    </div>
  );
};
