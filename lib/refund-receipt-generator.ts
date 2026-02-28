// app/lib/refund-receipt-generator.ts

interface CompanyInfo {
  companyName: string;
  address: string;
  city: string;
  province: string;
  postCode: string;
  phone: string;
  email: string;
  taxId?: string;
  logo?: string;
}

export interface RefundItem {
  id: string;
  refundItemId: string;
  quantity: number;
  price: number;
  total: number;
  taxAmount: number;
  saleItem?: {
    ShopProduct?: {
      name: string;
      sku: string;
    };
  };
  product?: {
    name: string;
    sku: string;
  };
  originalQuantity?: number;
  refundReason?: string;
}

export interface RefundReceiptCompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
  logo?: string;
}

export interface RefundReceiptData {
  id: string;
  refundNumber: string;
  saleNumber: string;
  date: string;
  approvedDate?: string;
  processedDate?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: RefundItem[];
  subtotal: number;
  tax: number;
  taxPercent: number;
  total: number;
  refundMethod: string;
  refundReason: string;
  rejectionReason?: string;
  company: RefundReceiptCompanyInfo;
  processedBy?: string;
  approvedBy?: string;
  requestedBy?: string;
  originalSaleTotal?: number;
  balanceAfterRefund?: number;
  status: string;
}

export type RefundReceiptSize = "A4" | "thermal";

// Map refund method keys to display names
const refundMethodMap: Record<string, string> = {
  ORIGINAL_METHOD: "Original Method",
  CASH: "Cash",
  CREDIT_CARD: "Credit Card",
  BANK_TRANSFER: "Bank Transfer",
  STORE_CREDIT: "Store Credit",
};

class RefundReceiptGenerator {
  private companyInfo: RefundReceiptCompanyInfo = {
    name: "Your Company",
    address: "123 Business St",
    phone: "(123) 456-7890",
    email: "info@company.com",
    taxNumber: "VAT123456",
  };

  private readonly DEFAULT_TAX_RATE = 0.15; // 15% VAT for South Africa

