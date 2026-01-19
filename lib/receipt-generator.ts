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
  hadNegativeStock?: boolean;
  awaitedQuantity?: number;
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
  logo?: string;
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
  createdBy?: string;
  status?: string;
  stockAwaitItems?: Array<{
    id: string;
    shopProduct: {
      name: string;
      sku: string;
    };
    quantity: number;
  }>;
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

  private readonly DEFAULT_TAX_RATE = 0.15; // 15% VAT for South Africa

  // Convert from your CompanyInfo to ReceiptCompanyInfo format
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

  // REMOVED truncate parameter - always show full name
  private getItemName(item: SaleItem): string {
    return item.product?.name || "Product";
  }

  private getItemSKU(item: SaleItem): string {
    return item.product?.sku || "N/A";
  }

  // Helper function to calculate tax from total
  private calculateTaxFromTotal(
    total: number,
    taxRate: number = this.DEFAULT_TAX_RATE
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

  async fetchStockAwaitItems(saleId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/shop/sales/${saleId}/stock-awaits`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error("Error fetching stock await items:", error);
      return [];
    }
  }

  async generateReceiptHTML(
    saleData: any,
    size: ReceiptSize = "thermal",
    includePrintButton: boolean = true
  ): Promise<string> {
    const itemsWithProducts = await this.fetchProductDetails(
      saleData.items || []
    );

    // Fetch stock await items if sale status is AWAITING_STOCK
    let stockAwaitItems: any[] = [];
    if (saleData.status === "AWAITING_STOCK") {
      stockAwaitItems = await this.fetchStockAwaitItems(saleData.id);
    }

    // Calculate tax from total if not provided
    const taxRate = saleData.taxPercent
      ? saleData.taxPercent / 100
      : this.DEFAULT_TAX_RATE;

    let taxAmount = saleData.tax || 0;
    let subtotalBeforeTax = saleData.subtotal || 0;

    // If tax is not provided or is 0, calculate it from total
    if (!taxAmount || taxAmount === 0) {
      const calculated = this.calculateTaxFromTotal(
        saleData.total || 0,
        taxRate
      );
      taxAmount = calculated.taxAmount;
      subtotalBeforeTax = calculated.subtotalBeforeTax;
    } else {
      // If tax is provided, calculate subtotal before tax
      subtotalBeforeTax = (saleData.total || 0) - taxAmount;
    }

    const safeData: ReceiptData = {
      id: saleData.id,
      saleNumber: saleData.saleNumber,
      date: saleData.saleDate || saleData.createdAt,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      customerEmail: saleData.customerEmail,
      items: itemsWithProducts,
      subtotal: subtotalBeforeTax,
      discount: saleData.discount || 0,
      discountPercent: saleData.discountPercent || 0,
      tax: taxAmount,
      taxPercent: taxRate * 100,
      total: saleData.total || 0,
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
      createdBy: saleData.createdBy,
      status: saleData.status,
      stockAwaitItems: stockAwaitItems,
    };

    if (size === "A4") {
      return this.generateA4Receipt(safeData, includePrintButton);
    }
    return this.generateThermalReceipt(safeData, includePrintButton);
  }

  async generateReceiptForEmail(saleData: any): Promise<string> {
    const itemsWithProducts = await this.fetchProductDetails(
      saleData.items || []
    );

    // Fetch stock await items if sale status is AWAITING_STOCK
    let stockAwaitItems: any[] = [];
    if (saleData.status === "AWAITING_STOCK") {
      stockAwaitItems = await this.fetchStockAwaitItems(saleData.id);
    }

    // Calculate tax from total if not provided
    const taxRate = saleData.taxPercent
      ? saleData.taxPercent / 100
      : this.DEFAULT_TAX_RATE;

    let taxAmount = saleData.tax || 0;
    let subtotalBeforeTax = saleData.subtotal || 0;

    // If tax is not provided or is 0, calculate it from total
    if (!taxAmount || taxAmount === 0) {
      const calculated = this.calculateTaxFromTotal(
        saleData.total || 0,
        taxRate
      );
      taxAmount = calculated.taxAmount;
      subtotalBeforeTax = calculated.subtotalBeforeTax;
    } else {
      // If tax is provided, calculate subtotal before tax
      subtotalBeforeTax = (saleData.total || 0) - taxAmount;
    }

    const safeData: ReceiptData = {
      id: saleData.id,
      saleNumber: saleData.saleNumber,
      date: saleData.saleDate || saleData.createdAt,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      customerEmail: saleData.customerEmail,
      items: itemsWithProducts,
      subtotal: subtotalBeforeTax,
      discount: saleData.discount || 0,
      discountPercent: saleData.discountPercent || 0,
      tax: taxAmount,
      taxPercent: taxRate * 100,
      total: saleData.total || 0,
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
      createdBy: saleData.createdBy,
      status: saleData.status,
      stockAwaitItems: stockAwaitItems,
    };

    return `
      <div style="margin: 20px 0;">
        ${
          this.companyInfo.logo
            ? `
          <div style="text-align: center; margin-bottom: 40px;">
            <img src="${this.companyInfo.logo}" alt="${this.companyInfo.name}" 
                 style="height: 300px; width: 800px; object-fit: contain; margin: 0 auto; display: block;">
          </div>
        `
            : ""
        }
        
        <h2 style="text-align: center; color: #333; margin-bottom: 15px; font-weight: 800; font-size: 28px;">${this.companyInfo.name}</h2>
        <div style="text-align: center; color: #666; margin-bottom: 30px; font-size: 18px; font-weight: 600;">
          ${this.companyInfo.address}<br>
          Tel: ${this.companyInfo.phone} | Email: ${this.companyInfo.email}<br>
          ${this.companyInfo.taxNumber ? `VAT: ${this.companyInfo.taxNumber}` : ""}
        </div>

        <h3 style="color: #333; border-bottom: 3px solid #333; padding-bottom: 15px; margin-bottom: 25px; font-weight: 800; font-size: 24px;">
          SALES RECEIPT: ${safeData.saleNumber}
        </h3>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 25px; font-size: 16px;">
          <div><strong style="font-weight: 700;">Date:</strong> ${this.formatDate(safeData.date)}</div>
          ${safeData.customerName ? `<div><strong style="font-weight: 700;">Customer:</strong> ${safeData.customerName}</div>` : ""}
          ${safeData.customerPhone ? `<div><strong style="font-weight: 700;">Phone:</strong> ${safeData.customerPhone}</div>` : ""}
          ${safeData.createdBy ? `<div><strong style="font-weight: 700;">Assisted by:</strong> ${safeData.createdBy}</div>` : ""}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 16px;">
          <thead>
            <tr style="background-color: #333; color: white;">
              <th style="padding: 15px; text-align: left; border: 1px solid #ddd; width: 45%; font-weight: 800; font-size: 18px;">Item</th>
              <th style="padding: 15px; text-align: left; border: 1px solid #ddd; width: 15%; font-weight: 800; font-size: 18px;">SKU</th>
              <th style="padding: 15px; text-align: right; border: 1px solid #ddd; width: 10%; font-weight: 800; font-size: 18px;">Qty</th>
              <th style="padding: 15px; text-align: right; border: 1px solid #ddd; width: 15%; font-weight: 800; font-size: 18px;">Price</th>
              <th style="padding: 15px; text-align: right; border: 1px solid #ddd; width: 15%; font-weight: 800; font-size: 18px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${safeData.items
              .map(
                (item) => `
              <tr>
                <td style="padding: 15px; border: 1px solid #ddd; vertical-align: top;">
                  <div style="font-weight: 700; word-wrap: break-word; white-space: normal; font-size: 16px;">
                    ${this.getItemName(item)}
                  </div>
                  ${
                    item.hadNegativeStock
                      ? `
                    <div style="font-size: 14px; color: #dc2626; font-style: italic; font-weight: 600;">
                      (Awaiting stock: ${item.awaitedQuantity})
                    </div>
                  `
                      : ""
                  }
                </td>
                <td style="padding: 15px; border: 1px solid #ddd; vertical-align: top; font-weight: 600;">${this.getItemSKU(item)}</td>
                <td style="padding: 15px; text-align: right; border: 1px solid #ddd; vertical-align: top; font-weight: 600;">${item.quantity}</td>
                <td style="padding: 15px; text-align: right; border: 1px solid #ddd; vertical-align: top; font-weight: 600;">R${this.formatNumber(item.price)}</td>
                <td style="padding: 15px; text-align: right; border: 1px solid #ddd; vertical-align: top; font-weight: 700;">R${this.formatNumber(item.total)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        ${
          stockAwaitItems.length > 0
            ? `
          <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 5px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #92400e; margin: 0 0 15px 0; font-weight: 800; font-size: 20px;">⚠ Items Awaiting Stock</h4>
            ${stockAwaitItems
              .map(
                (item) => `
              <div style="margin: 8px 0; font-weight: 600; font-size: 16px;">
                <strong>${item.shopProduct?.name}</strong> (SKU: ${item.shopProduct?.sku}) - Awaiting: ${item.quantity}
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        <div style="float: right; width: 350px;">
          <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 2px solid #ddd; font-size: 18px; font-weight: 700;">
            <span>Subtotal:</span>
            <span>R${this.formatNumber(safeData.subtotal)}</span>
          </div>
          ${
            safeData.discount > 0
              ? `
            <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 2px solid #ddd; color: #10b981; font-size: 18px; font-weight: 700;">
              <span>Discount (${this.formatNumber(safeData.discountPercent, 0)}%):</span>
              <span>-R${this.formatNumber(safeData.discount)}</span>
            </div>
          `
              : ""
          }
          ${
            safeData.tax > 0
              ? `
            <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 2px solid #ddd; font-size: 18px; font-weight: 700;">
              <span>VAT (${this.formatNumber(safeData.taxPercent, 0)}%):</span>
              <span>R${this.formatNumber(safeData.tax)}</span>
            </div>
          `
              : ""
          }
          <div style="display: flex; justify-content: space-between; padding: 20px 0; border-top: 3px solid #333; border-bottom: 3px solid #333; font-weight: 800; font-size: 24px; margin-top: 15px;">
            <span>TOTAL:</span>
            <span>R${this.formatNumber(safeData.total)}</span>
          </div>
        </div>

        <div style="clear: both; margin-top: 25px; padding: 20px; background: #e8f5e9; border-radius: 5px; font-size: 18px;">
          <div><strong style="font-weight: 800;">Payment Method:</strong> ${safeData.paymentMethod.toUpperCase()}</div>
          ${
            safeData.amountReceived
              ? `<div><strong style="font-weight: 800;">Amount Received:</strong> R${this.formatNumber(safeData.amountReceived)}</div>`
              : ""
          }
          ${
            safeData.change && safeData.change > 0
              ? `<div><strong style="font-weight: 800;">Change:</strong> R${this.formatNumber(safeData.change)}</div>`
              : ""
          }
        </div>

        <div style="clear: both; margin-top: 40px; padding-top: 25px; border-top: 3px solid #333; text-align: center;">
          <div style="font-size: 24px; font-weight: 800; margin-bottom: 15px;">Thank You for Your Business!</div>
          <div style="color: #666; font-size: 18px;">For any queries, please contact us at ${this.companyInfo.phone}</div>
        </div>
      </div>
    `;
  }

  private generateThermalReceipt(
    data: ReceiptData,
    includePrintButton: boolean = true
  ): string {
    const hasLogo = data.company.logo;

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
            .print-button { display: none !important; }
          }
          body { 
            font-family: 'Courier New', monospace; 
            width: 80mm;
            margin: 0 auto;
            padding: 5mm;
            font-size: 14px; /* Increased from 12px */
            line-height: 1.3;
            font-weight: 600; /* Added boldness */
          }
          .print-button {
            display: ${includePrintButton ? "block" : "none"};
            width: 100%;
            background-color: #007bff;
            color: white;
            border: none;
            padding: 12px;
            font-size: 16px; /* Increased from 14px */
            font-weight: 800; /* Bolder */
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
          .bold { font-weight: 800; } /* Increased from bold to 800 */
          .extra-bold { font-weight: 900; } /* Extra bold for important elements */
          .line { border-top: 2px solid #000; margin: 5px 0; } /* Thicker line */
          .item-row { margin: 5px 0; }
          .item-name { 
            font-weight: 800; /* Bolder */
            word-wrap: break-word;
            white-space: normal;
            margin-bottom: 2px;
            font-size: 14px; /* Increased */
          }
          .item-details { 
            font-size: 13px; /* Increased from 10px */
            font-weight: 700; /* Added boldness */
            color: #333;
            display: flex;
            justify-content: space-between;
          }
          .total-row { 
            font-weight: 900; /* Extra bold */
            font-size: 16px; /* Increased from 14px */
          }
          .header { 
            margin-bottom: 10px;
            font-weight: 800;
          }
          .footer { 
            margin-top: 10px; 
            font-size: 12px; /* Increased from 10px */
            font-weight: 700; /* Added boldness */
          }
          .text-small { 
            font-size: 12px; /* Increased from 10px */
            font-weight: 700; /* Added boldness */
          }
          .logo { 
            max-width: 100%; 
            height: auto; 
            margin-bottom: 20px;
            max-height: 150px;
            object-fit: contain;
            width: 100%;
          }
          .awaiting-stock { 
            color: #dc2626; 
            font-style: italic; 
            font-size: 11px; /* Increased from 9px */
            font-weight: 700; /* Added boldness */
            margin-top: 2px;
          }
          .column-layout {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-weight: 700; /* Added boldness */
          }
          .item-container {
            margin-bottom: 6px; /* Increased from 4px */
            padding-bottom: 4px; /* Increased from 2px */
            border-bottom: 1px dotted #ccc;
          }
          .section-title {
            font-weight: 900; /* Extra bold */
            font-size: 16px; /* Increased */
            text-align: center;
            margin: 8px 0;
          }
          .receipt-number {
            font-weight: 900; /* Extra bold */
            font-size: 18px; /* Increased */
            text-align: center;
            margin: 5px 0;
          }
          .customer-info {
            font-weight: 700; /* Added boldness */
            margin: 3px 0;
          }
          .payment-info {
            font-weight: 800; /* Bolder */
            margin: 5px 0;
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
          <div class="bold extra-bold" style="font-size: 24px; margin: 5px 0;">${data.company.name}</div>
          <div class="text-small">${data.company.address}</div>
          <div class="text-small">Tel: ${data.company.phone}</div>
          ${data.company.taxNumber ? `<div class="text-small">VAT: ${data.company.taxNumber}</div>` : ""}
        </div>
        
        <div class="line"></div>
        
        <div class="center">
          <div class="extra-bold receipt-number">${data.saleNumber}</div>
          <div class="text-small">${this.formatDate(data.date)}</div>
        </div>
        
        <div class="line"></div>
        
        <div class="text-small">
          ${data.customerName ? `<div class="customer-info">Customer: ${data.customerName}</div>` : ""}
          ${data.customerPhone ? `<div class="customer-info">Phone: ${data.customerPhone}</div>` : ""}
          ${data.createdBy ? `<div class="customer-info">Assisted by: ${data.createdBy}</div>` : ""}
        </div>
        
        <div class="line"></div>
        
        <div class="section-title">ITEMS</div>
        
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
                <div class="bold">R${this.formatNumber(item.total)}</div>
              </div>
              ${
                item.hadNegativeStock
                  ? `
                <div class="awaiting-stock">
                  Awaiting stock: ${item.awaitedQuantity}
                </div>
              `
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </div>
        
        ${
          data.stockAwaitItems && data.stockAwaitItems.length > 0
            ? `
          <div class="line"></div>
          <div style="color: #dc2626; font-size: 12px; margin-bottom: 5px; font-weight: 800;">
            <div class="extra-bold">⚠ Items awaiting stock:</div>
            ${data.stockAwaitItems
              .map(
                (item) => `
              <div>${item.shopProduct?.name}: ${item.quantity}</div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
        
        <div class="line"></div>
        
        <div class="section-title">TOTALS</div>
        
        <div>
          <div class="column-layout">
            <div>Subtotal:</div>
            <div>R${this.formatNumber(data.subtotal)}</div>
          </div>
          ${
            data.discount > 0
              ? `
            <div class="column-layout" style="color: #10b981;">
              <div>Discount (${this.formatNumber(data.discountPercent, 0)}%):</div>
              <div>-R${this.formatNumber(data.discount)}</div>
            </div>
          `
              : ""
          }
          ${
            data.tax > 0
              ? `
            <div class="column-layout">
              <div>VAT (${this.formatNumber(data.taxPercent, 0)}%):</div>
              <div>R${this.formatNumber(data.tax)}</div>
            </div>
          `
              : ""
          }
        </div>
        
        <div class="line"></div>
        
        <div class="column-layout total-row extra-bold">
          <div>TOTAL:</div>
          <div>R${this.formatNumber(data.total)}</div>
        </div>
        
        <div class="line"></div>
        
        <div class="section-title">PAYMENT</div>
        
        <div>
          <div class="column-layout payment-info">
            <div>Payment Method:</div>
            <div>${data.paymentMethod}</div>
          </div>
          ${
            data.amountReceived
              ? `
            <div class="column-layout payment-info">
              <div>Amount Received:</div>
              <div>R${this.formatNumber(data.amountReceived)}</div>
            </div>
          `
              : ""
          }
          ${
            data.change && data.change > 0
              ? `
            <div class="column-layout payment-info">
              <div>Change:</div>
              <div>R${this.formatNumber(data.change)}</div>
            </div>
          `
              : ""
          }
        </div>
        
        <div class="line"></div>
        
        <div class="footer center">
          <div class="bold">Thank you for your business!</div>
          <div>Please come again</div>
        </div>
      </body>
      </html>
    `;
  }

  private generateA4Receipt(
    data: ReceiptData,
    includePrintButton: boolean = true
  ): string {
    const hasLogo = data.company.logo;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${data.saleNumber}</title>
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
            font-weight: 600; /* Added base boldness */
          }
          .print-button {
            display: ${includePrintButton ? "block" : "none"};
            width: 100%;
            background-color: #007bff;
            color: white;
            border: none;
            padding: 15px;
            font-size: 18px; /* Increased from 16px */
            font-weight: 900; /* Extra bold */
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
            margin-bottom: 40px;
            border-bottom: 3px solid #333; /* Thicker border */
            padding-bottom: 30px;
          }
          .company-name { 
            font-size: 28px; /* Increased from 24px */
            font-weight: 900; /* Extra bold */
            margin-bottom: 15px;
          }
          .receipt-title {
            font-size: 24px; /* Increased from 20px */
            font-weight: 900; /* Extra bold */
            margin: 25px 0;
            text-align: center;
          }
          .info-section {
            margin: 25px 0;
            padding: 20px; /* Increased from 15px */
            background: #f5f5f5;
            border-radius: 5px;
            font-size: 16px; /* Increased */
            font-weight: 700; /* Added boldness */
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 25px 0; 
            font-size: 15px; /* Increased */
          }
          .items-table th, .items-table td { 
            border: 2px solid #ddd; /* Thicker borders */
            padding: 15px; /* Increased from 12px */
            text-align: left; 
            vertical-align: top;
          }
          .items-table th { 
            background-color: #333; 
            color: white;
            font-weight: 900; /* Extra bold */
            font-size: 17px; /* Increased */
          }
          .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .product-name {
            word-wrap: break-word;
            white-space: normal;
            max-width: 200px;
            font-weight: 700; /* Added boldness */
          }
          .totals { 
            margin-top: 25px;
            float: right;
            width: 350px; /* Increased from 300px */
          }
          .totals-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 12px 0; /* Increased from 8px */
            border-bottom: 2px solid #ddd; /* Thicker border */
            font-size: 17px; /* Increased */
            font-weight: 700; /* Added boldness */
          }
          .total-row { 
            font-weight: 900; /* Extra bold */
            font-size: 22px; /* Increased from 18px */
            border-top: 3px solid #333; /* Thicker border */
            border-bottom: 3px solid #333; /* Thicker border */
            margin-top: 15px;
            padding-top: 15px;
          }
          .footer {
            clear: both;
            margin-top: 50px;
            text-align: center;
            padding-top: 25px;
            border-top: 3px solid #333; /* Thicker border */
            font-size: 18px; /* Increased */
          }
          .payment-info {
            margin: 25px 0;
            padding: 20px; /* Increased from 15px */
            background: #e8f5e9;
            border-radius: 5px;
            font-size: 17px; /* Increased */
            font-weight: 800; /* Added boldness */
          }
          .awaiting-stock-note {
            background: #fef3c7;
            border: 2px solid #fbbf24; /* Thicker border */
            border-radius: 5px;
            padding: 20px; /* Increased from 15px */
            margin: 25px 0;
            font-weight: 700; /* Added boldness */
          }
          .logo {
            height: 300px;
            max-width: 100%;
            margin-bottom: 30px;
            object-fit: contain;
            width: auto;
          }
          .highlight {
            font-weight: 900; /* Extra bold */
            color: #333;
          }
          .receipt-number-display {
            font-size: 26px; /* Increased */
            font-weight: 900; /* Extra bold */
            color: #2c5282;
            text-align: center;
            margin: 10px 0;
          }
          .logo-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 30px;
            height: 320px;
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
          ${
            hasLogo
              ? `
            <div class="logo-container">
              <img src="${data.company.logo}" alt="${data.company.name}" class="logo">
            </div>
          `
              : ""
          }
          <div class="company-name">${data.company.name}</div>
          <div style="font-weight: 700; font-size: 16px;">${data.company.address}</div>
          <div style="font-weight: 700; font-size: 16px;">Tel: ${data.company.phone} | Email: ${data.company.email}</div>
          ${data.company.taxNumber ? `<div style="font-weight: 700; font-size: 16px;">VAT Number: ${data.company.taxNumber}</div>` : ""}
        </div>

        <div class="receipt-title">SALES RECEIPT</div>
        
        <div class="receipt-number-display">${data.saleNumber}</div>
        
        <div class="info-section">
          <div><strong>Date:</strong> ${this.formatDate(data.date)}</div>
          ${data.customerName ? `<div><strong>Customer:</strong> ${data.customerName}</div>` : ""}
          ${data.customerPhone ? `<div><strong>Phone:</strong> ${data.customerPhone}</div>` : ""}
          ${data.createdBy ? `<div><strong>Assisted by:</strong> ${data.createdBy}</div>` : ""}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 35%;">Item</th>
              <th style="width: 15%;">SKU</th>
              <th style="width: 10%; text-align: right;">Qty</th>
              <th style="width: 20%; text-align: right;">Price</th>
              <th style="width: 20%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items
              .map(
                (item) => `
              <tr>
                <td class="product-name">
                  ${this.getItemName(item)}
                  ${
                    item.hadNegativeStock
                      ? `
                    <div style="color: #dc2626; font-style: italic; font-size: 14px; font-weight: 800;">
                      (Awaiting stock: ${item.awaitedQuantity})
                    </div>
                  `
                      : ""
                  }
                </td>
                <td style="font-weight: 700;">${this.getItemSKU(item)}</td>
                <td style="text-align: right; font-weight: 700;">${item.quantity}</td>
                <td style="text-align: right; font-weight: 700;">R${this.formatNumber(item.price)}</td>
                <td style="text-align: right; font-weight: 800;">R${this.formatNumber(item.total)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        ${
          data.stockAwaitItems && data.stockAwaitItems.length > 0
            ? `
          <div class="awaiting-stock-note">
            <div style="font-weight: 900; color: #92400e; margin-bottom: 12px; font-size: 18px;">
              ⚠ Items Awaiting Stock
            </div>
            <div style="font-size: 16px;">
              ${data.stockAwaitItems
                .map(
                  (item) => `
                <div style="margin: 8px 0; font-weight: 800;">
                  <strong>${item.shopProduct?.name}</strong> (SKU: ${item.shopProduct?.sku}) - Awaiting: ${item.quantity} units
                </div>
              `
                )
                .join("")}
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: #92400e; font-weight: 800;">
              These items will be fulfilled once stock is available.
            </div>
          </div>
        `
            : ""
        }

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
            <span class="highlight">R${this.formatNumber(data.total)}</span>
          </div>
        </div>

        <div class="payment-info">
          <div><strong>Payment Method:</strong> ${data.paymentMethod}</div>
          ${data.amountReceived ? `<div><strong>Amount Received:</strong> R${this.formatNumber(data.amountReceived)}</div>` : ""}
          ${data.change && data.change > 0 ? `<div><strong>Change:</strong> R${this.formatNumber(data.change)}</div>` : ""}
        </div>

        <div class="footer">
          <div style="font-size: 22px; font-weight: 900; margin-bottom: 15px;">Thank You for Your Business!</div>
          <div style="font-weight: 700;">For any queries, please contact us at ${data.company.phone} or ${data.company.email}</div>
        </div>
      </body>
      </html>
    `;
  }

  async generateReceiptPDF(
    saleData: any,
    size: ReceiptSize = "thermal"
  ): Promise<Blob> {
    const htmlContent = await this.generateReceiptHTML(saleData, size, false);
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
    const htmlContent = await this.generateReceiptHTML(saleData, size, true);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      // Auto-print after a short delay to ensure content is loaded
      /*  setTimeout(() => {
        printWindow.print();
      }, 500); */
    }
  }
}

export const receiptGenerator = new ReceiptGenerator();
