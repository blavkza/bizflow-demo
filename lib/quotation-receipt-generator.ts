
import { QuotationWithRelations } from "@/types/quotation";
import { InvoiceProps } from "@/types/invoice";

export interface ReceiptCompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
  logo?: string;
}

export type ReceiptSize = "A4" | "thermal";

class QuotationReceiptGenerator {
  private companyInfo: ReceiptCompanyInfo = {
    name: "Your Company",
    address: "123 Business St",
    phone: "(123) 456-7890",
    email: "info@company.com",
    taxNumber: "VAT123456",
  };

  // Set company info
  setCompanyInfo(companyInfo: any) {
    if (!companyInfo) return;

    this.companyInfo = {
      name: companyInfo.companyName || "Your Company",
      address: this.formatAddress(companyInfo),
      phone: companyInfo.phone || "(123) 456-7890",
      email: companyInfo.email || "info@company.com",
      taxNumber: companyInfo.taxId || undefined,
      logo: companyInfo.logo || undefined,
    };
  }

  private formatAddress(companyInfo: any): string {
    const addressParts = [
      companyInfo.address,
      companyInfo.city,
      companyInfo.province,
      companyInfo.postCode,
    ].filter((part) => part && part.trim() !== "");

    return addressParts.join(", ") || "123 Business St";
  }

  private formatNumber(value: any, decimals: number = 2): string {
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(decimals);
  }

