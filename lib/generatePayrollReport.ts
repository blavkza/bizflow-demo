import { ProcessedPayroll, CompanyInfo } from "@/types/payroll-report";

export class PayrollReportGenerator {
  static generatePayrollReportHTML(
    payroll: ProcessedPayroll,
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
    const website = companyInfo?.website || "";
    const paymentTerms = companyInfo?.paymentTerms || "";
    const note = companyInfo?.note || "";
    const bankAccount = companyInfo?.bankAccount || "";
    const bankAccount2 = companyInfo?.bankAccount2 || "";
    const bankName = companyInfo?.bankName || "";
    const bankName2 = companyInfo?.bankName2 || "";
    const phone2 = companyInfo?.phone2 || "";
    const phone3 = companyInfo?.phone3 || "";

    const fullAddress = [
      companyAddress,
      companyCity,
      companyProvince,
      companyPostCode,
    ]
      .filter((part) => part && part.trim() !== "")
      .join(", ");

    // Calculate totals
    const totalAmount = payroll.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const totalBaseAmount = payroll.payments.reduce(
      (sum, payment) => sum + payment.baseAmount,
      0
    );
    const totalOvertimeAmount = payroll.payments.reduce(
      (sum, payment) => sum + payment.overtimeAmount,
      0
    );
    const totalEmployees = payroll.payments.filter(
      (p) => p.worker && !p.worker.isFreelancer
    ).length;
    const totalFreelancers = payroll.payments.filter(
      (p) => p.worker && p.worker.isFreelancer
    ).length;

    // Format transaction amount
    const transactionAmount = payroll.transaction?.amount
      ? typeof payroll.transaction.amount === "number"
        ? payroll.transaction.amount
        : Number(payroll.transaction.amount)
      : 0;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payroll Report - ${payroll.month}</title>
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
            .payroll-info { 
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
            .totals { 
              float: right; 
              width: 400px; 
              margin-top: 20px;
            }
            .totals table {
              background: #f8f9fa;
              border: 2px solid #2c5aa0;
            }
            .totals td {
              font-weight: 500;
            }
            .totals .final-total {
              font-weight: bold;
              font-size: 18px;
              color: #2c5aa0;
            }
            .signature { 
              margin-top: 60px; 
              border-top: 2px solid #333; 
              padding-top: 20px; 
              clear: both;
            }
            .signature-section {
              width: 45%;
              display: inline-block;
              vertical-align: top;
            }
            .signature-line {
              border-bottom: 1px solid #333; 
              height: 40px; 
              margin-top: 50px;
              margin-bottom: 10px;
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
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .summary-card {
              padding: 15px;
              background: white;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              text-align: center;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #2c5aa0;
            }
            .summary-label {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            .payroll-number-date {
              display: block;
              justify-content: space-between;
              max-width: 400px;
              margin: 10px auto 0;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
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
              <div class="document-type">PAYROLL REPORT</div>
              <div class="payroll-number-date">
                <div><strong>Payroll Period:</strong> ${payroll.month}</div>
                <div><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>Description:</strong> ${payroll.description}</div>
              </div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-value">R${totalAmount.toFixed(2)}</div>
              <div class="summary-label">Total Payroll</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${totalEmployees}</div>
              <div class="summary-label">Employees</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${totalFreelancers}</div>
              <div class="summary-label">Freelancers</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="section">
              <div class="section-title">Payroll Summary</div>
              <div class="info-item">
                <span class="info-label">Status:</span> ${payroll.status}
              </div>
              <div class="info-item">
                <span class="info-label">Created By:</span> ${payroll.createdByName}
              </div>
              <div class="info-item">
                <span class="info-label">Created Date:</span> ${new Date(payroll.createdAt).toLocaleDateString()}
              </div>
              ${
                payroll.transaction
                  ? `
                <div class="info-item">
                  <span class="info-label">Transaction Ref:</span> ${payroll.transaction.reference}
                </div>
                <div class="info-item">
                  <span class="info-label">Payment Date:</span> ${new Date(payroll.transaction.date).toLocaleDateString()}
                </div>
                <div class="info-item">
                  <span class="info-label">Transaction Amount:</span> R${transactionAmount.toFixed(2)}
                </div>
              `
                  : ""
              }
            </div>

            <div class="section">
              <div class="section-title">Amount Breakdown</div>
              <div class="info-item">
                <span class="info-label">Base Salary Total:</span> R${totalBaseAmount.toFixed(2)}
              </div>
              <div class="info-item">
                <span class="info-label">Overtime Total:</span> R${totalOvertimeAmount.toFixed(2)}
              </div>
              <div class="info-item">
                <span class="info-label">Total Workers:</span> ${totalEmployees + totalFreelancers}
              </div>
              ${
                payroll.notes
                  ? `
                <div class="info-item">
                  <span class="info-label">Notes:</span> ${payroll.notes}
                </div>
              `
                  : ""
              }
            </div>
          </div>

          <div class="section">
            <div class="section-title">Payroll Details</div>
            <table>
              <thead>
                <tr>
                  <th>Worker ID</th>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th class="text-right">Regular Hours</th>
                  <th class="text-right">Overtime Hours</th>
                  <th class="text-right">Base Amount</th>
                  <th class="text-right">Overtime</th>
                  <th class="text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${payroll.payments
                  .map(
                    (payment) => `
                  <tr>
                    <td>${payment.worker?.workerNumber || "N/A"}</td>
                    <td>${payment.worker ? `${payment.worker.firstName} ${payment.worker.lastName}` : "Worker Not Found"}</td>
                    <td>${payment.worker?.position || "N/A"}</td>
                    <td>${payment.worker?.department?.name || "N/A"}</td>
                    <td>${payment.worker?.isFreelancer ? "Freelancer" : "Employee"}</td>
                    <td class="text-right">${payment.regularHours || 0}</td>
                    <td class="text-right">${payment.overtimeHours || 0}</td>
                    <td class="text-right">R${payment.baseAmount.toFixed(2)}</td>
                    <td class="text-right">R${payment.overtimeAmount.toFixed(2)}</td>
                    <td class="text-right">R${payment.amount.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <table>
              <tr>
                <td><strong>Total Base Salary:</strong></td>
                <td class="text-right">R${totalBaseAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Total Overtime:</strong></td>
                <td class="text-right">R${totalOvertimeAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="final-total">Grand Total:</td>
                <td class="final-total text-right">R${totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="clear: both;"></div>

          <div class="signature">
            <div style="display: flex; justify-content: space-between;">
              <div class="signature-section">
                <p><strong>Prepared By</strong></p>
                <div class="signature-line"></div>
                <p>Name: ___________________</p>
                <p>Date: ___________________</p>
                <p>Position: ___________________</p>
              </div>
              
              <div class="signature-section">
                <p><strong>Approved By</strong></p>
                <div class="signature-line"></div>
                <p>Name: ___________________</p>
                <p>Date: ___________________</p>
                <p>Position: ___________________</p>
              </div>
            </div>
          </div>

          <div class="no-print" style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #2c5aa0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
              Print Payroll Report
            </button>
            <p style="margin-top: 10px; color: #666; font-size: 12px;">
              This payroll report was generated on ${new Date().toLocaleDateString()}
            </p>
          </div>
        </body>
      </html>
    `;
  }

  static generatePayrollReportText(
    payroll: ProcessedPayroll,
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

    // Build full address
    const fullAddress = [
      companyAddress,
      companyCity,
      companyProvince,
      companyPostCode,
    ]
      .filter((part) => part && part.trim() !== "")
      .join(", ");

    // Calculate totals
    const totalAmount = payroll.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const totalBaseAmount = payroll.payments.reduce(
      (sum, payment) => sum + payment.baseAmount,
      0
    );
    const totalOvertimeAmount = payroll.payments.reduce(
      (sum, payment) => sum + payment.overtimeAmount,
      0
    );
    const totalEmployees = payroll.payments.filter(
      (p) => p.worker && !p.worker.isFreelancer
    ).length;
    const totalFreelancers = payroll.payments.filter(
      (p) => p.worker && p.worker.isFreelancer
    ).length;

    let text = `${companyName}\n`;
    if (fullAddress) text += `${fullAddress}\n`;
    if (companyPhone) text += `Tel: ${companyPhone}\n`;
    if (companyEmail) text += `Email: ${companyEmail}\n`;
    if (taxNumber) text += `Tax Number: ${taxNumber}\n`;

    text += `\nPAYROLL REPORT - ${payroll.month}\n`;
    text += `Description: ${payroll.description}\n`;
    text += `Report Date: ${new Date().toLocaleDateString()}\n\n`;

    text += `SUMMARY:\n`;
    text += `Status: ${payroll.status}\n`;
    text += `Created By: ${payroll.createdByName}\n`;
    text += `Total Amount: R${totalAmount.toFixed(2)}\n`;
    text += `Employees: ${totalEmployees}\n`;
    text += `Freelancers: ${totalFreelancers}\n\n`;

    text += `PAYROLL DETAILS:\n`;
    payroll.payments.forEach((payment) => {
      const workerName = payment.worker
        ? `${payment.worker.firstName} ${payment.worker.lastName}`
        : "Worker Not Found";
      const workerType = payment.worker?.isFreelancer
        ? "Freelancer"
        : "Employee";

      text += `${payment.worker?.workerNumber || "N/A"} | ${workerName} | ${workerType} | R${payment.amount.toFixed(2)}\n`;
    });

    text += `\nTOTALS:\n`;
    text += `Base Salary: R${totalBaseAmount.toFixed(2)}\n`;
    text += `Overtime: R${totalOvertimeAmount.toFixed(2)}\n`;
    text += `Grand Total: R${totalAmount.toFixed(2)}\n`;

    return text;
  }
}
