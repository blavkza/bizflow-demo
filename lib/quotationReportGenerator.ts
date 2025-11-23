import { QuotationWithRelations } from "@/types/quotation";

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

export class QuotationReportGenerator {
  private static decimalToNumber(decimalValue: any): number {
    if (decimalValue === null || decimalValue === undefined) return 0;
    if (typeof decimalValue === "number") return decimalValue;
    if (typeof decimalValue === "string") return parseFloat(decimalValue) || 0;
    if (decimalValue && typeof decimalValue === "object") {
      return parseFloat(decimalValue.toString()) || 0;
    }
    return 0;
  }

  private static formatMoney(amount: number): string {
    return amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  static generateQuotationReportHTML(
    quotation: QuotationWithRelations,
    companyInfo?: CompanyInfo | null
  ): string {
    // --- COLORS ---
    const colorRed = "#A00000";
    const colorGold = "#C5A005";
    // New Green Colors
    const headerGreenBg = "#D1FAE5"; // Light Green
    const headerGreenText = "#065F46"; // Dark Green text for contrast

    // --- DATA PREPARATION ---
    const issueDate = new Date(quotation.issueDate).toLocaleDateString("en-GB");
    const validUntil = new Date(quotation.validUntil).toLocaleDateString(
      "en-GB"
    );

    const cName = companyInfo?.companyName || "NECS ENGINEERS";
    const cAddress = companyInfo?.address || "Shayandima 88 Khwevha street";
    const cCity = companyInfo?.city || "thohoyandou";
    const cCode = companyInfo?.postCode || "0945";
    const cProv = companyInfo?.province || "South Africa";
    const cReg = "2020/472506/07";
    const cVat = companyInfo?.taxId || "4020301364";
    const cContact = "Mr Ndou R";
    const cPhone = companyInfo?.phone || "015 023 1583";
    const cPhone2 = companyInfo?.phone2 || "0793750399";
    const cEmail = companyInfo?.email || "info@necsengineers.co.za";
    const cWeb = companyInfo?.website || "http://necsengineers.co.za/";
    const logo = companyInfo?.logo || "";

    // --- CALCULATIONS ---
    let subtotalNet = 0;
    let totalVat = 0;
    let totalDiscountMoney = 0;

    const items = quotation.items.map((item) => {
      const qty = this.decimalToNumber(item.quantity);
      const price = this.decimalToNumber(item.unitPrice);
      const taxRate = this.decimalToNumber(item.taxRate);

      const gross = qty * price;

      let discountVal = 0;
      const discountInput = this.decimalToNumber(item.itemDiscountAmount);

      if (item.itemDiscountType === "PERCENTAGE") {
        discountVal = gross * (discountInput / 100);
      } else if (item.itemDiscountType === "AMOUNT") {
        discountVal = discountInput;
      }

      const net = gross - discountVal;
      const vat = net * (taxRate / 100);
      const total = net + vat;

      subtotalNet += net;
      totalVat += vat;
      totalDiscountMoney += discountVal;

      return {
        description: item.description,
        qty,
        price,
        discountInput:
          item.itemDiscountType === "PERCENTAGE" ? `${discountInput}` : "0.00",
        vat,
        total,
      };
    });

    let globalDiscVal = 0;
    const globalDiscInput = this.decimalToNumber(quotation.discountAmount);
    if (quotation.discountType === "PERCENTAGE") {
      globalDiscVal = subtotalNet * (globalDiscInput / 100);
    } else if (quotation.discountType === "AMOUNT") {
      globalDiscVal = globalDiscInput;
    }

    const finalSubtotalExVat = subtotalNet - globalDiscVal;
    const vatRatio = subtotalNet > 0 ? finalSubtotalExVat / subtotalNet : 1;
    const finalVat = totalVat * vatRatio;
    const finalTotal = finalSubtotalExVat + finalVat;

    const totalDiscountDisplay = totalDiscountMoney + globalDiscVal;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quote ${quotation.quotationNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;700&display=swap');
            
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 40px;
              font-size: 10px;
              color: #000;
              line-height: 1.3;
            }

            /* Grid */
            .row { display: flex; width: 100%; gap: 20px; }
            .col-left { width: 60%; }
            .col-right { width: 40%; }

            /* Header Left */
            .logo-img { width: 180px; margin-bottom: 10px; }
            .company-header { font-size: 20px; font-weight: bold; color: #d4af37; margin-bottom: 5px; }
            .company-header span { color: ${colorRed}; }
            
            .address-block { margin-bottom: 8px; }
            .reg-info { margin-bottom: 8px; }
            .contact-info { margin-bottom: 8px; }
            
            /* Header Right */
            .quote-title-main {
              font-size: 22px;
              color: ${colorRed};
              font-weight: bold;
              text-align: right;
              margin-bottom: 15px;
            }

            /* Details Table - PLAIN (No Border) */
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .details-table td {
              border: none; /* Removed border */
              padding: 4px 8px;
              font-weight: bold;
            }
            .label-cell { width: 40%; text-align: left; color: #555; }
            .value-cell { width: 60%; text-align: right; }

            /* Client Box */
            .client-box-label { font-weight: bold; margin-bottom: 2px; color: #555; }
            .client-box {
              border: 1px solid #ddd; /* Softer border for client box */
              border-radius: 4px;
              padding: 10px;
              min-height: 80px;
              background-color: #fdfdfd;
            }
            .client-name { font-weight: bold; font-size: 11px; margin-bottom: 4px; }

            /* Main Items Table */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            
            /* Light Green Header */
            .items-table th {
              border: none;
              padding: 8px 6px;
              background-color: ${headerGreenBg};
              color: ${headerGreenText};
              font-weight: bold;
              text-align: center;
              font-size: 9px;
              text-transform: uppercase;
            }
            
            /* Plain Cells */
            .items-table td {
              border: none;
              border-bottom: 1px solid #f0f0f0; /* Very subtle divider */
              padding: 8px 6px;
              vertical-align: top;
              font-size: 10px;
            }
            
            /* Column Widths */
            .col-code { width: 8%; text-align: center; }
            .col-desc { width: 35%; text-align: left; }
            .col-qty { width: 10%; text-align: center; }
            .col-price { width: 12%; text-align: right; }
            .col-disc { width: 10%; text-align: center; }
            .col-vat { width: 12%; text-align: right; }
            .col-total { width: 13%; text-align: right; }

            /* Totals Table - Plain */
            .totals-wrapper {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .totals-table {
              width: 300px;
              border-collapse: collapse;
            }
            .totals-table td {
              border: none;
              padding: 6px 8px;
              font-weight: bold;
              font-size: 11px;
            }
            .text-right { text-align: right; }

            /* Terms & Conditions */
            .terms-section { margin-top: 30px; }
            .terms-title { 
              font-weight: bold; 
              font-size: 11px; 
              margin-bottom: 5px; 
              text-transform: uppercase;
              color: ${headerGreenText}; /* Matching header color */
            }
            .terms-list { padding-left: 15px; margin: 0; }
            .terms-list li { margin-bottom: 2px; }

            /* Footer Strip */
            .footer-strip {
              margin-top: 40px;
              border-top: 1px solid #eee;
              padding: 10px 5px;
              text-align: center;
              font-size: 9px;
              font-weight: bold;
              color: #555;
            }

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
                <strong>${cName}</strong>
                <br>
                 <span style="max-width: 200px; display: inline-block; word-wrap: break-word;">${cAddress}</span>
                 <br>                
                ${cCity}<br>  
                 ${cCode}
                <br>
                ${cProv}
              </div>

              <div class="reg-info">
                Co. Reg. No.: ${cReg}<br>
                VAT Reg. No.: ${cVat}
              </div>

              <div class="contact-info">
                ${cContact}<br>
                ${cPhone}<br>
                ${cPhone2}<br>
                ${cEmail}<br>
                ${cWeb}
              </div>
            </div>

            <div class="col-right">
              <div class="quote-title-main">QUOTATION</div>

              <table class="details-table">
                <tr>
                  <td class="label-cell">Quote No.:</td>
                  <td class="value-cell">${quotation.quotationNumber}</td>
                </tr>
                <tr>
                  <td class="label-cell">Issue date:</td>
                  <td class="value-cell">${issueDate}</td>
                </tr>
                <tr>
                  <td class="label-cell">Valid until:</td>
                  <td class="value-cell">${validUntil}</td>
                </tr>
              </table>

              <div class="client-box-label">FOR</div>
              <div class="client-box">
                <div class="client-name">${quotation.client.name}</div>
                ${quotation.client.address || ""}<br>
                ${quotation.client.town || ""} ${quotation.client.village || ""}<br>
                ${quotation.client.province || "South Africa"}
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th class="col-code">CODE</th>
                <th class="col-desc">DESCRIPTION</th>
                <th class="col-qty">QUANTITY</th>
                <th class="col-price">UNIT PRICE (R)</th>
                <th class="col-disc">DISCOUNT %</th>
                <th class="col-vat">VAT (R)</th>
                <th class="col-total">AMOUNT (R)</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td class="col-code"> </td>
                  <td class="col-desc">${item.description}</td>
                  <td class="col-qty">${item.qty}</td>
                  <td class="col-price">${this.formatMoney(item.price)}</td>
                  <td class="col-disc">${item.discountInput === "0.00" ? "-" : item.discountInput}</td>
                  <td class="col-vat">${this.formatMoney(item.vat)}</td>
                  <td class="col-total">${this.formatMoney(item.total)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals-wrapper">
            <table class="totals-table">
              ${
                totalDiscountDisplay > 0
                  ? `
              <tr>
                <td class="label-cell">DISCOUNT:</td>
                <td class="text-right">R${this.formatMoney(totalDiscountDisplay)}</td>
              </tr>`
                  : ""
              }
              
              <tr>
                <td class="label-cell">SUBTOTAL:</td>
                <td class="text-right">R${this.formatMoney(subtotalNet)}</td>
              </tr>
              
              <tr>
                <td class="label-cell">VAT 15%:</td>
                <td class="text-right">R${this.formatMoney(finalVat)}</td>
              </tr>
              
              <tr style="border-top: 2px solid ${headerGreenText}; color: ${headerGreenText};">
                <td class="label-cell" style="font-size: 12px;">TOTAL (ZAR):</td>
                <td class="text-right" style="font-size: 12px;">R${this.formatMoney(finalTotal)}</td>
              </tr>

              ${
                quotation.depositRequired
                  ? `
              <tr>
                <td class="label-cell" style="color: ${colorRed}">DEPOSIT REQ:</td>
                <td class="text-right" style="color: ${colorRed}">R${this.formatMoney(this.decimalToNumber(quotation.depositAmount))}</td>
              </tr>`
                  : ""
              }
            </table>
          </div>

          <div class="terms-section">
\            <ul class="terms-list">
             ${
               quotation.paymentTerms
                 ? `<li>${quotation.paymentTerms.replace(/\n/g, "</li><li>")}</li>`
                 : `
              <li>Note that if this is the new installation of new equipment you are given free callout fees up to 3 months.</li>
              <li>After 3 months callouts will be paid as follows:</li>
              <li><strong>Local (1-15km):</strong> R250 (Mon-Fri 07h00-17h00). R350 (After hours/Sat).</li>
              <li><strong>16km-50km:</strong> R450 (Mon-Fri). R550 (After hours).</li>
              <li><strong>+50km:</strong> R5 per km (Mon-Fri). R8 per km (After hours/Sat).</li>
            </ul>`
             }
          </div>

          <div class="terms-section" style="margin-top: 15px;">
            <ul class="terms-list">
              ${
                quotation.notes
                  ? `<li>${quotation.notes.replace(/\n/g, "</li><li>")}</li>`
                  : `
              <li>Warranty for repairs only/repairs take up to two months.</li>
              <li>No refund on any product.</li>
              <li>No warranty on any product connected wrongly.</li>
              <li>You must have this invoice as a proof of purchase for warranty claim.</li>
              <li>Warranty is chargeable even under warranty for parts only.</li>
              <li>Exchange within 7 days of purchase (product must not be used).</li>
              `
              }
            </ul>
          </div>

         
          </div>

          <div class="footer-strip">
            Account holder: ${companyInfo?.companyName || "NDOU ELECTRICAL CONSTRUCTION AND SUPPLY ENGINEERS"} &nbsp;&nbsp;
            Bank: ${companyInfo?.bankName || "FNB/RMB"} Account No.: ${companyInfo?.bankAccount || "62884849351"} &nbsp;&nbsp;
            Bank: ${companyInfo?.bankName2 || "CAPITEC"} Account No.: ${companyInfo?.bankAccount2 || "1052413331"}
          </div>

        </body>
      </html>
    `;
  }
}