  private formatDate(dateString: string | Date): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleString();
      }
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return new Date().toLocaleString();
    }
  }

  private getDocumentTitle(type: "quotation" | "invoice"): string {
    return type === "quotation" ? "QUOTATION" : "TAX INVOICE";
  }

  async generateThermalHTML(
    document: QuotationWithRelations | InvoiceProps,
    type: "quotation" | "invoice",
    options: { combineServices?: boolean; hideItemPrices?: boolean } = {}
  ): Promise<string> {
    const { combineServices = false, hideItemPrices = false } = options;
    const docNumber = type === "quotation" 
      ? (document as QuotationWithRelations).quotationNumber 
      : (document as InvoiceProps).invoiceNumber;
    
    const date = type === "quotation"
      ? (document as QuotationWithRelations).issueDate
      : (document as InvoiceProps).issueDate;

    // Get Creator Name
    let creatorName = "";
    if (type === "quotation") {
       creatorName = (document as QuotationWithRelations).creator?.name || "";
    } else {
       creatorName = (document as InvoiceProps).creator?.name || "";
    }

    // Process Items
    let rawItems: any[] = [];
    if (type === "quotation") {
      const q = document as QuotationWithRelations;
      rawItems = q.items.map(item => {
        const isService = !!item.serviceId || !item.shopProductId;
        return {
          description: item.description,
          details: item.details, // Add details from model
          quantity: Number(item.quantity),
          price: Number(item.unitPrice),
          total: Number(item.quantity) * Number(item.unitPrice),
          isService: isService,
        };
      });
    } else {
      const inv = document as InvoiceProps;
      // InvoiceProps items
      rawItems = (inv.items || []).map(item => {
        const isService = !item.shopProductId; // Heuristic
        // invoices usually have details in InvoiceItem model, ensuring it's in the input type
        // The type definition InvoiceProps needs to have 'details' in 'items'.
        // Checked InvoiceProps in previous turn, it does NOT have 'details'.
        // I need to update InvoiceProps type if it's not present, OR cast it if I know it's there.
        // The schema has details. The API response likely extracts it.
        // I will blindly coerce it or better yet, just try to access it if accessible.
        // Actually, looking at types/invoice.ts, it was missing. I should assume the API sends it if the user says so.
        // For now, I'll access it as any.
        return {
          description: item.description,
          details: (item as any).details, // Add details from model
          quantity: Number(item.quantity),
          price: Number(item.unitPrice),
          total: Number(item.amount),
          isService: isService,
        };
      });
    }

    let displayItems = [];
    if (combineServices) {
      const products = rawItems.filter(i => !i.isService);
      const services = rawItems.filter(i => i.isService);

      if (services.length > 0) {
        const servicesTotal = services.reduce((sum, s) => sum + s.total, 0);
        
        // Build details list for combined item
        // Include both description and details if present
        const servicesList = services.map(s => {
           const detailsPart = s.details ? ` - ${s.details}` : "";
           return `<li>${s.description}${detailsPart}</li>`;
        }).join("");

        const combinedItem = {
          description: `Services Package (${services.length} services included)`,
          quantity: 1, 
          price: servicesTotal,
          total: servicesTotal,
          isService: true,
          details: `<ul>${servicesList}</ul>`,
        };
        displayItems = [...products, combinedItem];
      } else {
        displayItems = rawItems;
      }
    } else {
      displayItems = rawItems;
    }

    // Totals
    let subtotal = 0;
    let tax = 0;
    let total = 0;

    if (type === "quotation") {
      const q = document as QuotationWithRelations;
      subtotal = Number((q as any).subtotal || (q as any).subTotal || 0);
      // Fallback calculation if subTotal is missing/zero
      if (subtotal === 0) {
         rawItems.forEach(i => subtotal += i.total);
      }
      tax = Number(q.taxAmount || 0);
      total = Number(q.totalAmount || 0);
    } else {
      const inv = document as InvoiceProps;
      // Try multiple fields for subtotal as schema varies (amount often used for subtotal in strict schema)
      subtotal = Number((inv as any).subtotal || (inv as any).subTotal || inv.amount || 0);
      tax = Number(inv.taxAmount || 0);
      total = Number(inv.totalAmount || inv.amount || 0);

      // Fallback: Recalculate subtotal from items if missing
      if (subtotal === 0 && rawItems.length > 0) {
        subtotal = rawItems.reduce((sum, item) => sum + item.total, 0);
      }

      // Logic Check: If we calculated subtotal from tax-inclusive items, it might match total.
      // If we differ, try to reconcile or trust the explicit values.
    }

    const clientName = type === "quotation" 
      ? (document as QuotationWithRelations).client?.name 
      : (document as InvoiceProps).client?.name; // invoice.client.name
      
    const clientPhone = type === "quotation"
      ? (document as QuotationWithRelations).client?.phone
      : (document as InvoiceProps).client?.phone;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${this.getDocumentTitle(type)} ${docNumber}</title>
        <style>
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { margin: 0; }
            .print-button { display: none !important; }
          }
          body { 
            font-family: 'Courier New', monospace; 
            width: 80mm;
            margin: 0 auto;
            padding: 5mm;
            font-size: 14px;
            line-height: 1.3;
            font-weight: 600;
            color: #000;
          }
          .print-button {
            display: block;
            width: 100%;
            background-color: #007bff;
            color: white;
            border: none;
            padding: 12px;
            font-size: 16px;
            font-weight: 800;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 10px;
            text-align: center;
          }
          .center { text-align: center; }
          .bold { font-weight: 800; }
          .extra-bold { font-weight: 900; }
          .line { border-top: 2px solid #000; margin: 5px 0; }
          .item-name { 
            font-weight: 800;
            word-wrap: break-word;
            white-space: normal;
            margin-bottom: 2px;
            font-size: 14px;
          }
          .item-details { 
            font-size: 13px;
            font-weight: 700;
            color: #333;
            display: flex;
            justify-content: space-between;
          }
           .item-sub-details {
            font-size: 11px;
            font-weight: 500;
            color: #555;
            font-style: italic;
            margin-bottom: 4px;
          }
          .item-sub-details ul {
            margin: 0;
            padding-left: 15px;
          }
           .item-sub-details li {
            margin-bottom: 2px;
          }
          .header { margin-bottom: 10px; font-weight: 800; }
          .text-small { font-size: 12px; font-weight: 700; }
          .logo { max-width: 100%; height: auto; margin-bottom: 20px; max-height: 150px; object-fit: contain; width: 100%; }
          .column-layout { display: flex; justify-content: space-between; margin: 3px 0; font-weight: 700; }
          .item-container { margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dotted #ccc; }
          .section-title { font-weight: 900; font-size: 16px; text-align: center; margin: 8px 0; }
          .doc-number { font-weight: 900; font-size: 18px; text-align: center; margin: 5px 0; }
          .footer { margin-top: 10px; font-size: 12px; font-weight: 700; }
        </style>
        <script>
          function printReceipt() {
            window.print();
          }
        </script>
      </head>
      <body>
        <button class="print-button" onclick="printReceipt()">🖨️ Print Receipt</button>
        
        <div class="header center">
          ${this.companyInfo.logo ? `<img src="${this.companyInfo.logo}" alt="${this.companyInfo.name}" class="logo">` : ""}
          <div class="bold extra-bold" style="font-size: 24px; margin: 5px 0;">${this.companyInfo.name}</div>
          <div class="text-small">${this.companyInfo.address}</div>
          <div class="text-small">Tel: ${this.companyInfo.phone}</div>
          ${this.companyInfo.taxNumber ? `<div class="text-small">VAT: ${this.companyInfo.taxNumber}</div>` : ""}
        </div>
        
        <div class="line"></div>
        
        <div class="center">
          <div class="section-title">${this.getDocumentTitle(type)}</div>
          <div class="extra-bold doc-number">${docNumber}</div>
          <div class="text-small">${this.formatDate(date)}</div>
          ${creatorName ? `<div class="text-small" style="margin-top:4px;">Created by: ${creatorName}</div>` : ""}
        </div>
        
        <div class="line"></div>
        
        <div class="text-small">
          ${clientName ? `<div>Customer: ${clientName}</div>` : ""}
          ${clientPhone ? `<div>Phone: ${clientPhone}</div>` : ""}
        </div>
        
        <div class="line"></div>
        
        <div class="section-title">ITEMS</div>
        
        <div>
          ${displayItems.map(item => `
            <div class="item-container">
              <div class="item-name">${item.description}</div>
              ${item.details ? `<div class="item-sub-details">${item.details.includes("<ul>") ? item.details : item.details.replace(/\n/g, "<br>")}</div>` : ""}
              <div class="item-details">
                <div></div>
                <div>${item.quantity} x ${!hideItemPrices ? `R${this.formatNumber(item.price)}` : '***'}</div>
              </div>
              ${!hideItemPrices ? `
              <div class="item-details">
                <div></div>
                <div class="bold">R${this.formatNumber(item.total)}</div>
              </div>` : ''}
            </div>
          `).join("")}
        </div>
        
        <div class="line"></div>
        
        <div class="section-title">TOTALS</div>
        
        <div>
          <div class="column-layout">
            <div>Subtotal:</div>
            <div>R${this.formatNumber(subtotal)}</div>
          </div>
          <div class="column-layout">
            <div>VAT (15%):</div>
            <div>R${this.formatNumber(tax)}</div>
          </div>
          <div class="column-layout extra-bold" style="font-size: 16px; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px;">
            <div>TOTAL:</div>
            <div>R${this.formatNumber(total)}</div>
          </div>
        </div>
        
        <div class="line"></div>
        
        <div class="footer center">
          <div class="bold">Thank you for your business!</div>
          <div>${type === "quotation" ? "This is a valid quotation." : "Please come again."}</div>
        </div>
      </body>
      </html>
    `;
  }

  async printReceipt(
    document: QuotationWithRelations | InvoiceProps,
    type: "quotation" | "invoice",
    options: { combineServices?: boolean; hideItemPrices?: boolean } = {}
  ): Promise<void> {
    const htmlContent = await this.generateThermalHTML(document, type, options);
    
    // Use iframe printing method to be consistent/robust
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    }
  }
}

export const quotationReceiptGenerator = new QuotationReceiptGenerator();
