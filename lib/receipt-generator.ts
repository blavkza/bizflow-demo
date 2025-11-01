export interface SaleItem {
  id: string;
  shopProductId: string;
  quantity: number;
  price: number;
  total: number;
  product?: {
    name: string;
    sku: string;
  };
}

export interface CompanyInfo {
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
}

export interface ReceiptCompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
}

export interface ReceiptData {
  id: string;
  saleNumber: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax: number;
  taxPercent: number;
  total: number;
  paymentMethod: string;
  amountReceived?: number;
  change?: number;
  company: ReceiptCompanyInfo;
}

export type ReceiptSize = "A4" | "thermal";

class ReceiptGenerator {
  private companyInfo: ReceiptCompanyInfo = {
    name: "Your Company",
    address: "123 Business St",
    phone: "(123) 456-7890",
    email: "info@company.com",
    taxNumber: "VAT123456",
  };

  // Convert from your CompanyInfo to ReceiptCompanyInfo format
  setCompanyInfo(companyInfo: CompanyInfo | null) {
    if (!companyInfo) return;

    this.companyInfo = {
      name: companyInfo.companyName || "Your Company",
      address: this.formatAddress(companyInfo),
      phone: companyInfo.phone || "(123) 456-7890",
      email: companyInfo.email || "info@company.com",
      taxNumber: companyInfo.taxId || undefined,
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

  private getItemName(item: SaleItem, truncate: boolean = false): string {
    const name = item.product?.name || "Product";
    if (truncate && name.length > 20) {
      return name.substring(0, 20) + "...";
    }
    return name;
  }

  private getItemSKU(item: SaleItem): string {
    return item.product?.sku || "N/A";
  }

  async fetchProductDetails(saleItems: SaleItem[]): Promise<SaleItem[]> {
    try {
      const itemsWithProducts = await Promise.all(
        saleItems.map(async (item) => {
          try {
            const response = await fetch(
              `/api/shop/products/${item.shopProductId}`
            );
            if (response.ok) {
              const productData = await response.json();
              return {
                ...item,
                product: {
                  name: productData.name || "Product",
                  sku: productData.sku || "N/A",
                },
              };
            }
          } catch (error) {
            console.error(
              `Error fetching product ${item.shopProductId}:`,
              error
            );
          }

          return {
            ...item,
            product: {
              name: "Product",
              sku: "N/A",
            },
          };
        })
      );

      return itemsWithProducts;
    } catch (error) {
      console.error("Error fetching product details:", error);
      return saleItems.map((item) => ({
        ...item,
        product: {
          name: "Product",
          sku: "N/A",
        },
      }));
    }
  }

  async generateReceiptHTML(
    saleData: any,
    size: ReceiptSize = "thermal"
  ): Promise<string> {
    const itemsWithProducts = await this.fetchProductDetails(
      saleData.items || []
    );

    const safeData: ReceiptData = {
      id: saleData.id,
      saleNumber: saleData.saleNumber,
      date: saleData.saleDate || saleData.createdAt,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      customerEmail: saleData.customerEmail,
      items: itemsWithProducts,
      subtotal:
        typeof saleData.subtotal === "string"
          ? parseFloat(saleData.subtotal)
          : saleData.subtotal,
      discount:
        typeof saleData.discount === "string"
          ? parseFloat(saleData.discount)
          : saleData.discount,
      discountPercent:
        typeof saleData.discountPercent === "string"
          ? parseFloat(saleData.discountPercent)
          : saleData.discountPercent,
      tax:
        typeof saleData.tax === "string"
          ? parseFloat(saleData.tax)
          : saleData.tax,
      taxPercent: saleData.taxPercent || 0,
      total:
        typeof saleData.total === "string"
          ? parseFloat(saleData.total)
          : saleData.total,
      paymentMethod: saleData.paymentMethod,
      amountReceived: saleData.amountReceived
        ? typeof saleData.amountReceived === "string"
          ? parseFloat(saleData.amountReceived)
          : saleData.amountReceived
        : undefined,
      change: saleData.change
        ? typeof saleData.change === "string"
          ? parseFloat(saleData.change)
          : saleData.change
        : undefined,
      company: this.companyInfo,
    };

    if (size === "A4") {
      return this.generateA4Receipt(safeData);
    }
    return this.generateThermalReceipt(safeData);
  }

  async generateReceiptForEmail(saleData: any): Promise<string> {
    const itemsWithProducts = await this.fetchProductDetails(
      saleData.items || []
    );

    const safeData: ReceiptData = {
      id: saleData.id,
      saleNumber: saleData.saleNumber,
      date: saleData.saleDate || saleData.createdAt,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      customerEmail: saleData.customerEmail,
      items: itemsWithProducts,
      subtotal:
        typeof saleData.subtotal === "string"
          ? parseFloat(saleData.subtotal)
          : saleData.subtotal,
      discount:
        typeof saleData.discount === "string"
          ? parseFloat(saleData.discount)
          : saleData.discount,
      discountPercent:
        typeof saleData.discountPercent === "string"
          ? parseFloat(saleData.discountPercent)
          : saleData.discountPercent,
      tax:
        typeof saleData.tax === "string"
          ? parseFloat(saleData.tax)
          : saleData.tax,
      taxPercent: saleData.taxPercent || 0,
      total:
        typeof saleData.total === "string"
          ? parseFloat(saleData.total)
          : saleData.total,
      paymentMethod: saleData.paymentMethod,
      amountReceived: saleData.amountReceived
        ? typeof saleData.amountReceived === "string"
          ? parseFloat(saleData.amountReceived)
          : saleData.amountReceived
        : undefined,
      change: saleData.change
        ? typeof saleData.change === "string"
          ? parseFloat(saleData.change)
          : saleData.change
        : undefined,
      company: this.companyInfo,
    };

    return `
      <div style="margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #333; color: white;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Item</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Price</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${safeData.items
              .map(
                (item) => `
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd;">
                  <div style="font-weight: bold;">${this.getItemName(item)}</div>
                  <div style="font-size: 12px; color: #666;">SKU: ${this.getItemSKU(item)}</div>
                </td>
                <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">R${this.formatNumber(item.price)}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">R${this.formatNumber(item.total)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div style="float: right; width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
            <span>Subtotal:</span>
            <span>R${this.formatNumber(safeData.subtotal)}</span>
          </div>
          ${
            safeData.discount > 0
              ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; color: #10b981;">
              <span>Discount (${this.formatNumber(safeData.discountPercent, 0)}%):</span>
              <span>-R${this.formatNumber(safeData.discount)}</span>
            </div>
          `
              : ""
          }
          ${
            safeData.tax > 0
              ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
              <span>VAT (${this.formatNumber(safeData.taxPercent, 0)}%):</span>
              <span>R${this.formatNumber(safeData.tax)}</span>
            </div>
          `
              : ""
          }
          <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #333; font-weight: bold; font-size: 18px;">
            <span>TOTAL:</span>
            <span>R${this.formatNumber(safeData.total)}</span>
          </div>
        </div>

        <div style="clear: both; margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 5px;">
          <div><strong>Payment Method:</strong> ${safeData.paymentMethod.toUpperCase()}</div>
          ${
            safeData.amountReceived
              ? `<div><strong>Amount Received:</strong> R${this.formatNumber(safeData.amountReceived)}</div>`
              : ""
          }
          ${
            safeData.change && safeData.change > 0
              ? `<div><strong>Change:</strong> R${this.formatNumber(safeData.change)}</div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  private generateThermalReceipt(data: ReceiptData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${data.saleNumber}</title>
        <style>
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { margin: 0; }
          }
          body { 
            font-family: 'Courier New', monospace; 
            width: 80mm;
            margin: 0 auto;
            padding: 5mm;
            font-size: 12px;
            line-height: 1.2;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 3px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 1px 0; }
          .item-details { font-size: 10px; color: #666; }
          .total-row { font-weight: bold; font-size: 14px; }
          .header { margin-bottom: 8px; }
          .footer { margin-top: 8px; font-size: 10px; }
          .text-small { font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="bold" style="font-size: 14px;">${data.company.name}</div>
          <div class="text-small">${data.company.address}</div>
          <div class="text-small">Tel: ${data.company.phone}</div>
          ${data.company.taxNumber ? `<div class="text-small">VAT: ${data.company.taxNumber}</div>` : ""}
        </div>
        
        <div class="line"></div>
        
        <div class="center">
          <div class="bold">RECEIPT</div>
          <div>${data.saleNumber}</div>
          <div class="text-small">${this.formatDate(data.date)}</div>
        </div>
        
        <div class="line"></div>
        
        ${
          data.customerName || data.customerPhone
            ? `
          <div class="text-small">
            ${data.customerName ? `<div>Customer: ${data.customerName}</div>` : ""}
            ${data.customerPhone ? `<div>Phone: ${data.customerPhone}</div>` : ""}
          </div>
          <div class="line"></div>
        `
            : ""
        }
        
        <div>
          ${data.items
            .map(
              (item) => `
            <div class="item-row">
              <div class="bold">${this.getItemName(item, true)}</div>
            </div>
            <div class="item-row item-details">
              <div>SKU: ${this.getItemSKU(item)} | ${item.quantity} x R${this.formatNumber(item.price)}</div>
              <div>R${this.formatNumber(item.total)}</div>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div class="line"></div>
        
        <div>
          <div class="item-row">
            <div>Subtotal:</div>
            <div>R${this.formatNumber(data.subtotal)}</div>
          </div>
          ${
            data.discount > 0
              ? `
            <div class="item-row">
              <div>Discount (${this.formatNumber(data.discountPercent, 0)}%):</div>
              <div>-R${this.formatNumber(data.discount)}</div>
            </div>
          `
              : ""
          }
          ${
            data.tax > 0
              ? `
            <div class="item-row">
              <div>VAT (${this.formatNumber(data.taxPercent, 0)}%):</div>
              <div>R${this.formatNumber(data.tax)}</div>
            </div>
          `
              : ""
          }
        </div>
        
        <div class="line"></div>
        
        <div class="item-row total-row">
          <div>TOTAL:</div>
          <div>R${this.formatNumber(data.total)}</div>
        </div>
        
        <div class="line"></div>
        
        <div>
          <div class="item-row">
            <div>Payment Method:</div>
            <div>${data.paymentMethod}</div>
          </div>
          ${
            data.amountReceived
              ? `
            <div class="item-row">
              <div>Amount Received:</div>
              <div>R${this.formatNumber(data.amountReceived)}</div>
            </div>
          `
              : ""
          }
          ${
            data.change && data.change > 0
              ? `
            <div class="item-row">
              <div>Change:</div>
              <div>R${this.formatNumber(data.change)}</div>
            </div>
          `
              : ""
          }
        </div>
        
        <div class="line"></div>
        
        <div class="footer center">
          <div>Thank you for your business!</div>
          <div>Please come again</div>
        </div>
      </body>
      </html>
    `;
  }

  private generateA4Receipt(data: ReceiptData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${data.saleNumber}</title>
        <style>
          @media print {
            @page { margin: 20mm; size: A4; }
          }
          body { 
            font-family: Arial, sans-serif; 
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
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
            }
            .items-table th { 
              background-color: #333; 
              color: white;
              font-weight: bold;
            }
            .items-table tr:nth-child(even) {
              background-color: #f9f9f9;
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
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${data.company.name}</div>
          <div>${data.company.address}</div>
          <div>Tel: ${data.company.phone} | Email: ${data.company.email}</div>
          ${data.company.taxNumber ? `<div>VAT Number: ${data.company.taxNumber}</div>` : ""}
        </div>

        <div class="receipt-title">SALES RECEIPT</div>
        
        <div class="info-section">
          <div><strong>Receipt Number:</strong> ${data.saleNumber}</div>
          <div><strong>Date:</strong> ${this.formatDate(data.date)}</div>
          ${data.customerName ? `<div><strong>Customer:</strong> ${data.customerName}</div>` : ""}
          ${data.customerPhone ? `<div><strong>Phone:</strong> ${data.customerPhone}</div>` : ""}
          ${data.customerEmail ? `<div><strong>Email:</strong> ${data.customerEmail}</div>` : ""}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th style="text-align: right;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items
              .map(
                (item) => `
              <tr>
                <td>${this.getItemName(item)}</td>
                <td>${this.getItemSKU(item)}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">R${this.formatNumber(item.price)}</td>
                <td style="text-align: right;">R${this.formatNumber(item.total)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>R${this.formatNumber(data.subtotal)}</span>
          </div>
          ${
            data.discount > 0
              ? `
            <div class="totals-row" style="color: green;">
              <span>Discount (${this.formatNumber(data.discountPercent, 0)}%):</span>
              <span>-R${this.formatNumber(data.discount)}</span>
            </div>
          `
              : ""
          }
          ${
            data.tax > 0
              ? `
            <div class="totals-row">
              <span>VAT (${this.formatNumber(data.taxPercent, 0)}%):</span>
              <span>R${this.formatNumber(data.tax)}</span>
            </div>
          `
              : ""
          }
          <div class="totals-row total-row">
            <span>TOTAL:</span>
            <span>R${this.formatNumber(data.total)}</span>
          </div>
        </div>

        <div class="payment-info">
          <div><strong>Payment Method:</strong> ${data.paymentMethod}</div>
          ${data.amountReceived ? `<div><strong>Amount Received:</strong> R${this.formatNumber(data.amountReceived)}</div>` : ""}
          ${data.change && data.change > 0 ? `<div><strong>Change:</strong> R${this.formatNumber(data.change)}</div>` : ""}
        </div>

        <div class="footer">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Thank You for Your Business!</div>
          <div>For any queries, please contact us at ${data.company.phone} or ${data.company.email}</div>
        </div>
      </body>
      </html>
    `;
  }

  async generateReceiptPDF(
    saleData: any,
    size: ReceiptSize = "thermal"
  ): Promise<Blob> {
    const htmlContent = await this.generateReceiptHTML(saleData, size);
    const blob = new Blob([htmlContent], { type: "text/html" });
    return blob;
  }

  async downloadReceipt(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async printReceipt(
    saleData: any,
    size: ReceiptSize = "thermal"
  ): Promise<void> {
    const htmlContent = await this.generateReceiptHTML(saleData, size);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }
}

export const receiptGenerator = new ReceiptGenerator();