  // Convert from your CompanyInfo to RefundReceiptCompanyInfo format
  setCompanyInfo(companyInfo: CompanyInfo | null) {
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

  private formatAddress(companyInfo: CompanyInfo): string {
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

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleString();
      }
      return date.toLocaleString();
    } catch (error) {
      return new Date().toLocaleString();
    }
  }

  private getItemName(item: any): string {
    // Check the nested structure for product name
    if (item.saleItem?.ShopProduct?.name) {
      return item.saleItem.ShopProduct.name;
    }
    if (item.product?.name) {
      return item.product.name;
    }
    return "Product";
  }

  private getItemSKU(item: any): string {
    // Check the nested structure for product SKU
    if (item.saleItem?.ShopProduct?.sku) {
      return item.saleItem.ShopProduct.sku;
    }
    if (item.product?.sku) {
      return item.product.sku;
    }
    return "N/A";
  }

  // Helper function to calculate tax from total
  private calculateTaxFromTotal(
    total: number,
    taxRate: number = this.DEFAULT_TAX_RATE,
  ): {
    taxAmount: number;
    subtotalBeforeTax: number;
  } {
    const subtotalBeforeTax = total / (1 + taxRate);
    const taxAmount = total - subtotalBeforeTax;

    return {
      taxAmount: Number(taxAmount.toFixed(2)),
      subtotalBeforeTax: Number(subtotalBeforeTax.toFixed(2)),
    };
  }

  // Simplified method - product details are already in the structure
  async fetchProductDetails(refundItems: any[]): Promise<RefundItem[]> {
    return refundItems.map((item) => ({
      ...item,
      product: {
        name: item.saleItem?.ShopProduct?.name || "Product",
        sku: item.saleItem?.ShopProduct?.sku || "N/A",
      },
    }));
  }

  async generateRefundReceiptHTML(
    refundData: any,
    size: RefundReceiptSize = "thermal",
    includePrintButton: boolean = true,
  ): Promise<string> {
    // No need to fetch product details since they're already in the structure
    // Calculate tax from total if not provided
    const taxRate = this.DEFAULT_TAX_RATE;

    let taxAmount = refundData.taxAmount || 0;
    let subtotalBeforeTax = refundData.amount - taxAmount;

    // If tax amount is 0 but we have a total, calculate it
    if (taxAmount === 0 && refundData.amount > 0) {
      const calculated = this.calculateTaxFromTotal(refundData.amount, taxRate);
      taxAmount = calculated.taxAmount;
      subtotalBeforeTax = calculated.subtotalBeforeTax;
    }

    const safeData: RefundReceiptData = {
      id: refundData.id,
      refundNumber: refundData.refundNumber,
      saleNumber: refundData.sale?.saleNumber || "N/A",
      date: refundData.createdAt,
      approvedDate: refundData.approvedAt,
      processedDate: refundData.processedAt,
      customerName: refundData.sale?.customerName,
      customerPhone: refundData.sale?.customerPhone,
      customerEmail: refundData.sale?.customerEmail,
      items: (refundData.items || []).map((item: any) => ({
        ...item,
        // Extract product info from nested structure
        product: {
          name: item.saleItem?.ShopProduct?.name || "Product",
          sku: item.saleItem?.ShopProduct?.sku || "N/A",
        },
        subtotal: item.price * item.quantity,
      })),
      subtotal: subtotalBeforeTax,
      tax: taxAmount,
      taxPercent: taxRate * 100,
      total: refundData.amount || 0,
      refundMethod: refundMethodMap[refundData.method] || refundData.method,
      refundReason: refundData.reason,
      rejectionReason: refundData.rejectionReason,
      company: this.companyInfo,
      processedBy: refundData.processedBy,
      approvedBy: refundData.approvedBy,
      requestedBy: refundData.requestedBy,
      originalSaleTotal: refundData.sale?.total,
      balanceAfterRefund: refundData.sale?.total
        ? refundData.sale.total - refundData.amount
        : undefined,
      status: refundData.status,
    };

    if (size === "A4") {
      return this.generateA4RefundReceipt(safeData, includePrintButton);
    }
    return this.generateThermalRefundReceipt(safeData, includePrintButton);
  }

  async generateRefundReceiptForEmail(refundData: any): Promise<string> {
    // Calculate tax from total if not provided
    const taxRate = this.DEFAULT_TAX_RATE;

    let taxAmount = refundData.taxAmount || 0;
    let subtotalBeforeTax = refundData.amount - taxAmount;

    // If tax amount is 0 but we have a total, calculate it
    if (taxAmount === 0 && refundData.amount > 0) {
      const calculated = this.calculateTaxFromTotal(refundData.amount, taxRate);
      taxAmount = calculated.taxAmount;
      subtotalBeforeTax = calculated.subtotalBeforeTax;
    }

    const safeData: RefundReceiptData = {
      id: refundData.id,
      refundNumber: refundData.refundNumber,
      saleNumber: refundData.sale?.saleNumber || "N/A",
      date: refundData.createdAt,
      approvedDate: refundData.approvedAt,
      processedDate: refundData.processedAt,
      customerName: refundData.sale?.customerName,
      customerPhone: refundData.sale?.customerPhone,
      customerEmail: refundData.sale?.customerEmail,
      items: (refundData.items || []).map((item: any) => ({
        ...item,
        product: {
          name: item.saleItem?.ShopProduct?.name || "Product",
          sku: item.saleItem?.ShopProduct?.sku || "N/A",
        },
        subtotal: item.price * item.quantity,
      })),
      subtotal: subtotalBeforeTax,
      tax: taxAmount,
      taxPercent: taxRate * 100,
      total: refundData.amount || 0,
      refundMethod: refundMethodMap[refundData.method] || refundData.method,
      refundReason: refundData.reason,
      rejectionReason: refundData.rejectionReason,
      company: this.companyInfo,
      processedBy: refundData.processedBy,
      approvedBy: refundData.approvedBy,
      requestedBy: refundData.requestedBy,
      originalSaleTotal: refundData.sale?.total,
      balanceAfterRefund: refundData.sale?.total
        ? refundData.sale.total - refundData.amount
        : undefined,
      status: refundData.status,
    };

    return `
        <div style="margin: 20px 0;">
          ${
            this.companyInfo.logo
              ? `
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${this.companyInfo.logo}" alt="${this.companyInfo.name}" 
                   style="max-height: 100px; max-width: 300px; object-fit: contain;">
            </div>
          `
              : ""
          }
          
          <h2 style="text-align: center; color: #333; margin-bottom: 10px;">${this.companyInfo.name}</h2>
          <div style="text-align: center; color: #666; margin-bottom: 20px;">
            ${this.companyInfo.address}<br>
            Tel: ${this.companyInfo.phone} | Email: ${this.companyInfo.email}<br>
            ${this.companyInfo.taxNumber ? `VAT: ${this.companyInfo.taxNumber}` : ""}
          </div>
  
          <h3 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
            REFUND RECEIPT: ${safeData.refundNumber}
          </h3>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <div><strong>Date:</strong> ${this.formatDate(safeData.date)}</div>
            <div><strong>Original Sale:</strong> ${safeData.saleNumber}</div>
            ${safeData.customerName ? `<div><strong>Customer:</strong> ${safeData.customerName}</div>` : ""}
            ${safeData.customerPhone ? `<div><strong>Phone:</strong> ${safeData.customerPhone}</div>` : ""}
            ${safeData.requestedBy ? `<div><strong>Requested by:</strong> ${safeData.requestedBy}</div>` : ""}
            ${safeData.processedBy ? `<div><strong>Processed by:</strong> ${safeData.processedBy}</div>` : ""}
            <div><strong>Status:</strong> ${safeData.status}</div>
            <div><strong>Refund Method:</strong> ${safeData.refundMethod}</div>
          </div>
  
          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <div><strong>Refund Reason:</strong></div>
            <div>${safeData.refundReason}</div>
          </div>
  
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #333; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd; width: 45%;">Item</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd; width: 15%;">SKU</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #ddd; width: 10%;">Qty</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #ddd; width: 15%;">Price</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #ddd; width: 15%;">Refund Amount</th>
              </tr>
            </thead>
            <tbody>
              ${safeData.items
                .map(
                  (item) => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top;">
                    <div style="font-weight: bold; word-wrap: break-word; white-space: normal;">
                      ${this.getItemName(item)}
                    </div>
                  </td>
                  <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top;">${this.getItemSKU(item)}</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #ddd; vertical-align: top;">${item.quantity}</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #ddd; vertical-align: top;">R${this.formatNumber(item.price)}</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #ddd; vertical-align: top;">R${this.formatNumber(item.total)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
  
          <div style="float: right; width: 300px;">
            <div style="space-y: 2 text-sm;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
                <span>Subtotal:</span>
                <span>R${this.formatNumber(safeData.subtotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
                <span>VAT (${this.formatNumber(safeData.taxPercent, 0)}%):</span>
                <span>R${this.formatNumber(safeData.tax)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #333; font-weight: bold; font-size: 18px;">
                <span>Total Refund:</span>
                <span style="color: #ef4444;">R${this.formatNumber(safeData.total)}</span>
              </div>
            </div>
          </div>
  
          ${
            safeData.originalSaleTotal
              ? `
          <div style="clear: both; margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 5px;">
            <div><strong>Original Sale Total:</strong> R${this.formatNumber(safeData.originalSaleTotal)}</div>
            <div><strong>Refund Amount:</strong> R${this.formatNumber(safeData.total)}</div>
            <div><strong>Balance After Refund:</strong> R${this.formatNumber(safeData.balanceAfterRefund || 0)}</div>
          </div>
          `
              : ""
          }
  
          <div style="clear: both; margin-top: 30px; padding-top: 20px; border-top: 2px solid #333; text-align: center;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Refund Processed</div>
            <div style="color: #666;">For any queries, please contact us at ${this.companyInfo.phone}</div>
          </div>
        </div>
      `;
  }

  private generateThermalRefundReceipt(
    data: RefundReceiptData,
    includePrintButton: boolean = true,
  ): string {
    const hasLogo = data.company.logo;

    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt ${data.refundNumber}</title>
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
              font-size: 12px;
              line-height: 1.2;
            }
            .print-button {
              display: ${includePrintButton ? "block" : "none"};
              width: 100%;
              background-color: #007bff;
              color: white;
              border: none;
              padding: 12px;
              font-size: 14px;
              font-weight: bold;
              border-radius: 5px;
              cursor: pointer;
              margin-bottom: 10px;
              text-align: center;
            }
            .print-button:hover {
              background-color: #0056b3;
            }
            .print-button:active {
              background-color: #004085;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 3px 0; }
            .item-row { margin: 3px 0; }
            .item-name { 
              font-weight: bold; 
              word-wrap: break-word;
              white-space: normal;
              margin-bottom: 1px;
            }
            .item-details { 
              font-size: 10px; 
              color: #666;
              display: flex;
              justify-content: space-between;
            }
            .total-row { font-weight: bold; font-size: 14px; }
            .header { margin-bottom: 8px; }
            .footer { margin-top: 8px; font-size: 10px; }
            .text-small { font-size: 10px; }
            .logo { 
              max-width: 100%; 
              height: auto; 
              margin-bottom: 5px;
              max-height: 50px;
            }
            .awaiting-stock { 
              color: #dc2626; 
              font-style: italic; 
              font-size: 9px;
              margin-top: 1px;
            }
            .column-layout {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .item-container {
              margin-bottom: 4px;
              padding-bottom: 2px;
            }
          </style>
          <script>
            function printReceipt() {
              window.print();
            }
          </script>
        </head>
        <body>
          ${
            includePrintButton
              ? `
          <button class="print-button" onclick="printReceipt()">
            🖨️ Print Receipt
          </button>
          `
              : ""
          }
          
          <div class="header center">
            ${hasLogo ? `<img src="${data.company.logo}" alt="${data.company.name}" class="logo">` : ""}
            <div class="bold" style="font-size: 14px;">${data.company.name}</div>
            <div class="text-small">${data.company.address}</div>
            <div class="text-small">Tel: ${data.company.phone}</div>
            ${data.company.taxNumber ? `<div class="text-small">VAT: ${data.company.taxNumber}</div>` : ""}
          </div>
          
          <div class="line"></div>
          
          <div class="center">
            <div class="bold">REFUND RECEIPT</div>
            <div>${data.refundNumber}</div>
            <div class="text-small">${this.formatDate(data.date)}</div>
            <div class="text-small">For Sale: ${data.saleNumber}</div>
          </div>
          
          <div class="line"></div>
          
          <div class="text-small">
            ${data.customerName ? `<div>Customer: ${data.customerName}</div>` : ""}
            ${data.customerPhone ? `<div>Phone: ${data.customerPhone}</div>` : ""}
            ${data.requestedBy ? `<div>Requested by: ${data.requestedBy}</div>` : ""}
            ${data.processedBy ? `<div>Processed by: ${data.processedBy}</div>` : ""}
            <div>Method: ${data.refundMethod}</div>
            <div>Status: ${data.status}</div>
          </div>
          
          <div class="line"></div>
          
          <div class="text-small">
            <div class="bold">Refund Reason:</div>
            <div>${data.refundReason}</div>
          </div>
          
          <div class="line"></div>
          
          <div>
            ${data.items
              .map(
                (item) => `
              <div class="item-container">
                <div class="item-name">${this.getItemName(item)}</div>
                <div class="item-details">
                  <div>SKU: ${this.getItemSKU(item)}</div>
                  <div>${item.quantity} x R${this.formatNumber(item.price)}</div>
                </div>
                <div class="item-details">
                  <div></div>
                  <div>R${this.formatNumber(item.total)}</div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="line"></div>
          
          <div>
            <div class="column-layout">
              <div>Subtotal:</div>
              <div>R${this.formatNumber(data.subtotal)}</div>
            </div>
            <div class="column-layout">
              <div>VAT (${this.formatNumber(data.taxPercent, 0)}%):</div>
              <div>R${this.formatNumber(data.tax)}</div>
            </div>
          </div>
          
          <div class="line"></div>
          
          <div class="column-layout total-row" style="color: #ef4444;">
            <div>TOTAL REFUND:</div>
            <div>R${this.formatNumber(data.total)}</div>
          </div>
          
          ${
            data.originalSaleTotal
              ? `
            <div class="line"></div>
            <div class="text-small">
              <div class="column-layout">
                <div>Original Total:</div>
                <div>R${this.formatNumber(data.originalSaleTotal)}</div>
              </div>
              <div class="column-layout">
                <div>Balance:</div>
                <div>R${this.formatNumber(data.balanceAfterRefund || 0)}</div>
              </div>
            </div>
          `
              : ""
          }
          
          <div class="line"></div>
          
          <div class="footer center">
            <div>Refund processed successfully</div>
            <div>Please contact us for any queries</div>
          </div>
        </body>
        </html>
      `;
  }

  private generateA4RefundReceipt(
    data: RefundReceiptData,
    includePrintButton: boolean = true,
  ): string {
    const hasLogo = data.company.logo;

    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt ${data.refundNumber}</title>
          <style>
            @media print {
              @page { margin: 20mm; size: A4; }
              body { margin: 0 auto; max-width: 100%; }
              .print-button { display: none !important; }
            }
            body { 
              font-family: Arial, sans-serif; 
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
            }
            .print-button {
              display: ${includePrintButton ? "block" : "none"};
              width: 100%;
              background-color: #007bff;
              color: white;
              border: none;
              padding: 15px;
              font-size: 16px;
              font-weight: bold;
              border-radius: 5px;
              cursor: pointer;
              margin-bottom: 20px;
              text-align: center;
            }
            .print-button:hover {
              background-color: #0056b3;
            }
            .print-button:active {
              background-color: #004085;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px;
            }
            .receipt-title {
              font-size: 20px;
              font-weight: bold;
              margin: 20px 0;
            }
            .info-section {
              margin: 20px 0;
              padding: 15px;
              background: #f5f5f5;
              border-radius: 5px;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
            }
            .items-table th, .items-table td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
              vertical-align: top;
            }
            .items-table th { 
              background-color: #333; 
              color: white;
              font-weight: bold;
            }
            .items-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .product-name {
              word-wrap: break-word;
              white-space: normal;
              max-width: 200px;
            }
            .totals { 
              margin-top: 20px;
              float: right;
              width: 300px;
            }
            .totals-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 8px 0;
              border-bottom: 1px solid #ddd;
            }
            .total-row { 
              font-weight: bold; 
              font-size: 18px;
              border-top: 2px solid #333;
              border-bottom: 2px solid #333;
              margin-top: 10px;
              padding-top: 10px;
            }
            .footer {
              clear: both;
              margin-top: 50px;
              text-align: center;
              padding-top: 20px;
              border-top: 2px solid #333;
            }
            .payment-info {
              margin: 20px 0;
              padding: 15px;
              background: #e8f5e9;
              border-radius: 5px;
            }
            .awaiting-stock-note {
              background: #fef3c7;
              border: 1px solid #fbbf24;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
            }
            .logo {
              max-height: 100px;
              max-width: 300px;
              margin-bottom: 10px;
              object-fit: contain;
            }
          </style>
          <script>
            function printReceipt() {
              window.print();
            }
          </script>
        </head>
        <body>
          ${
            includePrintButton
              ? `
          <button class="print-button" onclick="printReceipt()">
            🖨️ Print Receipt
          </button>
          `
              : ""
          }
          
          <div class="header">
            ${hasLogo ? `<img src="${data.company.logo}" alt="${data.company.name}" class="logo">` : ""}
            <div class="company-name">${data.company.name}</div>
            <div>${data.company.address}</div>
            <div>Tel: ${data.company.phone} | Email: ${data.company.email}</div>
            ${data.company.taxNumber ? `<div>VAT Number: ${data.company.taxNumber}</div>` : ""}
          </div>
  
          <div class="receipt-title">REFUND RECEIPT</div>
          
          <div class="info-section">
            <div><strong>Receipt Number:</strong> ${data.refundNumber}</div>
            <div><strong>Original Sale:</strong> ${data.saleNumber}</div>
            <div><strong>Date:</strong> ${this.formatDate(data.date)}</div>
            ${data.customerName ? `<div><strong>Customer:</strong> ${data.customerName}</div>` : ""}
            ${data.customerPhone ? `<div><strong>Phone:</strong> ${data.customerPhone}</div>` : ""}
            ${data.requestedBy ? `<div><strong>Requested by:</strong> ${data.requestedBy}</div>` : ""}
            ${data.processedBy ? `<div><strong>Processed by:</strong> ${data.processedBy}</div>` : ""}
            <div><strong>Status:</strong> ${data.status}</div>
            <div><strong>Refund Method:</strong> ${data.refundMethod}</div>
          </div>
  
          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <div><strong>Refund Reason:</strong></div>
            <div>${data.refundReason}</div>
          </div>
  
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 35%;">Item</th>
                <th style="width: 15%;">SKU</th>
                <th style="width: 10%; text-align: right;">Qty</th>
                <th style="width: 20%; text-align: right;">Price</th>
                <th style="width: 20%; text-align: right;">Refund Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.items
                .map(
                  (item) => `
                <tr>
                  <td class="product-name">
                    ${this.getItemName(item)}
                  </td>
                  <td>${this.getItemSKU(item)}</td>
                  <td style="text-align: right;">${item.quantity}</td>
                  <td style="text-align: right;">R${this.formatNumber(item.price)}</td>
                  <td style="text-align: right;">R${this.formatNumber(item.total)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
  
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>R${this.formatNumber(data.subtotal)}</span>
            </div>
            <div class="totals-row">
              <span>VAT (${this.formatNumber(data.taxPercent, 0)}%):</span>
              <span>R${this.formatNumber(data.tax)}</span>
            </div>
            <div class="totals-row total-row" style="color: #ef4444;">
              <span>Total Refund:</span>
              <span>R${this.formatNumber(data.total)}</span>
            </div>
          </div>
  
          ${
            data.originalSaleTotal
              ? `
          <div class="payment-info">
            <div><strong>Original Sale Total:</strong> R${this.formatNumber(data.originalSaleTotal)}</div>
            <div><strong>Refund Amount:</strong> R${this.formatNumber(data.total)}</div>
            <div><strong>Balance After Refund:</strong> R${this.formatNumber(data.balanceAfterRefund || 0)}</div>
          </div>
          `
              : ""
          }
  
          <div class="footer">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Refund Processed Successfully</div>
            <div>For any queries, please contact us at ${data.company.phone} or ${data.company.email}</div>
          </div>
        </body>
        </html>
      `;
  }

  async generateRefundReceiptPDF(
    refundData: any,
    size: RefundReceiptSize = "thermal",
  ): Promise<Blob> {
    const htmlContent = await this.generateRefundReceiptHTML(
      refundData,
      size,
      false,
    );
    const blob = new Blob([htmlContent], { type: "text/html" });
    return blob;
  }

  async downloadRefundReceipt(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async printRefundReceipt(
    refundData: any,
    size: RefundReceiptSize = "thermal",
  ): Promise<void> {
    const htmlContent = await this.generateRefundReceiptHTML(
      refundData,
      size,
      true,
    );
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    }
  }
}

export const refundReceiptGenerator = new RefundReceiptGenerator();
