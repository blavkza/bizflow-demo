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

export class QuotationDeliveryNoteGenerator {
  private static decimalToNumber(decimalValue: any): number {
    if (decimalValue === null || decimalValue === undefined) return 0;
    if (typeof decimalValue === "number") return decimalValue;
    if (typeof decimalValue === "string") return parseFloat(decimalValue) || 0;
    if (decimalValue && typeof decimalValue === "object") {
      return parseFloat(decimalValue.toString()) || 0;
    }
    return 0;
  }

  static generateDeliveryNoteHTML(
    quotation: QuotationWithRelations,
    companyInfo?: CompanyInfo | null,
    showPrices: boolean = false,
    title: string = "DELIVERY NOTE"
  ): string {
    // --- Colors ---
    const headerBlueBg = "#E0F2FE"; // Light Blue
    const headerBlueText = "#075985"; // Dark Blue text for contrast
    const accentColor = "#075985";

    // --- Data Preparation ---
    const issueDate = new Date(quotation.issueDate).toLocaleDateString("en-GB");
    const validUntil = new Date(quotation.validUntil).toLocaleDateString(
      "en-GB"
    );

    // Company Information
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

    // Filter only product items (items with shopProductId)
    const productItems = quotation.items.filter((item) => item.shopProductId);

    // If no product items, show all items
    const itemsToShow =
      productItems.length > 0 ? productItems : quotation.items;

    // Calculate totals
    let totalQuantity = 0;
    let totalProducts = 0;

    const items = itemsToShow.map((item, index) => {
      const qty = this.decimalToNumber(item.quantity);
      totalQuantity += qty;
      totalProducts++;

      return {
        srNo: index + 1,
        description: item.description,
        qty,
        // Only include price if showPrices is true
        price: showPrices ? this.decimalToNumber(item.unitPrice) : null,
        notes: item.notes || "",
      };
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${quotation.quotationNumber}</title>
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
            .row { 
              display: flex; 
              width: 100%; 
              gap: 20px; 
              margin-bottom: 20px;
            }
            .col-left { 
              width: 60%; 
            }
            .col-right { 
              width: 40%; 
            }

            /* Header */
            .logo-img { 
              width: 150px; 
              margin-bottom: 10px; 
            }
            .company-name { 
              font-size: 18px; 
              font-weight: bold; 
              color: ${accentColor}; 
              margin-bottom: 5px; 
            }
            
            .company-details { 
              font-size: 9px; 
              line-height: 1.2; 
            }
            
            /* Document Title */
            .document-title {
              font-size: 24px;
              color: ${accentColor};
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
              text-transform: uppercase;
              border-bottom: 2px solid ${accentColor};
              padding-bottom: 10px;
            }

            /* Document Details */
            .details-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 5px;
            }
            
            .details-left, .details-right {
              flex: 1;
            }
            
            .detail-row {
              display: flex;
              margin-bottom: 8px;
              align-items: center;
            }
            
            .detail-label {
              font-weight: bold;
              min-width: 120px;
              color: #555;
            }
            
            .detail-value {
              font-weight: bold;
              color: #000;
            }
            
            /* Client Information */
            .client-box {
              background-color: ${headerBlueBg};
              border-left: 4px solid ${accentColor};
              padding: 15px;
              margin-bottom: 20px;
              border-radius: 4px;
            }
            
            .client-title {
              font-weight: bold;
              color: ${headerBlueText};
              margin-bottom: 10px;
              font-size: 11px;
              text-transform: uppercase;
            }
            
            .client-name {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            /* Items Table */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              border: 1px solid #ddd;
            }
            
            .items-table th {
              border: 1px solid #ddd;
              padding: 10px 6px;
              background-color: ${headerBlueBg};
              color: ${headerBlueText};
              font-weight: bold;
              text-align: center;
              font-size: 9px;
              text-transform: uppercase;
            }
            
            .items-table td {
              border: 1px solid #ddd;
              padding: 8px 6px;
              vertical-align: top;
              font-size: 10px;
            }
            
            /* Column Widths - REMOVED PRODUCT CODE COLUMN */
            .col-sr { width: 8%; text-align: center; }
            .col-desc { width: ${showPrices ? "62%" : "72%"}; text-align: left; }
            .col-qty { width: 15%; text-align: center; }
            ${showPrices ? ".col-price { width: 15%; text-align: right; }" : ""}
            
            /* Summary Section */
            .summary-section {
              margin-top: 20px;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 5px;
              display: flex;
              justify-content: space-between;
            }
            
            .summary-item {
              text-align: center;
              flex: 1;
            }
            
            .summary-label {
              font-size: 9px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            
            .summary-value {
              font-size: 14px;
              font-weight: bold;
              color: ${accentColor};
            }
            
            /* Notes Section */
            .notes-section {
              margin-top: 30px;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background-color: #f9f9f9;
            }
            
            .notes-title {
              font-weight: bold;
              color: ${accentColor};
              margin-bottom: 10px;
              font-size: 11px;
            }
            
            /* Footer */
            .footer {
              margin-top: 40px;
              border-top: 2px solid #ddd;
              padding-top: 20px;
              text-align: center;
              font-size: 9px;
              color: #666;
            }
            
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            
            .signature-box {
              width: 45%;
              text-align: center;
            }
            
            .signature-line {
              border-top: 1px solid #000;
              margin: 40px 0 5px 0;
            }

            @page { 
              size: A4; 
              margin: 1cm; 
            }
            
            @media print { 
              body { 
                -webkit-print-color-adjust: exact; 
                padding: 20px;
              } 
            }
          </style>
        </head>
        <body>

          <!-- Header -->
          <div class="row">
            <div class="col-left">
              ${logo ? `<img src="${logo}" class="logo-img" />` : ""}
              
              ${!logo ? `<div class="company-name">${cName}</div>` : ""}

              <div class="company-details">
                <strong>${cName}</strong><br>
                ${cAddress}<br>
                ${cCity}, ${cCode}<br>
                ${cProv}<br>
                Co. Reg. No.: ${cReg}<br>
                VAT Reg. No.: ${cVat}
              </div>
            </div>

            <div class="col-right">
              <div class="company-details" style="text-align: right;">
                <strong>Contact Information:</strong><br>
                ${cContact}<br>
                Tel: ${cPhone}<br>
                Mobile: ${cPhone2}<br>
                Email: ${cEmail}<br>
                Website: ${cWeb}
              </div>
            </div>
          </div>

          <!-- Document Title -->
          <div class="document-title">
            ${title}
          </div>

          <!-- Document Details -->
          <div class="details-section">
            <div class="details-left">
              <div class="detail-row">
                <span class="detail-label">Document No:</span>
                <span class="detail-value">${quotation.quotationNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${issueDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Valid Until:</span>
                <span class="detail-value">${validUntil}</span>
              </div>
            </div>
            <div class="details-right">
              <div class="detail-row">
                <span class="detail-label">Reference:</span>
                <span class="detail-value">${quotation.title || "N/A"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Prepared By:</span>
                <span class="detail-value">${quotation.creator?.name || "N/A"}</span>
              </div>
            </div>
          </div>

          <!-- Client Information -->
          <div class="client-box">
            <div class="client-title">CLIENT INFORMATION</div>
            <div class="client-name">${quotation.client.name}</div>
            ${quotation.client.address || ""}<br>
            ${quotation.client.town || ""} ${quotation.client.village || ""}<br>
            ${quotation.client.province || "South Africa"}<br>
            Phone: ${quotation.client.phone || "N/A"}<br>
            Email: ${quotation.client.email || "N/A"}
          </div>

          <!-- Items Table (PRODUCT CODE COLUMN REMOVED) -->
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-sr">SR#</th>
                <th class="col-desc">DESCRIPTION</th>
                <th class="col-qty">QUANTITY</th>
                ${showPrices ? '<th class="col-price">UNIT PRICE (R)</th>' : ""}
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td class="col-sr">${item.srNo}</td>
                  <td class="col-desc">${item.description}</td>
                  <td class="col-qty">${item.qty}</td>
                  ${showPrices ? `<td class="col-price">R ${item.price ? item.price.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}</td>` : ""}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <!-- Summary Section -->
          <div class="summary-section">
            <div class="summary-item">
              <div class="summary-label">TOTAL ITEMS</div>
              <div class="summary-value">${totalProducts}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">TOTAL QUANTITY</div>
              <div class="summary-value">${totalQuantity}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">DOCUMENT TYPE</div>
              <div class="summary-value">${title}</div>
            </div>
          </div>

          <!-- Notes Section -->
          ${
            quotation.notes
              ? `
          <div class="notes-section">
            <div class="notes-title">NOTES & REMARKS</div>
            <div>${quotation.notes.replace(/\n/g, "<br>")}</div>
          </div>
          `
              : ""
          }

          ${
            quotation.deliveryTerms
              ? `
          <div class="notes-section">
            <div class="notes-title">DELIVERY TERMS</div>
            <div>${quotation.deliveryTerms.replace(/\n/g, "<br>")}</div>
          </div>
          `
              : ""
          }

          <!-- Signatures -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div>Authorized Signature</div>
              <div>${cName}</div>
              <div>Date: ___________________</div>
            </div>
            
            <div class="signature-box">
              <div class="signature-line"></div>
              <div>Client's Signature</div>
              <div>${quotation.client.name}</div>
              <div>Date: ___________________</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <strong>${cName}</strong> | 
            ${cAddress}, ${cCity}, ${cCode} | 
            Tel: ${cPhone} | 
            Email: ${cEmail} | 
            ${cWeb}
            <br>
            This document is computer generated and does not require a signature
          </div>

        </body>
      </html>
    `;
  }

  // Convenience method for Delivery Note without prices
  static generateDeliveryNoteWithoutPrices(
    quotation: QuotationWithRelations,
    companyInfo?: CompanyInfo | null
  ): string {
    return this.generateDeliveryNoteHTML(
      quotation,
      companyInfo,
      false,
      "DELIVERY NOTE"
    );
  }

  // Convenience method for Price Sheet with prices
  static generatePriceSheet(
    quotation: QuotationWithRelations,
    companyInfo?: CompanyInfo | null
  ): string {
    return this.generateDeliveryNoteHTML(
      quotation,
      companyInfo,
      true,
      "PRICE SHEET"
    );
  }

  // Convenience method for Packing List
  static generatePackingList(
    quotation: QuotationWithRelations,
    companyInfo?: CompanyInfo | null
  ): string {
    return this.generateDeliveryNoteHTML(
      quotation,
      companyInfo,
      false,
      "PACKING LIST"
    );
  }

  // Convenience method for Product List
  static generateProductList(
    quotation: QuotationWithRelations,
    companyInfo?: CompanyInfo | null
  ): string {
    return this.generateDeliveryNoteHTML(
      quotation,
      companyInfo,
      false,
      "PRODUCT LIST"
    );
  }
}
