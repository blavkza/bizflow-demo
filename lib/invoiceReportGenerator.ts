// lib/invoiceReportGenerator.ts
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

export class InvoiceReportGenerator {
  static generateInvoiceReportHTML(
    invoice: InvoiceProps,
    companyInfo?: CompanyInfo | null
  ): string {
    const primaryColor = "#1F2937"; // Gray-800
    const secondaryColor = "#F3F4F6"; // Gray-100
    const accentColor = "#10B981"; // Emerald-500

    // Calculate amounts
    const subtotal = invoice.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );
    const taxAmount = Number(invoice.taxAmount) || 0;
    const discount = Number(invoice.discountAmount) || 0;
    const total = subtotal + taxAmount - discount;

    // Calculate payment statistics
    const totalPaid =
      invoice.payments?.reduce((sum, payment) => {
        const amount = Number(payment.amount) || 0;
        return sum + amount;
      }, 0) || 0;

    const remainingBalance = Math.max(0, total - totalPaid);

    // Safe payment progress calculation
    let paymentProgress = 0;
    if (total > 0 && totalPaid > 0) {
      paymentProgress = (totalPaid / total) * 100;
    } else if (totalPaid > 0 && total === 0) {
      paymentProgress = 100; // If paid but total is 0, consider it fully paid
    }

    // Ensure progress is between 0-100
    paymentProgress = Math.min(100, Math.max(0, paymentProgress));

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

