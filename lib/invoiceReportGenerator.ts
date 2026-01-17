import { InvoiceProps } from "@/types/invoice";

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
}

// Type for combined service calculations
interface CombinedServiceData {
  description: string;
  quantity: number;
  unitPrice: number;
  linePrice: number;
  discountInput: string;
  vat: number;
  total: number;
  individualServices: Array<{
    description: string;
    qty: number;
    unitPrice: number;
    linePrice: number;
    discountInput: string;
    vat: number;
    total: number;
  }>;
  displayType: "combined-service";
}

export class InvoiceReportGenerator {
  private static decimalToNumber(decimalValue: any): number {
    if (decimalValue === null || decimalValue === undefined) return 0;
    if (typeof decimalValue === "number") return decimalValue;
    if (typeof decimalValue === "string") return parseFloat(decimalValue) || 0;
    if (typeof decimalValue === "object")
      return parseFloat(decimalValue.toString()) || 0;
    return 0;
  }

  private static formatMoney(amount: number): string {
    return amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  static generateInvoiceReportHTML(
    invoice: InvoiceProps,
    companyInfo?: CompanyInfo | null
  ): string {
    // --- COLORS ---
    const colorRed = "#990000";
    const colorGold = "#C5A005";
    const headerGreenBg = "#D1FAE5";
    const headerGreenText = "#065F46";

    // --- DATA PREPARATION ---
    const issueDate = new Date(invoice.issueDate).toLocaleDateString("en-GB");
    const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-GB");

    const cName = companyInfo?.companyName || "";
    const cAddress = companyInfo?.address || "";
    const cCity = companyInfo?.city || "";
    const cCode = companyInfo?.postCode || "";
    const cProv = companyInfo?.province || "";
    const cVat = companyInfo?.taxId || "";
    const cPhone = companyInfo?.phone || "";
    const cPhone2 = companyInfo?.phone2 || "";
    const cEmail = companyInfo?.email || "";
    const cWeb = companyInfo?.website || "";
    const logo = companyInfo?.logo || "";

    // --- SEPARATE ITEMS INTO PRODUCTS AND SERVICES ---
    const productItems: Array<{
      description: string;
      qty: number;
      unitPrice: number;
      linePrice: number;
      discountInput: string;
      vat: number;
      total: number;
    }> = [];

    const serviceItems: Array<{
      description: string;
      qty: number;
      unitPrice: number;
      linePrice: number;
      discountInput: string;
      vat: number;
      total: number;
    }> = [];

    // Track totals for calculations
    let subtotalNet = 0;
    let totalVat = 0;
    let totalDiscountMoney = 0;

    // Process all items
    invoice.items.forEach((item) => {
      const qty = this.decimalToNumber(item.quantity);
      const unitPrice = this.decimalToNumber(item.unitPrice);
      const taxRate = this.decimalToNumber(item.taxRate);
      const linePrice = qty * unitPrice; // Total price before discount

      let discountVal = 0;
      const discountInput = this.decimalToNumber(item.itemDiscountAmount);

      if (item.itemDiscountType === "PERCENTAGE") {
        discountVal = linePrice * (discountInput / 100);
      } else if (item.itemDiscountType === "AMOUNT") {
        discountVal = discountInput;
      }

      const net = linePrice - discountVal;
      const vat = net * (taxRate / 100);
      const total = net + vat;

      subtotalNet += net;
      totalVat += vat;
      totalDiscountMoney += discountVal;

      const itemData = {
        description: item.description,
        qty,
        unitPrice,
        linePrice,
        discountInput:
          item.itemDiscountType === "PERCENTAGE" ? `${discountInput}` : "0.00",
        vat,
        total,
      };

      // Determine if item is product or service
      if (item.shopProductId) {
        productItems.push(itemData);
      } else if (item.serviceId) {
        serviceItems.push(itemData);
      } else {
        // If no IDs, check description for hints or default to product
        const descLower = item.description?.toLowerCase() || "";
        if (
          descLower.includes("service") ||
          descLower.includes("labour") ||
          descLower.includes("install")
        ) {
          serviceItems.push(itemData);
        } else {
          productItems.push(itemData);
        }
      }
    });

    // --- CREATE COMBINED SERVICES ROW ---
    let combinedServiceData: CombinedServiceData | null = null;

    if (serviceItems.length > 0) {
      // Calculate combined totals
      let totalQuantity = 0;
      let totalLinePrice = 0;
      let totalDiscount = 0;
      let totalNet = 0;
      let totalVatServices = 0;
      let totalAmountServices = 0;
      const serviceDescriptions: string[] = [];

      serviceItems.forEach((service) => {
        totalQuantity += service.qty;
        totalLinePrice += service.linePrice;
        totalDiscount +=
          service.discountInput !== "0.00"
            ? (service.linePrice * parseFloat(service.discountInput)) / 100
            : 0;
        totalNet += service.total - service.vat;
        totalVatServices += service.vat;
        totalAmountServices += service.total;

        if (service.description) {
          serviceDescriptions.push(service.description);
        }
      });

      // Calculate weighted average unit price (not shown but used for calculations)
      const averageUnitPrice =
        totalQuantity > 0 ? totalLinePrice / totalQuantity : 0;

      // Calculate combined discount percentage
      const combinedDiscountPercent =
        totalLinePrice > 0
          ? ((totalDiscount / totalLinePrice) * 100).toFixed(1)
          : "0.0";

      combinedServiceData = {
        description: `Services Package (${serviceItems.length} services)`,
        quantity: totalQuantity,
        unitPrice: averageUnitPrice,
        linePrice: totalLinePrice,
        discountInput: serviceItems.some((s) => s.discountInput !== "0.00")
          ? combinedDiscountPercent
          : "0.00",
        vat: totalVatServices,
        total: totalAmountServices,
        individualServices: serviceItems,
        displayType: "combined-service",
      };
    }

    // --- CALCULATE GLOBAL DISCOUNT AND FINAL TOTALS ---
    let globalDiscVal = 0;
    const globalDiscInput = this.decimalToNumber(invoice.discountAmount);
    if (invoice.discountType === "PERCENTAGE") {
      globalDiscVal = subtotalNet * (globalDiscInput / 100);
    } else if (invoice.discountType === "AMOUNT") {
      globalDiscVal = globalDiscInput;
    }

    const finalSubtotalExVat = subtotalNet - globalDiscVal;
    const vatRatio = subtotalNet > 0 ? finalSubtotalExVat / subtotalNet : 1;
    const finalVat = totalVat * vatRatio;
    const finalTotal = finalSubtotalExVat + finalVat;

    const totalDiscountDisplay = totalDiscountMoney + globalDiscVal;

    // --- BUILD TABLE ROWS ---
    const tableRows: string[] = [];

    // Add product rows
    productItems.forEach((item) => {
      tableRows.push(`
        <tr>
          <td class="col-code"> </td>
          <td class="col-desc">${item.description}</td>
          <td class="col-qty">${item.qty}</td>
          <td class="col-unit-price">${this.formatMoney(item.unitPrice)}</td>
          <td class="col-line-price">${this.formatMoney(item.linePrice)}</td>
          <td class="col-disc">${item.discountInput === "0.00" ? "-" : item.discountInput}</td>
          <td class="col-vat">${this.formatMoney(item.vat)}</td>
          <td class="col-total">${this.formatMoney(item.total)}</td>
        </tr>
      `);
    });

    // Add combined services row if exists
    if (combinedServiceData) {
      tableRows.push(`
        <tr style="background-color: #f8fafc;">
          <td class="col-code">SVC</td>
          <td class="col-desc">
            <strong>${combinedServiceData.description}</strong>
            <div style="font-size: 8px; color: #666; margin-top: 2px; font-style: italic;">
              Includes:
              <ul style="margin: 2px 0 0 12px; padding: 0;">
                ${serviceItems
                  .slice(0, 3)
                  .map(
                    (s) =>
                      `<li style="list-style-type: disc; margin-left: 8px;">
                        ${s.description}
                      </li>`
                  )
                  .join("")}
              </ul>
              ${
                serviceItems.length > 3
                  ? `<div style="margin-left: 12px;">
                     and ${serviceItems.length - 3} more
                   </div>`
                  : ""
              }
            </div>
          </td>
          <td class="col-qty">${combinedServiceData.quantity}</td>
          <td class="col-unit-price">-</td>
          <td class="col-line-price">${this.formatMoney(combinedServiceData.linePrice)}</td>
          <td class="col-disc">${combinedServiceData.discountInput === "0.00" ? "-" : combinedServiceData.discountInput}</td>
          <td class="col-vat">${this.formatMoney(combinedServiceData.vat)}</td>
          <td class="col-total"><strong>${this.formatMoney(combinedServiceData.total)}</strong></td>
        </tr>
      `);
    } else if (serviceItems.length > 0) {
      // If not combined, show services individually
      serviceItems.forEach((item) => {
        tableRows.push(`
          <tr>
            <td class="col-code">SVC</td>
            <td class="col-desc">${item.description}</td>
            <td class="col-qty">${item.qty}</td>
            <td class="col-unit-price">${this.formatMoney(item.unitPrice)}</td>
            <td class="col-line-price">${this.formatMoney(item.linePrice)}</td>
            <td class="col-disc">${item.discountInput === "0.00" ? "-" : item.discountInput}</td>
            <td class="col-vat">${this.formatMoney(item.vat)}</td>
            <td class="col-total">${this.formatMoney(item.total)}</td>
          </tr>
        `);
      });
    }

    // Payments Logic
    // Assuming invoice.payments exists on InvoiceProps, otherwise use depositAmount
    const totalPaid = (invoice.payments || []).reduce(
      (sum: number, p: any) => sum + this.decimalToNumber(p.amount),
      0
    );
    const balanceDue = finalTotal - totalPaid;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;700&display=swap');
            body { font-family: Arial, sans-serif; margin: 0; padding: 40px; font-size: 10px; color: #000; line-height: 1.3; }
            .row { display: flex; width: 100%; gap: 20px; }
            .col-left { width: 60%; }
            .col-right { width: 40%; }
            .logo-img { width: 180px; margin-bottom: 10px; }
            .company-header { font-size: 20px; font-weight: bold; color: #d4af37; margin-bottom: 5px; }
            .company-header span { color: ${colorRed}; }
            .address-block, .reg-info, .contact-info { margin-bottom: 8px; }
            .quote-title-main { font-size: 22px; color: ${colorRed}; font-weight: bold; text-align: right; margin-bottom: 15px; }
            
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .details-table td { border: none; padding: 4px 8px; font-weight: bold; }
            .label-cell { width: 40%; text-align: left; color: #555; }
            .value-cell { width: 60%; text-align: right; }

            .client-box-label { font-weight: bold; margin-bottom: 2px; color: #555; }
            .client-box { border: 1px solid #ddd; border-radius: 4px; padding: 10px; min-height: 80px; background-color: #fdfdfd; }
            .client-name { font-weight: bold; font-size: 11px; margin-bottom: 4px; }

            .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .items-table th { border: none; padding: 8px 6px; background-color: ${headerGreenBg}; color: ${headerGreenText}; font-weight: bold; text-align: center; font-size: 9px; text-transform: uppercase; }
            .items-table td { border: none; border-bottom: 1px solid #f0f0f0; padding: 8px 6px; vertical-align: top; font-size: 10px; }
            
            /* Updated column widths for both price columns */
            .col-code { width: 6%; text-align: center; }
            .col-desc { width: 28%; text-align: left; }
            .col-qty { width: 8%; text-align: center; }
            .col-unit-price { width: 10%; text-align: right; }
            .col-line-price { width: 10%; text-align: right; }
            .col-disc { width: 8%; text-align: center; }
            .col-vat { width: 10%; text-align: right; }
            .col-total { width: 10%; text-align: right; }

            .totals-wrapper { display: flex; justify-content: flex-end; margin-top: 20px; }
            .totals-table { width: 300px; border-collapse: collapse; }
            .totals-table td { border: none; padding: 6px 8px; font-weight: bold; font-size: 11px; }
            .text-right { text-align: right; }

            .terms-section { margin-top: 30px; }
            .terms-title { font-weight: bold; font-size: 11px; margin-bottom: 5px; text-transform: uppercase; color: ${headerGreenText}; }
            .terms-list { padding-left: 15px; margin: 0; }
            .terms-list li { margin-bottom: 2px; }

            .footer-strip { margin-top: 40px; border-top: 1px solid #eee; padding: 10px 5px; text-align: center; font-size: 9px; font-weight: bold; color: #555; }
            
            @page { size: A4; margin: 1cm; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="row">
            <div class="col-left">
              ${logo ? `<img src="${logo}" class="logo-img" />` : ""}
              ${!logo ? `<div class="company-header">${cName}</div>` : ""}
              <div class="address-block">
                <strong>${cName}</strong><br>
                ${cAddress}<br>
                ${cCity} ${cCode}<br>
                ${cProv}
              </div>
              ${cVat ? `<div class="reg-info">VAT No.: ${cVat}</div>` : ""}
              <div class="contact-info">
                ${cPhone ? `${cPhone}<br>` : ""}
                ${cPhone2 ? `${cPhone2}<br>` : ""}
                ${cEmail ? `${cEmail}` : ""}
              </div>
            </div>
            <div class="col-right">
              <div class="quote-title-main">INVOICE</div>
              <table class="details-table">
                <tr><td class="label-cell">Invoice No.:</td><td class="value-cell">${invoice.invoiceNumber}</td></tr>
                <tr><td class="label-cell">Date:</td><td class="value-cell">${issueDate}</td></tr>
                <tr><td class="label-cell">Due Date:</td><td class="value-cell">${dueDate}</td></tr>
              </table>
              <div class="client-box-label">BILL TO</div>
              <div class="client-box">
                <div class="client-name">${invoice.client.company || invoice.client.name}</div>
                ${invoice.client.address || ""}<br>
                ${invoice.client.town || ""} ${invoice.client.village || ""}<br>
                ${invoice.client.province || "South Africa"}
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th class="col-code">CODE</th>
                <th class="col-desc">DESCRIPTION</th>
                <th class="col-qty">QTY</th>
                <th class="col-unit-price">UNIT PRICE (R)</th>
                <th class="col-line-price">PRICE (R)</th>
                <th class="col-disc">DISC %</th>
                <th class="col-vat">VAT (R)</th>
                <th class="col-total">TOTAL (R)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows.join("")}
            </tbody>
          </table>

          <div class="totals-wrapper">
            <table class="totals-table">
              ${
                totalDiscountDisplay > 0
                  ? `<tr><td class="label-cell">DISCOUNT:</td><td class="text-right">R${this.formatMoney(totalDiscountDisplay)}</td></tr>`
                  : ""
              }
              <tr><td class="label-cell">SUBTOTAL:</td><td class="text-right">R${this.formatMoney(subtotalNet)}</td></tr>
              <tr><td class="label-cell">VAT 15%:</td><td class="text-right">R${this.formatMoney(finalVat)}</td></tr>
              <tr style="border-top: 2px solid ${headerGreenText}; color: ${headerGreenText};">
                <td class="label-cell" style="font-size: 12px;">TOTAL:</td>
                <td class="text-right" style="font-size: 12px;">R${this.formatMoney(finalTotal)}</td>
              </tr>
              ${
                totalPaid > 0
                  ? `
              <tr><td class="label-cell" style="color: ${colorGold}">PAID:</td><td class="text-right" style="color: ${colorGold}">R${this.formatMoney(totalPaid)}</td></tr>
              <tr><td class="label-cell" style="color: ${colorRed}">BALANCE DUE:</td><td class="text-right" style="color: ${colorRed}">R${this.formatMoney(balanceDue)}</td></tr>
              `
                  : ""
              }
            </table>
          </div>

          <div class="terms-section">
            <div class="terms-title"></div>
            <div style="margin-bottom: 10px;">${invoice.paymentTerms || "Payment due on receipt."}</div>
            <div class="terms-title"></div>
            <div>${invoice.notes || "Thank you for your business."}</div>
          </div>

          <div class="footer-strip">
            Account holder: ${companyInfo?.companyName || ""} &nbsp;&nbsp;
            Bank: ${companyInfo?.bankName || ""} Account No.: ${companyInfo?.bankAccount || ""} &nbsp;&nbsp;
            Bank: ${companyInfo?.bankName2 || ""}  Account No.: ${companyInfo?.bankAccount2 || ""}
          </div>

        </body>
      </html>
    `;
  }
}
