import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { QuotationWithRelations } from "@/types/quotation";
import { QuotationReportGenerator } from "./quotationReportGenerator";

// Define CompanyInfo type
interface CompanyInfo {
  id: string;
  companyName: string;
  taxId: string;
  address: string;
  city: string;
  website: string;
  paymentTerms: string;
  note: string;
  bankAccount: string;
  bankAccount2: string;
  bankName: string;
  bankName2: string;
  logo: string;
  province: string;
  postCode: string;
  phone: string;
  phone2: string;
  phone3: string;
  email: string;
  deliveryNoteNote?: string;
  deliveryNoteTerms?: string;
  purchaseOrderNote?: string;
  purchaseOrderTerms?: string;
  proFormaNote?: string;
  proFormaTerms?: string;
  creditNoteNote?: string;
  creditNoteTerms?: string;
  supplierListNote?: string;
  supplierListTerms?: string;
}

interface PDFGeneratorOptions {
  combineServices: boolean;
  type?: "quotation" | "delivery-note" | "price-sheet";
}

export class PDFGenerator {
  static async generateQuotationPDF(
    quotation: QuotationWithRelations,
    companyInfo: CompanyInfo | null, // Accept companyInfo as parameter
    options: PDFGeneratorOptions
  ): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        // Generate the HTML content
        const htmlContent =
          QuotationReportGenerator.generateQuotationReportHTML(
            quotation,
            companyInfo || undefined,
            options.combineServices
          );

        // Create a temporary iframe to render the HTML
        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.top = "-9999px";
        iframe.style.left = "-9999px";
        iframe.style.width = "210mm";
        iframe.style.height = "297mm";
        iframe.style.border = "none";

        document.body.appendChild(iframe);

        iframe.contentDocument?.write(htmlContent);
        iframe.contentDocument?.close();

        // Wait for the content to load
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (!iframe.contentDocument?.body) {
          throw new Error("Failed to load HTML content");
        }

        // Generate PDF using jsPDF
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        // Get the HTML element
        const element = iframe.contentDocument.body;

        // Convert to canvas
        const canvas = await html2canvas(element, {
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
        });

        // Add image to PDF
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add new pages if content is longer than one page
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Clean up
        document.body.removeChild(iframe);

        // Generate blob
        const pdfBlob = pdf.output("blob");
        resolve(pdfBlob);
      } catch (error) {
        console.error("Error generating PDF:", error);
        reject(error);
      }
    });
  }

  static async downloadQuotationPDF(
    quotation: QuotationWithRelations,
    companyInfo: CompanyInfo | null, // Accept companyInfo as parameter
    options: PDFGeneratorOptions
  ): Promise<void> {
    try {
      const pdfBlob = await this.generateQuotationPDF(
        quotation,
        companyInfo,
        options
      );

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Quotation-${quotation.quotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      throw error;
    }
  }

  // Method for printing (uses the same PDF generation)
  static async printQuotationPDF(
    quotation: QuotationWithRelations,
    companyInfo: CompanyInfo | null, // Accept companyInfo as parameter
    options: PDFGeneratorOptions
  ): Promise<void> {
    try {
      const pdfBlob = await this.generateQuotationPDF(
        quotation,
        companyInfo,
        options
      );

      // Create blob URL
      const url = window.URL.createObjectURL(pdfBlob);

      // Create iframe for printing
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.top = "-9999px";
      iframe.style.left = "-9999px";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";

      document.body.appendChild(iframe);

      // Wait for iframe to load
      iframe.onload = () => {
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // Create object element for PDF
          const object = iframeDoc.createElement("object");
          object.data = url;
          object.type = "application/pdf";
          object.style.width = "100%";
          object.style.height = "100%";

          iframeDoc.body.appendChild(object);

          // Auto-print when PDF is loaded
          object.onload = () => {
            try {
              if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
              }
            } catch (printError) {
              console.error("Error printing PDF:", printError);
            }

            // Cleanup after printing
            setTimeout(() => {
              document.body.removeChild(iframe);
              window.URL.revokeObjectURL(url);
            }, 1000);
          };
        }
      };

      iframe.src = "about:blank";
    } catch (error) {
      console.error("Error printing PDF:", error);
      throw error;
    }
  }
}