    // Calculate days until due
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice.invoiceNumber}</title>
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
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              color: ${accentColor};
              margin-bottom: 8px;
            }
            .invoice-info {
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
                invoice.status === "PAID"
                  ? "background: #D1FAE5; color: #065F46;"
                  : "background: #FEE2E2; color: #991B1B;"
              }
            }
            .payment-stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              margin-bottom: 16px;
            }
            .stat-card {
              background: white;
              border: 1px solid #E5E7EB;
              border-radius: 6px;
              padding: 12px;
              text-align: center;
            }
            .stat-value {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .stat-label {
              font-size: 10px;
              color: #6B7280;
            }
            .amount-paid { color: #065F46; }
            .amount-remaining { color: #DC2626; }
            .amount-total { color: #1E40AF; }
            .progress-bar {
              width: 100%;
              height: 16px;
              background-color: #E5E7EB;
              border-radius: 8px;
              margin: 8px 0;
              overflow: hidden;
            }
            .progress-fill {
              height: 100%;
              background-color: ${accentColor};
              border-radius: 8px;
              transition: width 0.3s ease;
            }
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
            .totals-table .total-due {
              font-weight: 600;
              font-size: 12px;
              border-bottom: none;
              border-top: 2px solid ${accentColor};
              color: ${accentColor};
            }
            .payments-section {
              margin-bottom: 16px;
            }
            .payments-table th {
              background: ${secondaryColor};
            }
            .terms-section {
              margin-bottom: 22px;
              padding: 12px;
              background: ${secondaryColor};
              border-radius: 6px;
            }
            .terms-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .terms-content {
              font-size: 11px;
              line-height: 1.4;
            }
            .bank-details {
              font-size: 11px;
            }
            .bank-name {
              font-weight: 600;
              margin-bottom: 2px;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #9CA3AF;
              margin-top: 20px;
              padding-top: 12px;
              border-top: 1px solid #E5E7EB;
            }
            .due-date {
              ${
                daysUntilDue < 0
                  ? "color: #DC2626; font-weight: bold;"
                  : daysUntilDue <= 3
                    ? "color: #D97706;"
                    : "color: #059669;"
              }
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
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-info">
                  <div style="font-weight: 600;">#${invoice.invoiceNumber}</div>
                  <div><strong>Issued:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</div>
                  <div class="due-date">
                    <strong>Due:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}
                    ${
                      daysUntilDue < 0
                        ? ` (${Math.abs(daysUntilDue)} days overdue)`
                        : daysUntilDue <= 3
                          ? ` (${daysUntilDue} days remaining)`
                          : ""
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Client + Status -->
            <div class="client-status-grid">
              <div class="client-section">
                <div class="section-title">INVOICE FOR</div>
                ${invoice.client.company ? `<div style="font-weight: 600;">${invoice.client.company}</div>` : ""}
                <div style="font-weight: 600;">${invoice.client.name}</div>
                ${invoice.client.email ? `<div>${invoice.client.email}</div>` : ""}
                ${invoice.client.phone ? `<div>${invoice.client.phone}</div>` : ""}
                ${invoice.client.taxNumber ? `<div>VAT Number: ${invoice.client.taxNumber}</div>` : ""}
                ${invoice.client.address ? `<div>${invoice.client.address}</div>` : ""}
              </div>
              <div class="status-section">
                <div class="section-title">STATUS</div>
                <span class="status-badge">${invoice.status}</span>
                ${
                  invoice.status === "PAID" &&
                  invoice.payments &&
                  invoice.payments.length > 0
                    ? `<div style="margin-top: 4px; font-size: 10px; color: #6B7280;">
                         Paid on ${new Date(invoice.payments[0].paidAt || invoice.issueDate).toLocaleDateString()}
                       </div>`
                    : ""
                }
              </div>
            </div>

            <!-- Payment Statistics -->
            <div class="payment-stats">
              <div class="stat-card">
                <div class="stat-value amount-total">R${total.toLocaleString()}</div>
                <div class="stat-label">Total Amount</div>
              </div>
              <div class="stat-card">
                <div class="stat-value amount-paid">R${totalPaid.toLocaleString()}</div>
                <div class="stat-label">Amount Paid</div>
              </div>
              <div class="stat-card">
                <div class="stat-value amount-remaining">R${remainingBalance.toLocaleString()}</div>
                <div class="stat-label">Amount Remaining</div>
              </div>
            </div>

            <!-- Payment Progress -->
      
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: #6B7280;">
                <span>R${totalPaid.toLocaleString()} Paid</span>
                <span>
                  ${
                    total > 0
                      ? `R${remainingBalance.toLocaleString()} Remaining`
                      : `R${total.toLocaleString()} Total`
                  }
                </span>
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
                ${invoice.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="text-center">${parseFloat(item.quantity).toLocaleString()}</td>
                    <td class="text-right">R${parseFloat(item.unitPrice).toLocaleString()}</td>
                    <td class="text-right">R${parseFloat(item.amount).toLocaleString()}</td>
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
                    <span>Tax (${((taxAmount / subtotal) * 100).toFixed(2)}%):</span>
                    <span>R${taxAmount.toLocaleString()}</span>
                  </div>
                `
                    : ""
                }
                ${
                  discount > 0
                    ? `
                  <div>
                    <span>Discount:</span>
                    <span>-R${discount.toLocaleString()}</span>
                  </div>
                `
                    : ""
                }
                <div class="total-due">
                  <span>Total Due:</span>
                  <span>R${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <!-- Payment History -->
            ${
              invoice.payments && invoice.payments.length > 0
                ? `
              <div class="payments-section">
                <div class="section-title" style="margin-bottom: 8px;">PAYMENT HISTORY</div>
                <table class="payments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th class="text-right">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoice.payments
                      .map(
                        (payment) => `
                      <tr>
                        <td>${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : "N/A"}</td>
                        <td>${payment.method.replace("_", " ")}</td>
                        <td>${payment.reference || "N/A"}</td>
                        <td class="text-right">R${Number(payment.amount).toLocaleString()}</td>
                        <td>
                          <span class="status-badge" style="${
                            payment.status === "COMPLETED"
                              ? "background: #D1FAE5; color: #065F46;"
                              : payment.status === "PENDING"
                                ? "background: #FEF3C7; color: #92400E;"
                                : "background: #FEE2E2; color: #991B1B;"
                          }">
                            ${payment.status}
                          </span>
                        </td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
                : ""
            }

            <!-- Payment Terms & Notes Section -->
            <div class="terms-section">
              <div class="section-title" style="margin-bottom: 12px;">PAYMENT TERMS & NOTES</div>
              <div class="terms-grid">
                <div class="terms-content">
                  ${
                    invoice.paymentTerms
                      ? `
                    <div style="margin-bottom: 8px;">
                      <strong>Payment Terms:</strong><br>
                      ${invoice.paymentTerms}
                    </div>
                  `
                      : ""
                  }
                  ${
                    invoice.note
                      ? `
                    <div>
                      <strong>Notes:</strong><br>
                      ${invoice.note}
                    </div>
                  `
                      : ""
                  }
                </div>
          
              </div>
                    <div class="bank-details">
                  <div class="section-title" style="margin-bottom: 8px;">BANKING DETAILS</div>
                  ${
                    companyInfo?.bankName
                      ? `
                    <div class="bank-name">${companyInfo.bankName}</div>
                    <div>Account: ${companyInfo.bankAccount || "N/A"}</div>
                  `
                      : ""
                  }
                  ${
                    companyInfo?.bankName2
                      ? `
                    <div style="margin-top: 6px;">
                      <div class="bank-name">${companyInfo.bankName2}</div>
                      <div>Account: ${companyInfo.bankAccount2 || "N/A"}</div>
                    </div>
                  `
                      : ""
                  }
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              ${website ? `<div>${website}</div>` : ""}
              <div>Thank you for your business!</div>
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
                Print Invoice
              </button>
              <p style="margin-top: 8px; color: #6B7280; font-size: 10px;">
                This invoice was generated on ${new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
