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
  // Helper function to safely convert Decimal to number
  private static decimalToNumber(decimalValue: any): number {
    if (decimalValue === null || decimalValue === undefined) return 0;
    if (typeof decimalValue === "number") return decimalValue;
    if (typeof decimalValue === "string") return parseFloat(decimalValue) || 0;
    // Handle Prisma Decimal type
    if (decimalValue && typeof decimalValue === "object") {
      return parseFloat(decimalValue.toString()) || 0;
    }
    return 0;
  }

  static generateQuotationReportHTML(
    quotation: QuotationWithRelations,
    companyInfo?: CompanyInfo | null
  ): string {
    const primaryColor = "#1F2937"; // Gray-800
    const secondaryColor = "#F3F4F6"; // Gray-100
    const accentColor = "#3B82F6"; // Blue-500

    // Calculate amounts safely using helper function
    const subtotal = quotation.items.reduce(
      (sum, item) =>
        sum +
        this.decimalToNumber(item.quantity) *
          this.decimalToNumber(item.unitPrice),
      0
    );
    const taxAmount = this.decimalToNumber(quotation.taxAmount) || 0;

    // Calculate discount based on discount type
    const discountValue = this.decimalToNumber(quotation.discountAmount) || 0;
    let discountAmount = 0;
    let discountDisplay = "";

    if (quotation.discountType === "PERCENTAGE" && discountValue > 0) {
      discountAmount = (subtotal + taxAmount) * (discountValue / 100);
      discountDisplay = `${discountValue}% (R${discountAmount.toLocaleString()})`;
    } else if (quotation.discountType === "AMOUNT" && discountValue > 0) {
      discountAmount = discountValue;
      discountDisplay = `R${discountAmount.toLocaleString()}`;
    }

    const total = subtotal + taxAmount - discountAmount;

    // Calculate deposit information
    const depositAmount = this.decimalToNumber(quotation.depositAmount) || 0;
    const depositPercentage = total > 0 ? (depositAmount / total) * 100 : 0;
    const amountDueAfterDeposit = Math.max(0, total - depositAmount);

    // Calculate days until expiry
    const validUntil = new Date(quotation.validUntil);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const companyName = companyInfo?.companyName || "YOUR COMPANY NAME";
    const companyAddress = companyInfo?.address || "";
    const companyCity = companyInfo?.city || "";
    const companyProvince = companyInfo?.province || "";
    const companyPostCode = companyInfo?.postCode || "";
    const companyPhone = companyInfo?.phone || "";
    const companyEmail = companyInfo?.email || "";
    const taxNumber = companyInfo?.taxId || "";
    const logo = companyInfo?.logo || "";
    const website = companyInfo?.website || "";

    // Build full address
    const fullAddress = [
      companyAddress,
      companyCity,
      companyProvince,
      companyPostCode,
    ]
      .filter((part) => part && part.trim() !== "")
      .join(", ");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation - ${quotation.quotationNumber}</title>
          <style>
            body { 
              font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: ${primaryColor};
              background: #fff;
              font-size: 12px;
            }
            .header { 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 16px;
            }
            .logo-container {
              margin-bottom: 8px;
            }
            .logo {
              height: 96px;
              object-fit: contain;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 4px;
              color: ${primaryColor};
              text-transform: uppercase;
            }
            .company-details {
              font-size: 11px;
              color: #6B7280;
              line-height: 1.3;
            }
            .quotation-title {
              font-size: 24px;
              font-weight: bold;
              color: ${accentColor};
              margin-bottom: 8px;
            }
            .quotation-info {
              background: ${secondaryColor};
              padding: 8px;
              border-radius: 6px;
              text-align: right;
              font-size: 11px;
            }
            .client-status-grid {
              display: flex;
              justify-content: space-between;
              margin-bottom: 16px;
              gap: 12px;
            }
            .client-section, .status-section {
              background: ${secondaryColor};
              padding: 8px;
              border-radius: 6px;
              flex: 1;
            }
            .section-title {
              font-size: 11px;
              font-weight: 600;
              margin-bottom: 4px;
              color: ${primaryColor};
              text-transform: uppercase;
            }
            .status-badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 600;
              ${
                quotation.status === "ACCEPTED"
                  ? "background: #D1FAE5; color: #065F46;"
                  : quotation.status === "DRAFT"
                    ? "background: #FEF3C7; color: #92400E;"
                    : quotation.status === "CONVERTED"
                      ? "background: #DBEAFE; color: #1E40AF;"
                      : quotation.status === "CANCELLED"
                        ? "background: #FEE2E2; color: #991B1B;"
                        : "background: #F3F4F6; color: #6B7280;"
              }
            }
            .expiry-notice {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 600;
              margin-left: 8px;
              ${
                daysUntilExpiry <= 0
                  ? "background: #FEE2E2; color: #991B1B;"
                  : daysUntilExpiry <= 3
                    ? "background: #FEF3C7; color: #92400E;"
                    : "background: #D1FAE5; color: #065F46;"
              }
            }
            .amount-summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              margin-bottom: 16px;
            }
            .amount-card {
              background: white;
              border: 1px solid #E5E7EB;
              border-radius: 6px;
              padding: 12px;
              text-align: center;
            }
            .amount-value {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .amount-label {
              font-size: 10px;
              color: #6B7280;
            }
            .amount-subtotal { color: #6B7280; }
            .amount-tax { color: #D97706; }
            .amount-total { color: ${accentColor}; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
              border: 1px solid #E5E7EB;
              border-radius: 6px;
              overflow: hidden;
              background: white;
            }
            th {
              background: ${secondaryColor};
              color: ${primaryColor};
              font-weight: 600;
              padding: 6px 4px;
              text-align: left;
              font-size: 11px;
            }
            td {
              padding: 6px 4px;
              border-top: 1px solid #E5E7EB;
              font-size: 11px;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 16px;
            }
            .totals-table {
              width: 33%;
              font-size: 11px;
            }
            .totals-table div {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              border-bottom: 1px solid #E5E7EB;
            }
            .totals-table .total-amount {
              font-weight: 600;
              font-size: 12px;
              border-bottom: none;
              border-top: 2px solid ${accentColor};
              color: ${accentColor};
            }
            .terms-section {
              margin-bottom: 22px;
              padding: 12px;
              border-radius: 6px;
            }
       
            .terms-content {
              font-size: 11px;
              line-height: 1.4;
            }
            .validity-info {
              font-size: 11px;
              background: #FFFBEB;
              border: 1px solid #FCD34D;
              border-radius: 6px;
              padding: 8px;
              margin-bottom: 16px;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #9CA3AF;
              margin-top: 20px;
              padding-top: 12px;
              border-top: 1px solid #E5E7EB;
            }
            @media print { 
              body { 
                margin: 0; 
                padding: 15px;
              } 
              .no-print { 
                display: none; 
              }
            }
            @page {
              margin: 0.5in;
            }
          </style>
        </head>
        <body>
          <!-- Watermark Logo Background -->
          ${
            logo
              ? `
            <div style="
              position: fixed;
              inset: 0;
              opacity: 0.03;
              z-index: -1;
              background-image: url('${logo}');
              background-repeat: no-repeat;
              background-position: center;
              background-size: 80%;
              filter: grayscale(100%);
              transform: rotate(-10deg);
              pointer-events: none;
            "></div>
          `
              : ""
          }

          <div style="position: relative; z-index: 10;">
            <!-- Header -->
            <div class="header">
              <div>
                ${
                  logo
                    ? `
                  <div class="logo-container">
                    <img src="${logo}" alt="${companyName}" class="logo" onerror="this.style.display='none'" />
                  </div>
                `
                    : ""
                }
                <div class="company-details">
                  <div class="company-name">${companyName}</div>
                  ${fullAddress ? `<div>${fullAddress}</div>` : ""}
                  ${companyPhone ? `<div>${companyPhone}</div>` : ""}
                  ${companyEmail ? `<div>${companyEmail}</div>` : ""}
                  ${taxNumber ? `<div>VAT Number: ${taxNumber}</div>` : ""}
                </div>
              </div>
              <div>
                <div class="quotation-title">QUOTATION</div>
                <div class="quotation-info">
                  <div style="font-weight: 600;">#${quotation.quotationNumber}</div>
                  <div><strong>Issued:</strong> ${new Date(quotation.issueDate).toLocaleDateString()}</div>
                  <div>
                    <strong>Valid Until:</strong> ${new Date(quotation.validUntil).toLocaleDateString()}
                    <span class="expiry-notice">
                      ${
                        daysUntilExpiry <= 0
                          ? "EXPIRED"
                          : daysUntilExpiry <= 3
                            ? `${daysUntilExpiry} DAYS LEFT`
                            : "VALID"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Validity Notice -->
            ${
              daysUntilExpiry <= 7
                ? `
              <div class="validity-info">
                <strong>${
                  daysUntilExpiry <= 0
                    ? "⚠️ THIS QUOTATION HAS EXPIRED"
                    : daysUntilExpiry <= 3
                      ? "⚠️ QUOTATION EXPIRES SOON"
                      : "ℹ️ QUOTATION VALIDITY"
                }</strong><br>
                ${
                  daysUntilExpiry <= 0
                    ? `This quotation expired ${Math.abs(daysUntilExpiry)} days ago. Please contact us for a new quotation.`
                    : daysUntilExpiry <= 3
                      ? `This quotation expires in ${daysUntilExpiry} days. Please accept before the expiry date.`
                      : `This quotation is valid for ${daysUntilExpiry} more days.`
                }
              </div>
            `
                : ""
            }

            <!-- Client + Status -->
            <div class="client-status-grid">
              <div class="client-section">
                <div class="section-title">QUOTATION FOR</div>
                ${quotation.client.company ? `<div style="font-weight: 600;">${quotation.client.company}</div>` : ""}
                <div style="font-weight: 600;">${quotation.client.name}</div>
                ${quotation.client.email ? `<div>${quotation.client.email}</div>` : ""}
                ${quotation.client.phone ? `<div>${quotation.client.phone}</div>` : ""}
                ${quotation.client.taxNumber ? `<div>VAT Number: ${quotation.client.taxNumber}</div>` : ""}
                ${quotation.client.address ? `<div>${quotation.client.address}</div>` : ""}
              </div>
              <div class="status-section">
                <div class="section-title">STATUS</div>
                <span class="status-badge">${quotation.status}</span>
                ${
                  quotation.status === "CONVERTED" && quotation.invoiceId
                    ? `<div style="margin-top: 4px; font-size: 10px; color: #6B7280;">
                         Converted to Invoice 
                       </div>`
                    : ""
                }
                ${
                  quotation.status === "ACCEPTED"
                    ? `<div style="margin-top: 4px; font-size: 10px; color: #6B7280;">
                         Accepted on ${new Date(quotation.updatedAt).toLocaleDateString()}
                       </div>`
                    : ""
                }
              </div>
            </div>

            <!-- Amount Summary -->
            <div class="amount-summary">
              <div class="amount-card">
                <div class="amount-value amount-subtotal">R${subtotal.toLocaleString()}</div>
                <div class="amount-label">Subtotal</div>
              </div>
              <div class="amount-card">
                <div class="amount-value amount-tax">R${taxAmount.toLocaleString()}</div>
                <div class="amount-label">Tax Amount</div>
              </div>
              <div class="amount-card">
                <div class="amount-value amount-total">R${total.toLocaleString()}</div>
                <div class="amount-label">Total Amount</div>
              </div>
            </div>

            <!-- Items Table -->
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${quotation.items
                  .map(
                    (item) => `
                 <tr>
  <td>${item.description}</td>
  <td class="text-center">${parseFloat(item.quantity.toString()).toLocaleString()}</td>
  <td class="text-right">R${parseFloat(item.unitPrice.toString()).toLocaleString()}</td>
  <td class="text-right">R${parseFloat(item.amount.toString()).toLocaleString()}</td>
</tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>

            <!-- Totals -->
            <div class="totals-section">
              <div class="totals-table">
                <div>
                  <span>Subtotal:</span>
                  <span>R${subtotal.toLocaleString()}</span>
                </div>
                ${
                  taxAmount > 0
                    ? `
                  <div>
                    <span>Tax (${subtotal > 0 ? ((taxAmount / subtotal) * 100).toFixed(2) : "0.00"}%):</span>
                    <span>R${taxAmount.toLocaleString()}</span>
                  </div>
                `
                    : ""
                }
                ${
                  discountAmount > 0
                    ? `
                  <div>
                    <span>Discount${quotation.discountType === "PERCENTAGE" ? ` (${discountValue}%)` : ""}:</span>
                    <span>-R${discountAmount.toLocaleString()}</span>
                  </div>
                `
                    : ""
                }
                <div class="total-amount">
                  <span>Total Amount:</span>
                  <span>R${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <!-- Terms & Notes Section -->
            <div class="terms-section">
              <div class="section-title" style="margin-bottom: 12px;">QUOTATION TERMS & NOTES</div>
              <div >
                <div class="terms-content">
                  ${
                    quotation.depositRequired && depositAmount > 0
                      ? `
                    <div style="margin-bottom: 8px;">
                      <strong>Deposit:</strong> A deposit of R${depositAmount.toLocaleString()} (${depositPercentage.toFixed(1)}% of total) has been applied. Remaining balance: R${amountDueAfterDeposit.toLocaleString()}.
                    </div>
                  `
                      : ""
                  }
                  ${
                    quotation.paymentTerms
                      ? `
                    <div style="margin-bottom: 8px;">
                      <strong>Payment Terms:</strong><br>
                      ${quotation.paymentTerms}
                    </div>
                  `
                      : ""
                  }
                  ${
                    quotation.notes
                      ? `
                    <div style="margin-bottom: 8px;">
                      <strong>Notes:</strong><br>
                      ${quotation.notes}
                    </div>
                  `
                      : ""
                  }
                  ${
                    discountAmount > 0
                      ? `
                    <div style="margin-bottom: 8px;">
                      <strong>Discount Applied:</strong><br>
                      ${
                        quotation.discountType === "PERCENTAGE"
                          ? `${discountValue}% discount applied`
                          : `R${discountValue.toLocaleString()} discount applied`
                      }
                    </div>
                  `
                      : ""
                  }
                  <div>
                    <strong>Validity Period:</strong><br>
                    This quotation is valid until ${new Date(quotation.validUntil).toLocaleDateString()}
                    ${
                      daysUntilExpiry <= 0
                        ? ` <span style="color: #DC2626;">(Expired)</span>`
                        : daysUntilExpiry <= 3
                          ? ` <span style="color: #D97706;">(${daysUntilExpiry} days remaining)</span>`
                          : ` <span style="color: #059669;">(${daysUntilExpiry} days remaining)</span>`
                    }
                  </div>
                </div>
                <div class="terms-content">
                  ${
                    quotation.terms
                      ? `
                    <div style="margin-bottom: 8px;">
                      <strong>Terms & Conditions:</strong><br>
                      ${quotation.terms}
                    </div>
                  `
                      : ""
                  }
                  <div>
                    <strong>Acceptance:</strong><br>
                    To accept this quotation, please contact us at ${companyEmail || "our email"} 
                    or call ${companyPhone || "our phone number"} before the expiry date.
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              ${website ? `<div>${website}</div>` : ""}
              <div>We look forward to working with you!</div>
            </div>

            <!-- Print Button -->
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="
                padding: 8px 16px; 
                background: ${accentColor}; 
                color: white; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer; 
                font-size: 11px;
              ">
                Print Quotation
              </button>
              <p style="margin-top: 8px; color: #6B7280; font-size: 10px;">
                This quotation was generated on ${new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
