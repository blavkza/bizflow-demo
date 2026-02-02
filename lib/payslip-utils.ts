// utils/payslip-utils.ts
import {
  PayslipGenerator,
  PayslipData,
  CompanyInfo,
} from "./payslip-generator";

export class PayslipUtils {
  /**
   * Print payslip in a new window
   */
  static async printPayslip(
    payment: PayslipData,
    companyInfo?: CompanyInfo
  ): Promise<void> {
    try {
      const payslipHTML = PayslipGenerator.generatePayslipHTML(
        payment,
        companyInfo
      );

      // Create print window
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error(
          "Could not open print window. Please disable popup blocker."
        );
      }

      // Write HTML content
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Payslip - ${payment.worker?.firstName} ${payment.worker?.lastName}</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            @media screen {
              body {
                padding: 20px;
                background: #f5f5f5;
              }
            }
          </style>
        </head>
        <body>
          ${payslipHTML}
          <script>
            // Auto print and close
            window.onload = function() {
              // Small delay to ensure all content is rendered
              setTimeout(function() {
                window.print();
                
                // Close window after print dialog is closed
                window.onafterprint = function() {
                  setTimeout(function() {
                    window.close();
                  }, 100);
                };
                
                // Fallback close if onafterprint not supported
                setTimeout(function() {
                  if (!document.hidden) {
                    window.close();
                  }
                }, 3000);
              }, 500);
            };
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
    } catch (error) {
      console.error("Error printing payslip:", error);
      throw new Error("Failed to print payslip. Please try again.");
    }
  }

  /**
   * Download payslip as PDF (uses browser's print-to-PDF functionality)
   */
  static async downloadPayslipPDF(
    payment: PayslipData,
    companyInfo?: CompanyInfo
  ): Promise<void> {
    try {
      // Simply open print dialog - user can choose "Save as PDF"
      await this.printPayslip(payment, companyInfo);
    } catch (error) {
      console.error("Error downloading payslip PDF:", error);
      throw new Error(
        "Failed to download PDF. Please try the print option instead."
      );
    }
  }

  /**
   * Download payslip as Excel/CSV file
   */
  static async downloadPayslipExcel(
    payment: PayslipData,
    companyInfo?: CompanyInfo
  ): Promise<void> {
    try {
      const company = companyInfo || payment.company;
      const worker = payment.worker;

      // Calculate totals
      const totalBonuses = payment.paymentBonuses.reduce(
        (sum, bonus) => sum + bonus.amount,
        0
      );
      const totalDeductions = payment.paymentDeductions.reduce(
        (sum, deduction) => sum + deduction.amount,
        0
      );
      const grossSalary =
        payment.baseAmount + payment.overtimeAmount + totalBonuses;
      const totalHours = payment.regularHours + payment.overtimeHours;

      // Format currency for CSV
      const formatForCSV = (amount: number) => amount.toFixed(2);

      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";

      // Header
      csvContent += "PAYSLIP SUMMARY\r\n\r\n";

      // Company Info
      csvContent += `Company:,${company?.companyName || ""}\r\n`;
      csvContent += `Address:,${company?.address || ""}\r\n`;
      csvContent += `Phone:,${company?.phone || ""}\r\n`;
      csvContent += `Email:,${company?.email || ""}\r\n`;
      csvContent += `\r\n`;

      // Employee Info
      csvContent += `Employee:,${worker?.firstName || ""} ${worker?.lastName || ""}\r\n`;
      csvContent += `Employee Number:,${worker?.employeeNumber || worker?.freeLancerNumber || ""}\r\n`;
      csvContent += `ID Number:,${worker?.idNumber || ""}\r\n`;
      csvContent += `Tax Number:,${worker?.taxNumber || ""}\r\n`;
      csvContent += `Position:,${worker?.position || ""}\r\n`;
      csvContent += `Department:,${worker?.department?.name || ""}\r\n`;
      csvContent += `\r\n`;

      // Payment Info
      csvContent += `Payslip ID:,${payment.id}\r\n`;
      csvContent += `Payment Date:,${new Date(payment.payDate).toLocaleDateString()}\r\n`;
      csvContent += `Payment Period:,${payment.Payroll?.month || ""}\r\n`;
      csvContent += `Status:,${payment.status || ""}\r\n`;
      csvContent += `\r\n`;

      // Earnings Section
      csvContent += "EARNINGS\r\n";
      csvContent += "Description,Amount (R)\r\n";
      csvContent += `Basic Salary,${formatForCSV(payment.baseAmount)}\r\n`;

      if (payment.overtimeAmount > 0) {
        csvContent += `Overtime (${payment.overtimeHours.toFixed(1)} hours),${formatForCSV(payment.overtimeAmount)}\r\n`;
      }

      payment.paymentBonuses.forEach((bonus) => {
        const bonusName = bonus.bonusType.replace(/_/g, " ");
        csvContent += `${bonusName},${formatForCSV(bonus.amount)}\r\n`;
      });

      csvContent += `TOTAL EARNINGS,${formatForCSV(grossSalary)}\r\n`;
      csvContent += "\r\n";

      // Deductions Section
      csvContent += "DEDUCTIONS\r\n";
      csvContent += "Description,Amount (R)\r\n";

      payment.paymentDeductions.forEach((deduction) => {
        const deductionName = deduction.deductionType.replace(/_/g, " ");
        csvContent += `${deductionName},${formatForCSV(deduction.amount)}\r\n`;
      });

      csvContent += `TOTAL DEDUCTIONS,${formatForCSV(totalDeductions)}\r\n`;
      csvContent += "\r\n";

      // Summary
      csvContent += "SUMMARY\r\n";
      csvContent += "Description,Amount (R)\r\n";
      csvContent += `Gross Salary,${formatForCSV(grossSalary)}\r\n`;
      csvContent += `Total Deductions,${formatForCSV(totalDeductions)}\r\n`;
      csvContent += `NET PAY,${formatForCSV(payment.netAmount)}\r\n`;
      csvContent += "\r\n";

      // Work Summary
      csvContent += "WORK SUMMARY\r\n";
      csvContent += "Description,Value\r\n";
      csvContent += `Days Worked,${payment.daysWorked}\r\n`;
      csvContent += `Regular Hours,${payment.regularHours.toFixed(1)}\r\n`;
      csvContent += `Overtime Hours,${payment.overtimeHours.toFixed(1)}\r\n`;
      csvContent += `Total Hours,${totalHours.toFixed(1)}\r\n`;
      csvContent += `Rate per Hour,R ${(worker?.ratePerHour || 0).toFixed(2)}\r\n`;
      csvContent += "\r\n";

      // Footer
      csvContent += `Generated on:,${new Date().toLocaleDateString()}\r\n`;
      csvContent += `Currency:,${payment.currency}\r\n`;

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const workerNumber = worker?.employeeNumber || worker?.freeLancerNumber || payment.id.slice(-8);
      const dateStr = new Date(payment.payDate).toISOString().split("T")[0];
      link.setAttribute(
        "download",
        `payslip-${workerNumber}-${dateStr}.csv`
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading Excel/CSV:", error);
      throw new Error("Failed to download Excel file. Please try again.");
    }
  }

  /**
   * Generate email content for payslip
   */
  static generatePayslipEmailContent(
    payment: PayslipData,
    companyInfo?: CompanyInfo
  ): {
    subject: string;
    body: string;
    html: string;
  } {
    const worker = payment.worker;
    const company = companyInfo || payment.company;
    const payDate = new Date(payment.payDate).toLocaleDateString();

    const subject = `Payslip for ${worker?.firstName} ${worker?.lastName} - ${payDate}`;

    // Plain text body
    const body = `
Dear ${worker?.firstName} ${worker?.lastName},

Your payslip for ${payDate} is now available.

Summary:
- Gross Salary: R ${payment.amount.toFixed(2)}
- Net Pay: R ${payment.netAmount.toFixed(2)}
- Payment Status: ${payment.status}

Please find your detailed payslip attached.

For any queries, please contact ${company?.companyName} at ${company?.phone || company?.email}.

Best regards,
${company?.companyName}
    `.trim();

    // HTML body
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .summary-box { background: #e8f4fd; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }
    .amount { font-size: 18px; font-weight: bold; color: #28a745; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Your Payslip is Available</h2>
      <p>Dear ${worker?.firstName} ${worker?.lastName},</p>
    </div>
    
    <p>Your payslip for <strong>${payDate}</strong> has been processed and is now available.</p>
    
    <div class="summary-box">
      <h3>Payment Summary</h3>
      <p><strong>Gross Salary:</strong> R ${payment.amount.toFixed(2)}</p>
      <p><strong>Net Pay:</strong> <span class="amount">R ${payment.netAmount.toFixed(2)}</span></p>
      <p><strong>Status:</strong> ${payment.status}</p>
      <p><strong>Payment Date:</strong> ${payDate}</p>
    </div>
    
    <p>Please find your detailed payslip attached to this email.</p>
    
    <div class="footer">
      <p>For any queries regarding your payslip, please contact:</p>
      <p><strong>${company?.companyName}</strong></p>
      ${company?.phone ? `<p>Phone: ${company.phone}</p>` : ""}
      ${company?.email ? `<p>Email: ${company.email}</p>` : ""}
      <p style="margin-top: 20px; color: #999;">This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, body, html };
  }

  /**
   * Preview payslip in modal/popup
   */
  static previewPayslip(payment: PayslipData, companyInfo?: CompanyInfo): void {
    try {
      const payslipHTML = PayslipGenerator.generatePayslipHTML(
        payment,
        companyInfo
      );

      // Create preview window
      const previewWindow = window.open(
        "",
        "_blank",
        "width=1000,height=700,scrollbars=yes"
      );
      if (!previewWindow) {
        throw new Error(
          "Could not open preview window. Please disable popup blocker."
        );
      }

      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payslip Preview - ${payment.worker?.firstName} ${payment.worker?.lastName}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              padding: 20px;
              background: #f5f5f5;
              font-family: Arial, sans-serif;
            }
            .preview-container {
              max-width: 1000px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .preview-header {
              background: #f8f9fa;
              padding: 15px 20px;
              border-bottom: 1px solid #dee2e6;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .preview-title {
              margin: 0;
              font-size: 18px;
              color: #333;
            }
            .preview-actions {
              display: flex;
              gap: 10px;
            }
            .preview-button {
              padding: 8px 16px;
              background: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              gap: 5px;
            }
            .preview-button:hover {
              background: #0056b3;
            }
            .preview-button.secondary {
              background: #6c757d;
            }
            .preview-button.secondary:hover {
              background: #545b62;
            }
            .payslip-content {
              padding: 20px;
              max-height: 600px;
              overflow-y: auto;
            }
            @media print {
              .preview-header { display: none !important; }
              body { padding: 0; background: white; }
              .preview-container { box-shadow: none; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="preview-container">
            <div class="preview-header">
              <h2 class="preview-title">Payslip Preview</h2>
              <div class="preview-actions">
                <button class="preview-button secondary" onclick="window.print()">
                  <span>🖨️</span> Print
                </button>
                <button class="preview-button" onclick="window.close()">
                  <span>✕</span> Close
                </button>
              </div>
            </div>
            <div class="payslip-content">
              ${payslipHTML}
            </div>
          </div>
        </body>
        </html>
      `);

      previewWindow.document.close();
    } catch (error) {
      console.error("Error previewing payslip:", error);
      throw new Error("Failed to open preview. Please try again.");
    }
  }

  /**
   * Share payslip via share API (for mobile/desktop)
   */
  static async sharePayslip(
    payment: PayslipData,
    companyInfo?: CompanyInfo
  ): Promise<void> {
    try {
      const worker = payment.worker;
      const payDate = new Date(payment.payDate).toLocaleDateString();
      const { subject, body } = this.generatePayslipEmailContent(
        payment,
        companyInfo
      );

      // Check if Web Share API is available (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: subject,
          text: body,
          url: window.location.href,
        });
      } else {
        // Fallback: Open email client
        const emailBody = encodeURIComponent(body);
        const emailSubject = encodeURIComponent(subject);
        window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
      }
    } catch (error) {
      console.error("Error sharing payslip:", error);

      // User cancelled share or error occurred
      if (error instanceof Error && error.name !== "AbortError") {
        throw new Error(
          "Failed to share payslip. Please try the email option instead."
        );
      }
    }
  }

  /**
   * Validate payslip data before processing
   */
  static validatePayslipData(payment: PayslipData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!payment.id) errors.push("Payment ID is required");
    if (!payment.worker?.firstName)
      errors.push("Employee first name is required");
    if (!payment.worker?.lastName)
      errors.push("Employee last name is required");
    if (!payment.payDate) errors.push("Payment date is required");
    if (payment.netAmount <= 0)
      errors.push("Net amount must be greater than 0");
    if (payment.daysWorked < 0) errors.push("Days worked cannot be negative");

    // Check date format
    if (payment.payDate && isNaN(new Date(payment.payDate).getTime())) {
      errors.push("Invalid payment date format");
    }

    // Check amounts consistency
    const totalBonuses = payment.paymentBonuses.reduce(
      (sum, bonus) => sum + bonus.amount,
      0
    );
    const totalDeductions = payment.paymentDeductions.reduce(
      (sum, deduction) => sum + deduction.amount,
      0
    );
    const calculatedGross =
      payment.baseAmount + payment.overtimeAmount + totalBonuses;
    const calculatedNet = calculatedGross - totalDeductions;

    if (Math.abs(payment.amount - calculatedGross) > 0.01) {
      errors.push("Gross amount doesn't match calculated total");
    }

    if (Math.abs(payment.netAmount - calculatedNet) > 0.01) {
      errors.push("Net amount doesn't match calculated net");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get payslip statistics for reporting
   */
  static getPayslipStatistics(payment: PayslipData) {
    const totalBonuses = payment.paymentBonuses.reduce(
      (sum, bonus) => sum + bonus.amount,
      0
    );
    const totalDeductions = payment.paymentDeductions.reduce(
      (sum, deduction) => sum + deduction.amount,
      0
    );
    const grossSalary =
      payment.baseAmount + payment.overtimeAmount + totalBonuses;
    const totalHours = payment.regularHours + payment.overtimeHours;

    return {
      grossSalary,
      netSalary: payment.netAmount,
      totalBonuses,
      totalDeductions,
      baseSalary: payment.baseAmount,
      overtimeAmount: payment.overtimeAmount,
      regularHours: payment.regularHours,
      overtimeHours: payment.overtimeHours,
      totalHours,
      daysWorked: payment.daysWorked,
      hourlyRate: payment.worker?.ratePerHour || 0,
      bonusCount: payment.paymentBonuses.length,
      deductionCount: payment.paymentDeductions.length,
      bonusTypes: payment.paymentBonuses.map((b) => b.bonusType),
      deductionTypes: payment.paymentDeductions.map((d) => d.deductionType),
      paymentDate: new Date(payment.payDate),
      workerType: payment.worker?.isFreelancer ? "freelancer" : "employee",
    };
  }
}
