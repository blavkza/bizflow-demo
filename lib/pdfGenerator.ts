import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { QuotationWithRelations } from "@/types/quotation";
import { QuotationReportGenerator } from "./quotationReportGenerator";
import { InvoiceProps } from "@/types/invoice";
import { InvoiceReportGenerator } from "./invoiceReportGenerator";
import { MaintenanceReportGenerator } from "./maintenanceReportGenerator";

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
  hideItemPrices?: boolean; // New optional property
  type?:
    | "quotation"
    | "invoice"
    | "delivery-note"
    | "price-sheet"
    | "maintenance";
}

export class PDFGenerator {
  // Common method to generate PDF from HTML
  private static async generatePDFFromHTML(
    htmlContent: string,
    documentType: string,
    documentNumber: string,
  ): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        // Create a temporary iframe to render the HTML
        const iframe = window.document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.top = "-9999px";
        iframe.style.left = "-9999px";
        iframe.style.width = "210mm";
        iframe.style.height = "297mm";
        iframe.style.border = "none";
        iframe.style.visibility = "hidden";

        window.document.body.appendChild(iframe);

        // Write the HTML content to the iframe
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          throw new Error("Failed to access iframe document");
        }

        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Wait for iframe to fully load including images
        await new Promise<void>((resolve, reject) => {
          const checkLoaded = () => {
            try {
              const images = iframeDoc.images;
              let loadedCount = 0;
              const totalImages = images.length;

              if (totalImages === 0) {
                resolve();
                return;
              }

              for (let i = 0; i < totalImages; i++) {
                if (images[i].complete) {
                  loadedCount++;
                } else {
                  images[i].onload = () => {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                      resolve();
                    }
                  };
                  images[i].onerror = () => {
                    loadedCount++; // Count as loaded even if error
                    if (loadedCount === totalImages) {
                      resolve();
                    }
                  };
                }
              }

              if (loadedCount === totalImages) {
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          };

          iframe.onload = () => {
            setTimeout(checkLoaded, 100);
          };

          // Fallback timeout
          setTimeout(() => {
            resolve();
          }, 2000);
        });

        // Wait a bit more to ensure everything is rendered
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (!iframeDoc.body) {
          throw new Error("Failed to load HTML content");
        }

        // Generate PDF using jsPDF
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        // Get the HTML element
        const element = iframeDoc.body;

        // Convert to canvas
        const canvas = await html2canvas(element, {
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 15000, // Increase timeout for images
          removeContainer: true,
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
        window.document.body.removeChild(iframe);

        // Generate blob
        const pdfBlob = pdf.output("blob");
        resolve(pdfBlob);
      } catch (error) {
        console.error("Error generating PDF:", error);
        reject(error);
      }
    });
  }

  // Quotation PDF methods
  static async generateQuotationPDF(
    quotation: QuotationWithRelations,
    companyInfo: CompanyInfo | null,
    options: PDFGeneratorOptions,
  ): Promise<Blob> {
    try {
      const htmlContent = QuotationReportGenerator.generateQuotationReportHTML(
        quotation,
        companyInfo || undefined,
        {
          combineServices: options.combineServices,
          hideItemPrices: options.hideItemPrices,
        },
      );

      return await this.generatePDFFromHTML(
        htmlContent,
        "quotation",
        quotation.quotationNumber,
      );
    } catch (error) {
      console.error("Error generating quotation PDF:", error);
      throw error;
    }
  }

  // Invoice PDF methods
  static async generateInvoicePDF(
    invoice: InvoiceProps,
    companyInfo: CompanyInfo | null,
    options: PDFGeneratorOptions,
  ): Promise<Blob> {
    try {
      const htmlContent = InvoiceReportGenerator.generateInvoiceReportHTML(
        invoice,
        companyInfo || undefined,
        options.combineServices,
      );

      return await this.generatePDFFromHTML(
        htmlContent,
        "invoice",
        invoice.invoiceNumber,
      );
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      throw error;
    }
  }

  // Maintenance PDF methods
  static async generateMaintenancePDF(
    maintenance: any,
    companyInfo: CompanyInfo | null,
    options: PDFGeneratorOptions,
  ): Promise<Blob> {
    try {
      const htmlContent = MaintenanceReportGenerator.generateReportHTML(
        maintenance,
        companyInfo || undefined,
      );

      return await this.generatePDFFromHTML(
        htmlContent,
        "maintenance",
        maintenance.id.slice(-8).toUpperCase(),
      );
    } catch (error) {
      console.error("Error generating maintenance PDF:", error);
      throw error;
    }
  }

  // Generic download method
  static async downloadPDF(
    document: QuotationWithRelations | InvoiceProps,
    companyInfo: CompanyInfo | null,
    options: PDFGeneratorOptions,
  ): Promise<void> {
    try {
      let pdfBlob: Blob;
      let filename: string;

      if ("quotationNumber" in document) {
        // It's a quotation
        pdfBlob = await this.generateQuotationPDF(
          document as QuotationWithRelations,
          companyInfo,
          options,
        );
        filename = `Quotation-${(document as QuotationWithRelations).quotationNumber}.pdf`;
      } else {
        // It's an invoice
        pdfBlob = await this.generateInvoicePDF(
          document as InvoiceProps,
          companyInfo,
          options,
        );
        filename = `Invoice-${(document as InvoiceProps).invoiceNumber}.pdf`;
      }

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = filename;
      window.document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      throw error;
    }
  }

  // Specific download methods
  static async downloadQuotationPDF(
    quotation: QuotationWithRelations,
    companyInfo: CompanyInfo | null,
    options: PDFGeneratorOptions,
  ): Promise<void> {
    try {
      const pdfBlob = await this.generateQuotationPDF(
        quotation,
        companyInfo,
        options,
      );

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `Quotation-${quotation.quotationNumber}.pdf`;
      window.document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error downloading quotation PDF:", error);
      throw error;
    }
  }

  static async downloadInvoicePDF(
    invoice: InvoiceProps,
    companyInfo: CompanyInfo | null,
    options: PDFGeneratorOptions,
  ): Promise<void> {
    try {
      const pdfBlob = await this.generateInvoicePDF(
        invoice,
        companyInfo,
        options,
      );

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      window.document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error downloading invoice PDF:", error);
      throw error;
    }
  }

  static async downloadMaintenancePDF(
    maintenance: any,
    companyInfo: CompanyInfo | null,
    options: PDFGeneratorOptions,
  ): Promise<void> {
    try {
      const pdfBlob = await this.generateMaintenancePDF(
        maintenance,
        companyInfo,
        options,
      );

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `Maintenance-${maintenance.id.slice(-8).toUpperCase()}.pdf`;
      window.document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error downloading maintenance PDF:", error);
      throw error;
    }
  }

  // Print methods
  static async printPDF(
    document: QuotationWithRelations | InvoiceProps,
    companyInfo: CompanyInfo | null,
    options: PDFGeneratorOptions,
  ): Promise<void> {
    try {
      let pdfBlob: Blob;

      if ("quotationNumber" in document) {
        pdfBlob = await this.generateQuotationPDF(
          document as QuotationWithRelations,
          companyInfo,
          options,
        );
      } else {
        pdfBlob = await this.generateInvoicePDF(
          document as InvoiceProps,
          companyInfo,
          options,
        );
      }

      // Create blob URL
      const url = window.URL.createObjectURL(pdfBlob);

      // Create hidden iframe
      const iframe = window.document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.width = "1px";
      iframe.style.height = "1px";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";

      // Set source to PDF blob
      iframe.src = url;

      window.document.body.appendChild(iframe);

      // Wait for iframe to load
      iframe.onload = () => {
        setTimeout(() => {
          try {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            }
          } catch (printError) {
            console.error("Error triggering print:", printError);
          }

          // Cleanup after a delay (enough time for print dialog to initialize)
          setTimeout(() => {
            if (window.document.body.contains(iframe)) {
              window.document.body.removeChild(iframe);
            }
            window.URL.revokeObjectURL(url);
          }, 3000);
        }, 500); // 500ms delay to ensure PDF rendering
      };
    } catch (error) {
      console.error("Error printing PDF:", error);
      throw error;
    }
  }

  static async printInvoicePDF(
    invoice: InvoiceProps,
    companyInfo: CompanyInfo | null,
    options: PDFGeneratorOptions,
  ): Promise<void> {
    await this.printPDF(invoice, companyInfo, options);
  }

  static async printQuotationPDF(
    quotation: QuotationWithRelations,
    companyInfo: CompanyInfo | null,
    options: PDFGeneratorOptions,
  ): Promise<void> {
    await this.printPDF(quotation, companyInfo, options);
  }
}
