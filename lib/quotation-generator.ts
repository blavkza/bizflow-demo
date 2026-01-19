"use client";

export interface SaleQuoteItem {
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

export interface QuotationCompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
  logo?: string;
  website?: string;
}

export interface QuotationData {
  id: string;
  quoteNumber: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: SaleQuoteItem[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax?: number;
  taxPercent?: number;
  deliveryFee: number;
  total: number;
  company: QuotationCompanyInfo;
  createdBy?: string;
  expiryDate?: string;
  notes?: string;
  isDelivery?: boolean;
  deliveryAddress?: string;
  deliveryInstructions?: string;
}

export type QuotationSize = "A4" | "thermal";

class QuotationGenerator {
  private companyInfo: QuotationCompanyInfo = {
    name: "Your Company",
    address: "123 Business St",
    phone: "(123) 456-7890",
    email: "info@company.com",
    taxNumber: "VAT123456",
    website: "www.company.com",
  };

  private readonly DEFAULT_TAX_RATE = 0.15; // 15% VAT for South Africa

  // Convert from your CompanyInfo to QuotationCompanyInfo format
  setCompanyInfo(companyInfo: CompanyInfo | null) {
    if (!companyInfo) return;

    this.companyInfo = {
      name: companyInfo.companyName || "Your Company",
      address: this.formatAddress(companyInfo),
      phone: companyInfo.phone || "(123) 456-7890",
      email: companyInfo.email || "info@company.com",
      taxNumber: companyInfo.taxId || undefined,
      logo: companyInfo.logo || undefined,
      website: companyInfo.website || undefined,
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

  private formatExpiryDate(dateString: string | undefined): string {
    if (!dateString) {
      // Calculate 7 days from now if no expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      return expiryDate.toLocaleDateString() + " (7 days)";
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Calculate 7 days from now if date is invalid
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        return expiryDate.toLocaleDateString() + " (7 days)";
      }
      return date.toLocaleDateString();
    } catch (error) {
      // Calculate 7 days from now on error
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      return expiryDate.toLocaleDateString() + " (7 days)";
    }
  }

  private getItemName(item: SaleQuoteItem): string {
    return item.product?.name || "Product";
  }

  private getItemSKU(item: SaleQuoteItem): string {
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

  async fetchProductDetails(
    quoteItems: SaleQuoteItem[]
  ): Promise<SaleQuoteItem[]> {
    try {
      const itemsWithProducts = await Promise.all(
        quoteItems.map(async (item) => {
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
      return quoteItems.map((item) => ({
        ...item,
        product: {
          name: "Product",
          sku: "N/A",
        },
      }));
    }
  }

  async generateQuotationHTML(
    quoteData: any,
    size: QuotationSize = "thermal",
    includePrintButton: boolean = true,
    showItemPrices: boolean = true
  ): Promise<string> {
    const itemsWithProducts = await this.fetchProductDetails(
      quoteData.items || []
    );

    // Calculate tax from total if not provided
    const taxRate = quoteData.taxPercent
      ? quoteData.taxPercent / 100
      : this.DEFAULT_TAX_RATE;

    let taxAmount = quoteData.tax || 0;
    let subtotalBeforeTax = quoteData.subtotal || 0;

    // If tax is not provided or is 0, calculate it from total
    if (!taxAmount || taxAmount === 0) {
      const totalWithoutDelivery =
        quoteData.total - (quoteData.deliveryFee || 0);
      const calculated = this.calculateTaxFromTotal(
        totalWithoutDelivery,
        taxRate
      );
      taxAmount = calculated.taxAmount;
      subtotalBeforeTax = calculated.subtotalBeforeTax;
    } else {
      // If tax is provided, calculate subtotal before tax
      const totalWithoutDelivery =
        quoteData.total - (quoteData.deliveryFee || 0);
      subtotalBeforeTax = totalWithoutDelivery - taxAmount;
    }

    const safeData: QuotationData = {
      id: quoteData.id,
      quoteNumber: quoteData.quoteNumber,
      date: quoteData.createdAt || new Date().toISOString(),
      customerName: quoteData.customerName,
      customerPhone: quoteData.customerPhone,
      customerEmail: quoteData.customerEmail,
      items: itemsWithProducts,
      subtotal: subtotalBeforeTax,
      discount: quoteData.discount || 0,
      discountPercent: quoteData.discountPercent || 0,
      tax: taxAmount,
      taxPercent: taxRate * 100,
      deliveryFee: quoteData.deliveryFee || 0,
      total: quoteData.total || 0,
      company: this.companyInfo,
      createdBy: quoteData.createdBy,
      expiryDate: quoteData.expiryDate,
      notes: quoteData.notes,
      isDelivery: quoteData.isDelivery,
      deliveryAddress: quoteData.deliveryAddress,
      deliveryInstructions: quoteData.deliveryInstructions,
    };

    if (size === "A4") {
      return this.generateA4Quotation(
        safeData,
        includePrintButton,
        showItemPrices
      );
    }
    return this.generateThermalQuotation(
      safeData,
      includePrintButton,
      showItemPrices
    );
  }

  async generateQuotationForEmail(
    quoteData: any,
    showItemPrices: boolean = true
  ): Promise<string> {
    const itemsWithProducts = await this.fetchProductDetails(
      quoteData.items || []
    );

    // Calculate tax from total if not provided
    const taxRate = quoteData.taxPercent
      ? quoteData.taxPercent / 100
      : this.DEFAULT_TAX_RATE;

    let taxAmount = quoteData.tax || 0;
    let subtotalBeforeTax = quoteData.subtotal || 0;

    // If tax is not provided or is 0, calculate it from total
    if (!taxAmount || taxAmount === 0) {
      const totalWithoutDelivery =
        quoteData.total - (quoteData.deliveryFee || 0);
      const calculated = this.calculateTaxFromTotal(
        totalWithoutDelivery,
        taxRate
      );
      taxAmount = calculated.taxAmount;
      subtotalBeforeTax = calculated.subtotalBeforeTax;
    } else {
      // If tax is provided, calculate subtotal before tax
      const totalWithoutDelivery =
        quoteData.total - (quoteData.deliveryFee || 0);
      subtotalBeforeTax = totalWithoutDelivery - taxAmount;
    }

    const safeData: QuotationData = {
      id: quoteData.id,
      quoteNumber: quoteData.quoteNumber,
      date: quoteData.createdAt || new Date().toISOString(),
      customerName: quoteData.customerName,
      customerPhone: quoteData.customerPhone,
      customerEmail: quoteData.customerEmail,
      items: itemsWithProducts,
      subtotal: subtotalBeforeTax,
      discount: quoteData.discount || 0,
      discountPercent: quoteData.discountPercent || 0,
      tax: taxAmount,
      taxPercent: taxRate * 100,
      deliveryFee: quoteData.deliveryFee || 0,
      total: quoteData.total || 0,
      company: this.companyInfo,
      createdBy: quoteData.createdBy,
      expiryDate: quoteData.expiryDate,
      notes: quoteData.notes,
      isDelivery: quoteData.isDelivery,
      deliveryAddress: quoteData.deliveryAddress,
      deliveryInstructions: quoteData.deliveryInstructions,
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
          ${this.companyInfo.taxNumber ? `VAT: ${this.companyInfo.taxNumber}<br>` : ""}
          ${this.companyInfo.website ? `Website: ${this.companyInfo.website}` : ""}
        </div>

        <h3 style="color: #333; border-bottom: 3px solid #333; padding-bottom: 15px; margin-bottom: 25px; font-weight: 800; font-size: 24px;">
          QUOTATION: ${safeData.quoteNumber}
        </h3>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 25px; font-size: 16px; font-weight: 600;">
          <div><strong style="font-weight: 700;">Date:</strong> ${this.formatDate(safeData.date)}</div>
          <div><strong style="font-weight: 700;">Valid Until:</strong> ${this.formatExpiryDate(safeData.expiryDate)}</div>
          ${safeData.customerName ? `<div><strong style="font-weight: 700;">Customer:</strong> ${safeData.customerName}</div>` : ""}
          ${safeData.customerPhone ? `<div><strong style="font-weight: 700;">Phone:</strong> ${safeData.customerPhone}</div>` : ""}
          ${safeData.customerEmail ? `<div><strong style="font-weight: 700;">Email:</strong> ${safeData.customerEmail}</div>` : ""}
          ${safeData.createdBy ? `<div><strong style="font-weight: 700;">Prepared by:</strong> ${safeData.createdBy}</div>` : ""}
          ${
            safeData.isDelivery && safeData.deliveryAddress
              ? `
            <div><strong style="font-weight: 700;">Delivery Address:</strong> ${safeData.deliveryAddress}</div>
            ${
              safeData.deliveryInstructions
                ? `<div><strong style="font-weight: 700;">Delivery Instructions:</strong> ${safeData.deliveryInstructions}</div>`
                : ""
            }
          `
              : ""
          }
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 16px;">
          <thead>
            <tr style="background-color: #333; color: white;">
              <th style="padding: 15px; text-align: left; border: 1px solid #ddd; width: ${showItemPrices ? "45%" : "60%"}; font-weight: 800; font-size: 18px;">Item</th>
              <th style="padding: 15px; text-align: left; border: 1px solid #ddd; width: 20%; font-weight: 800; font-size: 18px;">SKU</th>
              <th style="padding: 15px; text-align: right; border: 1px solid #ddd; width: 10%; font-weight: 800; font-size: 18px;">Qty</th>
              ${
                showItemPrices
                  ? `
              <th style="padding: 15px; text-align: right; border: 1px solid #ddd; width: 15%; font-weight: 800; font-size: 18px;">Unit Price</th>
              `
                  : ""
              }
              <th style="padding: 15px; text-align: right; border: 1px solid #ddd; width: ${showItemPrices ? "10%" : "10%"}; font-weight: 800; font-size: 18px;">Total</th>
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
                </td>
                <td style="padding: 15px; border: 1px solid #ddd; vertical-align: top; font-weight: 600;">${this.getItemSKU(item)}</td>
                <td style="padding: 15px; text-align: right; border: 1px solid #ddd; vertical-align: top; font-weight: 600;">${item.quantity}</td>
                ${
                  showItemPrices
                    ? `
                <td style="padding: 15px; text-align: right; border: 1px solid #ddd; vertical-align: top; font-weight: 600;">R${this.formatNumber(item.price)}</td>
                `
                    : ""
                }
                <td style="padding: 15px; text-align: right; border: 1px solid #ddd; vertical-align: top; font-weight: 700;">R${this.formatNumber(item.total)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        ${
          safeData.notes
            ? `
          <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 5px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #92400e; margin: 0 0 12px 0; font-weight: 800; font-size: 20px;">Notes & Terms</h4>
            <div style="white-space: pre-line; font-weight: 600; font-size: 16px;">${safeData.notes}</div>
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
            safeData.tax && safeData.tax > 0
              ? `
            <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 2px solid #ddd; font-size: 18px; font-weight: 700;">
              <span>VAT (${this.formatNumber(safeData.taxPercent || 15, 0)}%):</span>
              <span>R${this.formatNumber(safeData.tax)}</span>
            </div>
          `
              : ""
          }
          ${
            safeData.deliveryFee > 0
              ? `
            <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 2px solid #ddd; font-size: 18px; font-weight: 700;">
              <span>Delivery Fee:</span>
              <span>R${this.formatNumber(safeData.deliveryFee)}</span>
            </div>
          `
              : ""
          }
          <div style="display: flex; justify-content: space-between; padding: 20px 0; border-top: 3px solid #333; border-bottom: 3px solid #333; font-weight: 800; font-size: 24px; margin-top: 15px;">
            <span>TOTAL:</span>
            <span>R${this.formatNumber(safeData.total)}</span>
          </div>
        </div>

        <div style="clear: both; margin-top: 25px; padding: 20px; background: #e8f5e9; border-radius: 5px; font-size: 18px; font-weight: 700;">
          <div><strong style="font-weight: 800;">Quotation Expiry:</strong> ${this.formatExpiryDate(safeData.expiryDate)}</div>
          <div><strong style="font-weight: 800;">To accept this quotation:</strong> Please contact us at ${this.companyInfo.phone} or reply to this email</div>
        </div>

        <div style="clear: both; margin-top: 40px; padding-top: 25px; border-top: 3px solid #333; text-align: center;">
          <div style="font-size: 24px; font-weight: 800; margin-bottom: 15px;">Thank You for Considering Our Services!</div>
          <div style="color: #666; font-size: 18px; font-weight: 600;">For any queries, please contact us at ${this.companyInfo.phone}</div>
        </div>
      </div>
    `;
  }

  private generateThermalQuotation(
    data: QuotationData,
    includePrintButton: boolean = true,
    showItemPrices: boolean = true
  ): string {
    const hasLogo = data.company.logo;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation ${data.quoteNumber}</title>
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
          }
          .print-button {
            display: ${includePrintButton ? "block" : "none"};
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
          .print-button:hover {
            background-color: #0056b3;
          }
          .print-button:active {
            background-color: #004085;
          }
          .center { text-align: center; }
          .bold { font-weight: 800; }
          .extra-bold { font-weight: 900; }
          .line { border-top: 2px solid #000; margin: 5px 0; }
          .item-row { margin: 5px 0; }
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
          .total-row { 
            font-weight: 900;
            font-size: 16px;
          }
          .header { 
            margin-bottom: 10px;
            font-weight: 800;
          }
          .footer { 
            margin-top: 10px; 
            font-size: 12px;
            font-weight: 700;
          }
          .text-small { 
            font-size: 12px;
            font-weight: 700;
          }
          .text-xsmall { 
            font-size: 11px;
            font-weight: 700;
          }
          .logo { 
            max-width: 100%; 
            height: auto; 
            margin-bottom: 20px;
            max-height: 150px;
            object-fit: contain;
            width: 100%;
          }
          .column-layout {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-weight: 700;
          }
          .item-container {
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px dotted #ccc;
          }
          .section-title {
            font-weight: 900;
            font-size: 16px;
            text-align: center;
            margin: 8px 0;
          }
          .quotation-number {
            font-weight: 900;
            font-size: 18px;
            text-align: center;
            margin: 5px 0;
          }
          .customer-info {
            font-weight: 700;
            margin: 3px 0;
          }
          .expiry-info {
            font-weight: 800;
            margin: 5px 0;
            color: #dc2626;
          }
          .price-column {
            display: ${showItemPrices ? "block" : "none"};
          }
        </style>
        <script>
          function printQuotation() {
            window.print();
          }
        </script>
      </head>
      <body>
        ${
          includePrintButton
            ? `
        <button class="print-button" onclick="printQuotation()">
          🖨️ Print Quotation
        </button>
        `
            : ""
        }
        
        <div class="header center">
          ${hasLogo ? `<img src="${data.company.logo}" alt="${data.company.name}" class="logo">` : ""}
          <div class="bold extra-bold" style="font-size: 24px; margin: 5px 0;">${data.company.name}</div>
          <div class="text-small">${data.company.address}</div>
          <div class="text-small">Tel: ${data.company.phone}</div>
          <div class="text-small">Email: ${data.company.email}</div>
          ${data.company.taxNumber ? `<div class="text-small">VAT: ${data.company.taxNumber}</div>` : ""}
        </div>
        
        <div class="line"></div>
        
        <div class="center">
          <div class="extra-bold quotation-number">${data.quoteNumber}</div>
          <div class="text-small">${this.formatDate(data.date)}</div>
        </div>
        
        <div class="line"></div>
        
        <div class="text-small">
          <div class="column-layout expiry-info">
            <div>Valid Until:</div>
            <div>${this.formatExpiryDate(data.expiryDate)}</div>
          </div>
          ${data.customerName ? `<div class="column-layout customer-info"><div>Customer:</div><div>${data.customerName}</div></div>` : ""}
          ${data.customerPhone ? `<div class="column-layout customer-info"><div>Phone:</div><div>${data.customerPhone}</div></div>` : ""}
          ${data.createdBy ? `<div class="column-layout customer-info"><div>Prepared by:</div><div>${data.createdBy}</div></div>` : ""}
          ${
            data.isDelivery && data.deliveryAddress
              ? `<div class="column-layout customer-info"><div>Delivery:</div><div>${data.deliveryAddress}</div></div>`
              : ""
          }
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
                ${
                  showItemPrices
                    ? `
                <div class="price-column">${item.quantity} x R${this.formatNumber(item.price)}</div>
                `
                    : ""
                }
                <div>Qty: ${item.quantity}</div>
              </div>
              ${
                showItemPrices
                  ? `
              <div class="item-details">
                <div></div>
                <div class="bold">R${this.formatNumber(item.total)}</div>
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
          data.notes
            ? `
          <div class="line"></div>
          <div class="text-xsmall">
            <div class="bold extra-bold">Notes:</div>
            <div>${data.notes}</div>
          </div>
          <div class="line"></div>
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
            data.tax && data.tax > 0
              ? `
            <div class="column-layout">
              <div>VAT (${this.formatNumber(data.taxPercent || 15, 0)}%):</div>
              <div>R${this.formatNumber(data.tax)}</div>
            </div>
          `
              : ""
          }
          ${
            data.deliveryFee > 0
              ? `
            <div class="column-layout">
              <div>Delivery Fee:</div>
              <div>R${this.formatNumber(data.deliveryFee)}</div>
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
        
        <div class="section-title">VALIDITY</div>
        
        <div class="text-small">
          <div class="column-layout expiry-info">
            <div>Valid Until:</div>
            <div>${this.formatExpiryDate(data.expiryDate)}</div>
          </div>
          <div class="column-layout customer-info">
            <div>Contact:</div>
            <div>${data.company.phone}</div>
          </div>
        </div>
        
        <div class="line"></div>
        
        <div class="footer center">
          <div class="bold">Thank you for considering our services!</div>
          <div>Please contact us to accept this quotation</div>
        </div>
      </body>
      </html>
    `;
  }

  private generateA4Quotation(
    data: QuotationData,
    includePrintButton: boolean = true,
    showItemPrices: boolean = true
  ): string {
    const hasLogo = data.company.logo;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation ${data.quoteNumber}</title>
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
            font-weight: 600;
          }
          .print-button {
            display: ${includePrintButton ? "block" : "none"};
            width: 100%;
            background-color: #007bff;
            color: white;
            border: none;
            padding: 15px;
            font-size: 18px;
            font-weight: 900;
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
            border-bottom: 3px solid #333;
            padding-bottom: 30px;
          }
          .company-name { 
            font-size: 28px;
            font-weight: 900;
            margin-bottom: 15px;
          }
          .quotation-title {
            font-size: 24px;
            font-weight: 900;
            margin: 25px 0;
            text-align: center;
          }
          .info-section {
            margin: 25px 0;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 700;
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 25px 0; 
            font-size: 15px;
          }
          .items-table th, .items-table td { 
            border: 2px solid #ddd;
            padding: 15px;
            text-align: left; 
            vertical-align: top;
          }
          .items-table th { 
            background-color: #333; 
            color: white;
            font-weight: 900;
            font-size: 17px;
          }
          .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .totals { 
            margin-top: 25px;
            float: right;
            width: 350px;
          }
          .totals-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 12px 0;
            border-bottom: 2px solid #ddd;
            font-size: 17px;
            font-weight: 700;
          }
          .total-row { 
            font-weight: 900;
            font-size: 22px;
            border-top: 3px solid #333;
            border-bottom: 3px solid #333;
            margin-top: 15px;
            padding-top: 15px;
          }
          .footer {
            clear: both;
            margin-top: 50px;
            text-align: center;
            padding-top: 25px;
            border-top: 3px solid #333;
            font-size: 18px;
          }
          .quotation-info {
            margin: 25px 0;
            padding: 20px;
            background: #e8f5e9;
            border-radius: 5px;
            font-size: 17px;
            font-weight: 800;
          }
          .notes-section {
            background: #fef3c7;
            border: 2px solid #fbbf24;
            border-radius: 5px;
            padding: 20px;
            margin: 25px 0;
            font-weight: 700;
          }
          .logo {
            height: 300px;
            max-width: 100%;
            margin-bottom: 30px;
            object-fit: contain;
            width: auto;
          }
          .highlight {
            font-weight: 900;
            color: #333;
          }
          .quotation-number-display {
            font-size: 26px;
            font-weight: 900;
            color: #2c5282;
            text-align: center;
            margin: 10px 0;
          }
          .expiry-warning {
            color: #dc2626;
            font-weight: 800;
          }
          .product-name {
            word-wrap: break-word;
            white-space: normal;
            max-width: 200px;
            font-weight: 700;
          }
          .price-column {
            display: ${showItemPrices ? "table-cell" : "none"};
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
          function printQuotation() {
            window.print();
          }
        </script>
      </head>
      <body>
        ${
          includePrintButton
            ? `
        <button class="print-button" onclick="printQuotation()">
          🖨️ Print Quotation
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
          ${data.company.website ? `<div style="font-weight: 700; font-size: 16px;">Website: ${data.company.website}</div>` : ""}
        </div>

        <div class="quotation-title">QUOTATION</div>
        
        <div class="quotation-number-display">${data.quoteNumber}</div>
        
        <div class="info-section">
          <div><strong>Date:</strong> ${this.formatDate(data.date)}</div>
          <div class="expiry-warning"><strong>Valid Until:</strong> ${this.formatExpiryDate(data.expiryDate)}</div>
          ${data.customerName ? `<div><strong>Customer:</strong> ${data.customerName}</div>` : ""}
          ${data.customerPhone ? `<div><strong>Phone:</strong> ${data.customerPhone}</div>` : ""}
          ${data.customerEmail ? `<div><strong>Email:</strong> ${data.customerEmail}</div>` : ""}
          ${data.createdBy ? `<div><strong>Prepared by:</strong> ${data.createdBy}</div>` : ""}
          ${
            data.isDelivery && data.deliveryAddress
              ? `
            <div><strong>Delivery Address:</strong> ${data.deliveryAddress}</div>
            ${
              data.deliveryInstructions
                ? `<div><strong>Delivery Instructions:</strong> ${data.deliveryInstructions}</div>`
                : ""
            }
          `
              : ""
          }
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: ${showItemPrices ? "40%" : "50%"};">Item</th>
              <th style="width: 20%;">SKU</th>
              <th style="width: 10%; text-align: right;">Qty</th>
              ${
                showItemPrices
                  ? `
              <th class="price-column" style="width: 15%; text-align: right;">Unit Price</th>
              `
                  : ""
              }
              <th style="width: ${showItemPrices ? "15%" : "20%"}; text-align: right;">Total</th>
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
                <td style="font-weight: 700;">${this.getItemSKU(item)}</td>
                <td style="text-align: right; font-weight: 700;">${item.quantity}</td>
                ${
                  showItemPrices
                    ? `
                <td class="price-column" style="text-align: right; font-weight: 700;">R${this.formatNumber(item.price)}</td>
                `
                    : ""
                }
                <td style="text-align: right; font-weight: 800;">R${this.formatNumber(item.total)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        ${
          data.notes
            ? `
          <div class="notes-section">
            <div style="font-weight: 900; color: #92400e; margin-bottom: 12px; font-size: 18px;">
              Notes & Terms
            </div>
            <div style="white-space: pre-line; font-weight: 600; font-size: 16px;">
              ${data.notes}
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
            data.tax && data.tax > 0
              ? `
            <div class="totals-row">
              <span>VAT (${this.formatNumber(data.taxPercent || 15, 0)}%):</span>
              <span>R${this.formatNumber(data.tax)}</span>
            </div>
          `
              : ""
          }
          ${
            data.deliveryFee > 0
              ? `
            <div class="totals-row">
              <span>Delivery Fee:</span>
              <span>R${this.formatNumber(data.deliveryFee)}</span>
            </div>
          `
              : ""
          }
          <div class="totals-row total-row">
            <span>TOTAL:</span>
            <span class="highlight">R${this.formatNumber(data.total)}</span>
          </div>
        </div>

        <div class="quotation-info">
          <div class="expiry-warning"><strong>Quotation Expiry:</strong> ${this.formatExpiryDate(data.expiryDate)}</div>
          <div><strong>To accept this quotation:</strong> Please contact us at ${data.company.phone} or email ${data.company.email}</div>
        </div>

        <div class="footer">
          <div style="font-size: 22px; font-weight: 900; margin-bottom: 15px;">Thank You for Considering Our Services!</div>
          <div style="font-weight: 800;">For any queries, please contact us at ${data.company.phone} or ${data.company.email}</div>
        </div>
      </body>
      </html>
    `;
  }

  async generateQuotationPDF(
    quoteData: any,
    size: QuotationSize = "thermal",
    showItemPrices: boolean = true
  ): Promise<Blob> {
    const htmlContent = await this.generateQuotationHTML(
      quoteData,
      size,
      false,
      showItemPrices
    );
    const blob = new Blob([htmlContent], { type: "text/html" });
    return blob;
  }

  async downloadQuotation(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async printQuotation(
    quoteData: any,
    size: QuotationSize = "thermal",
    showItemPrices: boolean = true
  ): Promise<void> {
    const htmlContent = await this.generateQuotationHTML(
      quoteData,
      size,
      true,
      showItemPrices
    );
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    }
  }
}

export const quotationGenerator = new QuotationGenerator();
