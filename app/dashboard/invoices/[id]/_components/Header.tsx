"use client";

import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { InvoiceProps, InvoiceStatus } from "@/types/invoice";
import { StatusBadge } from "./StatusBadge";
import { InvoiceActions } from "./InvoiceActions";
import { InvoicePDF } from "./InvoicePDF";
import { useRouter } from "next/navigation";

interface HeaderProps {
  invoice: InvoiceProps;
  canDeleteInvoice: boolean;
  canEditInvoice: boolean;
  hasFullAccess: boolean;
}

export default function Header({
  invoice,
  canDeleteInvoice,
  canEditInvoice,
  hasFullAccess,
}: HeaderProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (invoice.creator.GeneralSetting[0]?.logo) {
      const img = new Image();
      img.src = invoice.creator.GeneralSetting[0].logo;
      img.onload = () => setLogoLoaded(true);
    }
  }, [invoice.creator.GeneralSetting]);

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !logoLoaded) return;

    setIsGeneratingPdf(true);
    try {
      // Make the hidden div temporarily visible for capture
      invoiceRef.current.style.position = "fixed";
      invoiceRef.current.style.top = "0";
      invoiceRef.current.style.left = "0";
      invoiceRef.current.style.zIndex = "9999";
      invoiceRef.current.style.visibility = "visible";

      // Wait for final rendering
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: invoiceRef.current.scrollWidth,
        windowHeight: invoiceRef.current.scrollHeight,
        backgroundColor: "#ffffff",
      });

      if (!canvas) throw new Error("Canvas rendering failed");

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calculate dimensions
      const imgWidth = 190; // A4 width in mm (210 - margins)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again or contact support.");
    } finally {
      if (invoiceRef.current) {
        invoiceRef.current.style.position = "absolute";
        invoiceRef.current.style.visibility = "hidden";
      }
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <StatusBadge status={invoice.status as InvoiceStatus} />
              <span className="text-sm text-muted-foreground">
                Created on {new Date(invoice.issueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <InvoiceActions
          invoice={invoice}
          isGeneratingPdf={isGeneratingPdf}
          onDownloadPdf={handleDownloadPdf}
          canEditInvoice={canEditInvoice}
          canDeleteInvoice={canDeleteInvoice}
          hasFullAccess={hasFullAccess}
        />
      </div>
      <InvoicePDF invoice={invoice} forwardedRef={invoiceRef} />
    </div>
  );
}
