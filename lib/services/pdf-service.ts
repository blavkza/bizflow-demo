// lib/pdf-service.ts
import puppeteer from "puppeteer";
import { InvoiceProps } from "@/types/invoice";
import { InvoiceReportGenerator } from "../invoiceReportGenerator";

export class PDFService {
  static async generateInvoicePDF(
    invoice: InvoiceProps,
    companyInfo?: any
  ): Promise<Buffer> {
    let browser;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        console.log(
          `Attempt ${retryCount + 1} to generate PDF for invoice: ${invoice.invoiceNumber}`
        );

        // Launch browser with stable configuration
        browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
          ],
          timeout: 30000,
        });

        const page = await browser.newPage();

        // Set longer timeouts
        page.setDefaultNavigationTimeout(30000);
        page.setDefaultTimeout(30000);

        // Generate HTML content
        const htmlContent = InvoiceReportGenerator.generateInvoiceReportHTML(
          invoice,
          companyInfo
        );

        // Validate HTML content
        if (!htmlContent || htmlContent.length === 0) {
          throw new Error("Generated HTML content is empty");
        }

        console.log(`HTML content length: ${htmlContent.length} characters`);

        // Set content with simpler wait condition
        await page.setContent(htmlContent, {
          waitUntil: "load", // Use 'load' instead of 'networkidle0'
          timeout: 30000,
        });

        // Wait using the correct method - use waitForTimeout or waitForFunction
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("Generating PDF...");

        // Generate PDF
        const pdfUint8Array = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "0.5in",
            right: "0.5in",
            bottom: "0.5in",
            left: "0.5in",
          },
          timeout: 30000,
        });

        // Validate PDF
        if (!pdfUint8Array || pdfUint8Array.length === 0) {
          throw new Error("Generated PDF is empty");
        }

        // Convert to Buffer
        const pdfBuffer = Buffer.from(pdfUint8Array);

        console.log(
          `PDF generated successfully, size: ${pdfBuffer.length} bytes`
        );

        await browser.close();
        return pdfBuffer;
      } catch (error) {
        console.error(
          `PDF generation attempt ${retryCount + 1} failed:`,
          error
        );

        // Close browser if it exists
        if (browser) {
          try {
            await browser.close();
          } catch (closeError) {
            console.error("Error closing browser:", closeError);
          }
        }

        retryCount++;

        if (retryCount > maxRetries) {
          throw new Error(
            `Failed to generate PDF after ${maxRetries + 1} attempts: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    throw new Error("PDF generation failed after all retries");
  }

  // Simple HTML fallback method
  static generateHTMLFallback(
    invoice: InvoiceProps,
    companyInfo?: any
  ): Buffer {
    const htmlContent = InvoiceReportGenerator.generateInvoiceReportHTML(
      invoice,
      companyInfo
    );
    return Buffer.from(htmlContent, "utf-8");
  }
}
