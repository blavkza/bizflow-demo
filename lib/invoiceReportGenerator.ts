// lib/invoiceReportGenerator.ts
import { InvoiceProps } from "@/types/invoice";
import { DiscountType } from "@prisma/client";

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

    // Calculate amounts (using original calculation)
    const subtotal = invoice.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );
    const taxAmount = Number(invoice.taxAmount) || 0;
    const discount = Number(invoice.discountAmount) || 0;
    const total = subtotal + taxAmount - discount;

    const calculateDiscountAmount = () => {
      if (!invoice.discountAmount) return 0;

      if (invoice.discountType === DiscountType.PERCENTAGE) {
        return (invoice.amount * invoice.discountAmount) / 100;
      } else {
        return invoice.discountAmount;
      }
    };

    const discountAmount = calculateDiscountAmount();

    // Calculate deposit information
    const depositAmount = Number(invoice.depositAmount) || 0;
    const depositPercentage = total > 0 ? (depositAmount / total) * 100 : 0;
    const amountDueAfterDeposit = Math.max(0, total - depositAmount);

    // Calculate payment statistics
    const totalPaid =
      invoice.payments?.reduce((sum, payment) => {
        const amount = Number(payment.amount) || 0;
        return sum + amount;
      }, 0) || 0;

    const remainingBalance = Math.max(0, total - totalPaid);

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
              border-radius: 6px;
            }
         
            .terms-content
           font-size: 11px;
            line-height: 1.4;
            margin-bottom: 16px;
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
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
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
                
                  <div>
                    <span>Tax (${((taxAmount / subtotal) * 100).toFixed(2)}%):</span>
                    <span>R${taxAmount.toLocaleString()}</span>
                  </div>
                
                   
              ${
                discountAmount > 0
                  ? `
      <div>
        <span>
          Discount${
            invoice.discountType === DiscountType.PERCENTAGE &&
            invoice.discountAmount
              ? ` (${invoice.discountAmount}%)`
              : ""
          }:
        </span>
        <span>-R${discountAmount.toLocaleString()}</span>
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

  <div class="terms-content">
    ${
      invoice.depositRequired && depositAmount > 0
        ? `
      <div style="margin-bottom: 8px;">
        <strong>Deposit:</strong> A deposit of R${depositAmount.toLocaleString()} (${depositPercentage.toFixed(1)}% of total) has been applied. Remaining balance: R${amountDueAfterDeposit.toLocaleString()}.
      </div>
    `
        : ""
    }
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
