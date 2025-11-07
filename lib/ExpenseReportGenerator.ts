import { Expense } from "@/app/dashboard/expenses/[id]/types";

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

export class ExpenseReportGenerator {
  static generateExpenseReportHTML(
    expense: Expense,
    companyInfo?: CompanyInfo | null
  ): string {
    const companyName = companyInfo?.companyName || "YOUR COMPANY NAME";
    const companyAddress = companyInfo?.address || "";
    const companyCity = companyInfo?.city || "";
    const companyProvince = companyInfo?.province || "";
    const companyPostCode = companyInfo?.postCode || "";
    const companyPhone = companyInfo?.phone || "";
    const companyEmail = companyInfo?.email || "";
    const taxNumber = companyInfo?.taxId || "";
    const logo = companyInfo?.logo || "";

    // Build full address
    const fullAddress = [
      companyAddress,
      companyCity,
      companyProvince,
      companyPostCode,
    ]
      .filter((part) => part && part.trim() !== "")
      .join(", ");

    // Convert Decimal to numbers
    const totalAmount = parseFloat(expense.totalAmount.toString());
    const paidAmount = parseFloat(expense.paidAmount.toString());
    const remainingAmount = parseFloat(expense.remainingAmount.toString());
    const paymentProgress = (paidAmount / totalAmount) * 100;

    // Calculate days until due
    const dueDate = new Date(expense.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expense Report - ${expense.expenseNumber}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #333;
              background: #fff;
            }
            .header { 
              text-align: center;
              margin-bottom: 30px; 
              border-bottom: 3px solid #2c5aa0; 
              padding-bottom: 15px; 
            }
            .logo-container {
              margin-bottom: 15px;
            }
            .logo {
              max-width: 150px;
              max-height: 100px;
              object-fit: contain;
            }
            .company-info {
              text-align: center;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #2c5aa0;
              margin-bottom: 8px;
            }
            .company-details {
              font-size: 14px;
              color: #666;
              line-height: 1.4;
              margin-bottom: 4px;
            }
            .document-type {
              font-size: 20px;
              font-weight: bold;
              margin: 15px 0 10px 0;
              color: #333;
            }
            .expense-info { 
              margin-bottom: 25px; 
            }
            .section { 
              margin-bottom: 25px; 
              padding: 15px;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              background: #fafafa;
            }
            .section-title { 
              font-weight: bold; 
              border-bottom: 2px solid #2c5aa0; 
              padding-bottom: 8px; 
              margin-bottom: 12px;
              color: #2c5aa0;
              font-size: 16px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
              background: white;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #2c5aa0; 
              color: white;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-item {
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: 600;
              color: #555;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: white;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .stat-value {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
            }
            .progress-bar {
              width: 100%;
              height: 20px;
              background-color: #e0e0e0;
              border-radius: 10px;
              margin: 10px 0;
              overflow: hidden;
            }
            .progress-fill {
              height: 100%;
              background-color: #2c5aa0;
              border-radius: 10px;
              transition: width 0.3s ease;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-right: 8px;
              margin-bottom: 8px;
            }
            .status-paid { background: #d1fae5; color: #065f46; }
            .status-partial { background: #dbeafe; color: #1e40af; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
            .priority-high { background: #fee2e2; color: #991b1b; }
            .priority-medium { background: #fef3c7; color: #92400e; }
            .priority-low { background: #d1fae5; color: #065f46; }
            .amount-paid { color: #065f46; }
            .amount-remaining { color: #dc2626; }
            .amount-total { color: #1e40af; }
            .due-date-urgent { color: #dc2626; font-weight: bold; }
            .due-date-warning { color: #d97706; }
            .due-date-normal { color: #059669; }
            .notes {
              margin-top: 20px;
              padding: 15px;
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 5px;
            }
            @media print { 
              body { 
                margin: 0; 
                padding: 15px;
              } 
              .no-print { 
                display: none; 
              }
              .section {
                break-inside: avoid;
              }
              table {
                break-inside: avoid;
              }
            }
            @page {
              margin: 0.5in;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              ${
                logo
                  ? `
                <div class="logo-container">
                  <img src="${logo}" alt="${companyName}" class="logo" onerror="this.style.display='none'" />
                </div>
              `
                  : ""
              }
              <div class="company-name">${companyName}</div>
              ${fullAddress ? `<div class="company-details">${fullAddress}</div>` : ""}
              ${companyPhone ? `<div class="company-details">Tel: ${companyPhone}</div>` : ""}
              ${companyEmail ? `<div class="company-details">Email: ${companyEmail}</div>` : ""}
              ${taxNumber ? `<div class="company-details">Tax Number: ${taxNumber}</div>` : ""}
              <div class="document-type">EXPENSE REPORT</div>
              <div style="margin-top: 10px;">
                <div><strong>Expense:</strong> ${expense.expenseNumber}</div>
                <div><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Expense Summary</div>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">Description:</span> ${expense.description}
                </div>
                <div class="info-item">
                  <span class="info-label">Category:</span> ${expense.category?.name || "Uncategorized"}
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span> 
                  <span class="badge status-${expense.status.toLowerCase()}">${expense.status}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Priority:</span> 
                  <span class="badge priority-${expense.priority.toLowerCase()}">${expense.priority}</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">Expense Date:</span> ${new Date(expense.expenseDate).toLocaleDateString()}
                </div>
                <div class="info-item">
                  <span class="info-label">Due Date:</span> 
                  <span class="${
                    daysUntilDue < 0
                      ? "due-date-urgent"
                      : daysUntilDue <= 3
                        ? "due-date-warning"
                        : "due-date-normal"
                  }">
                    ${new Date(expense.dueDate).toLocaleDateString()}
                    ${
                      daysUntilDue < 0
                        ? ` (${Math.abs(daysUntilDue)} days overdue)`
                        : daysUntilDue <= 3
                          ? ` (${daysUntilDue} days remaining)`
                          : ""
                    }
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Created:</span> ${new Date(expense.createdAt).toLocaleDateString()}
                </div>
                ${
                  expense.paidDate
                    ? `<div class="info-item">
                         <span class="info-label">Paid Date:</span> ${new Date(expense.paidDate).toLocaleDateString()}
                       </div>`
                    : ""
                }
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Financial Overview</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value amount-total">R${totalAmount.toLocaleString()}</div>
                <div class="stat-label">Total Amount</div>
              </div>
              <div class="stat-card">
                <div class="stat-value amount-paid">R${paidAmount.toLocaleString()}</div>
                <div class="stat-label">Amount Paid</div>
              </div>
              <div class="stat-card">
                <div class="stat-value amount-remaining">R${remainingAmount.toLocaleString()}</div>
                <div class="stat-label">Amount Remaining</div>
              </div>
            </div>
            
            <div style="margin-top: 20px;">
              <div style="display: flex; justify-content: between; margin-bottom: 5px;">
                <span>Payment Progress</span>
                <span><strong>${paymentProgress.toFixed(1)}% Complete</strong></span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${paymentProgress}%"></div>
              </div>
              <div style="display: flex; justify-content: between; font-size: 12px; color: #666;">
                <span>R${paidAmount.toLocaleString()} Paid</span>
                <span>R${remainingAmount.toLocaleString()} Remaining</span>
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="section">
              <div class="section-title">Vendor Information</div>
              <div class="info-item">
                <span class="info-label">Vendor:</span> ${expense.Vendor?.name || "N/A"}
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span> ${expense.vendorEmail || expense.Vendor?.email || "N/A"}
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span> ${expense.vendorPhone || expense.Vendor?.phone || "N/A"}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Accounting Details</div>
              <div class="info-item">
                <span class="info-label">Account Code:</span> ${expense.accountCode || "N/A"}
              </div>
              <div class="info-item">
                <span class="info-label">Project:</span> ${expense.Project?.title || expense.projectCode || "N/A"}
              </div>
              <div class="info-item">
                <span class="info-label">Invoice:</span> ${expense.Invoice?.invoiceNumber || "N/A"}
              </div>
              ${
                expense.paymentMethod
                  ? `<div class="info-item">
                       <span class="info-label">Payment Method:</span> ${expense.paymentMethod}
                     </div>`
                  : ""
              }
            </div>
          </div>

          ${
            expense.payments && expense.payments.length > 0
              ? `
          <div class="section">
            <div class="section-title">Payment History</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Paid By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${expense.payments
                  .map(
                    (payment) => `
                  <tr>
                    <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td style="color: #065f46; font-weight: 600;">R${parseFloat(payment.amount.toString()).toLocaleString()}</td>
                    <td>${payment.method}</td>
                    <td>${payment.reference || "N/A"}</td>
                    <td>${payment.paidBy}</td>
                    <td>
                      <span class="badge status-${payment.status.toLowerCase()}">
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

          ${
            expense.attachments && expense.attachments.length > 0
              ? `
          <div class="section">
            <div class="section-title">Attachments</div>
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                ${expense.attachments
                  .map(
                    (attachment) => `
                  <tr>
                    <td>${attachment.filename}</td>
                    <td>${attachment.type}</td>
                    <td>${new Date(attachment.uploadedAt).toLocaleDateString()}</td>
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

          ${
            expense.notes
              ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <div class="notes">${expense.notes}</div>
          </div>
          `
              : ""
          }

          <div class="no-print" style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #2c5aa0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
              Print Expense Report
            </button>
            <p style="margin-top: 10px; color: #666; font-size: 12px;">
              This report was generated on ${new Date().toLocaleDateString()}
            </p>
          </div>
        </body>
      </html>
    `;
  }
}
