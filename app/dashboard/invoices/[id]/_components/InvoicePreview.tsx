"use client";

import { useEffect, useRef, useState } from "react";
import { InvoiceProps } from "@/types/invoice";
import { InvoiceReportGenerator } from "@/lib/invoiceReportGenerator";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface InvoicePreviewProps {
  invoice: InvoiceProps;
}

export const InvoicePreview = ({ invoice }: InvoicePreviewProps) => {
  const { companyInfo, loading } = useCompanyInfo();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");

  useEffect(() => {
    if (!loading) {
      const html = InvoiceReportGenerator.generateInvoiceReportHTML(
        invoice,
        companyInfo
      );
      setHtmlContent(html);
    }
  }, [invoice, companyInfo, loading]);

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

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-muted bg-muted/20 p-4">
      <div className="mx-auto max-w-[210mm] shadow-lg">
        <iframe
          ref={iframeRef}
          title="Invoice Preview"
          className="h-[297mm] w-full bg-white"
          style={{ border: "none" }}
        />
      </div>
    </Card>
  );
};
