import { format } from "date-fns";

export interface PayslipData {
  id: string;
  employeeId: string | null;
  freeLancerId: string | null;
  amount: number;
  netAmount: number;
  baseAmount: number;
  overtimeAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  payDate: string;
  description: string | null;
  currency: string;
  type: string;
  daysWorked: number;
  overtimeHours: number;
  regularHours: number;
  status: string;

  worker?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber?: string;
    freeLancerNumber?: string;
    position: string;
    email: string;
    phone: string | null;
    address: string | null;
    idNumber: string | null;
    taxNumber: string | null;
    hireDate: string | null;
    ratePerHour: number;
    isFreelancer: boolean;
    department: {
      name: string;
    } | null;
  };

  company?: {
    companyName: string;
    address: string;
    address2?: string;
    phone?: string;
    phone2?: string;
    email?: string;
    taxId?: string;
    registrationNumber?: string;
    bankName?: string;
    bankAccount?: string;
    bankName2?: string;
    bankAccount2?: string;
    logo?: string;
  };

  paymentBonuses: Array<{
    id: string;
    bonusType: string;
    amount: number;
    description: string | null;
    isPercentage: boolean;
    percentageRate: number | null;
  }>;

  paymentDeductions: Array<{
    id: string;
    deductionType: string;
    amount: number;
    description: string | null;
    isPercentage: boolean;
    percentageRate: number | null;
  }>;

  Payroll?: {
    month: string;
    description: string;
  };
}

export class PayslipGenerator {
  private static formatNumber(amount: number): string {
    return amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  }

  private static formatBonusType(type: string): string {
    // Format bonus type for display
    return type
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  static generatePayslipHTML(payment: PayslipData, companyInfo?: any): string {
    const worker = payment.worker;
    const company = companyInfo || payment.company;

    // Get actual bonuses and format them
    const actualBonuses = payment.paymentBonuses.map((bonus) => ({
      type: this.formatBonusType(bonus.bonusType),
      amount: bonus.amount,
      description: bonus.description,
    }));

    // Get actual deductions
    const actualDeductions = payment.paymentDeductions.map((deduction) => ({
      type: deduction.deductionType,
      amount: deduction.amount,
      description: deduction.description,
    }));

    // Calculate totals
    const totalBonuses = payment.paymentBonuses.reduce(
      (sum, bonus) => sum + bonus.amount,
      0
    );
    const grossSalary =
      payment.baseAmount + payment.overtimeAmount + totalBonuses;
    const netPay = payment.netAmount;
    const totalDeductions = payment.paymentDeductions.reduce(
      (sum, deduction) => sum + deduction.amount,
      0
    );

    // Find specific deductions
    const uifDeduction = payment.paymentDeductions.find(
      (d) =>
        d.deductionType.includes("UIF") ||
        d.deductionType.toLowerCase().includes("unemployment") ||
        d.deductionType.toLowerCase().includes("insurance")
    );

    const taxDeduction = payment.paymentDeductions.find(
      (d) =>
        d.deductionType === "TAX" ||
        d.deductionType.toLowerCase().includes("tax")
    );

    // Sum all tool deductions
    const toolsDeductions = payment.paymentDeductions.filter(
      (d) =>
        d.deductionType === "TOOLS" ||
        d.deductionType.toLowerCase().includes("tool")
    );
    const totalTools = toolsDeductions.reduce((sum, d) => sum + d.amount, 0);

    const vehicleDeduction = payment.paymentDeductions.find(
      (d) =>
        d.deductionType.includes("VEHICLE") ||
        d.deductionType.toLowerCase().includes("vehicle")
    );

    // Prepare bonus rows (show first 3 actual bonuses or empty rows)
    const bonusRows = [];
    for (let i = 0; i < 3; i++) {
      if (i < actualBonuses.length) {
        bonusRows.push(actualBonuses[i]);
      } else {
        // Fill with default bonus types
        if (i === 0)
          bonusRows.push({ type: "Bonus", amount: 0, description: null });
        else if (i === 1)
          bonusRows.push({
            type: "Savings Bonus",
            amount: 0,
            description: null,
          });
        else if (i === 2)
          bonusRows.push({
            type: "Medical Expenses",
            amount: 0,
            description: null,
          });
      }
    }

    // Add company logo if available
    const logoHtml = company?.logo
      ? `<img src="${company.logo}" alt="Company Logo" style="max-height: 90px; margin-bottom: 10px;">`
      : "";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslip</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.3;
      margin: 0;
      padding: 20px;
      color: #000;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0 10px 0;
      text-transform: uppercase;
    }
    
    .employer-section {
      margin-bottom: 25px;
    }
    
    .employer-label {
      font-weight: bold;
      display: block;
      margin-bottom: 2px;
    }
    
    .company-name {
      font-weight: normal;
      margin-left: 5px;
    }
    
    .employee-details {
      display: grid;
      grid-template-columns: auto 1fr auto 1fr;
      gap: 5px 20px;
      margin-bottom: 20px;
    }
    
    .detail-label {
      font-weight: bold;
      white-space: nowrap;
    }
    
    .detail-value {
      white-space: nowrap;
    }
    
    .separator {
      border-top: 1px solid #000;
      margin: 20px 0;
    }
    
    /* Main Table */
    .main-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10px;
    }
    
    .main-table th,
    .main-table td {
      border: 1px solid #000;
      padding: 5px 8px;
      vertical-align: top;
    }
    
    .main-table th {
      text-align: left;
      font-weight: bold;
      background-color: #f5f5f5;
    }
    
    .units-column {
      width: 50px;
      text-align: center;
    }
    
    .amount-column {
      width: 100px;
      text-align: right;
    }
    
    .opening-balance-column {
      width: 80px;
      text-align: center;
    }
    
    .total-row {
      font-weight: bold;
      background-color: #f0f0f0;
    }
    
    .net-pay-section {
      margin-top: 15px;
      margin-left: 400px;
    }
    
    .net-pay-label {
      font-weight: bold;
      display: inline-block;
      width: 100px;
    }
    
    .net-pay-value {
      font-weight: bold;
      font-size: 12px;
      display: inline-block;
      width: 100px;
      text-align: right;
    }
    
    /* Bottom Sections */
    .bottom-sections {
      display: flex;
      gap: 40px;
      margin-top: 25px;
    }
    
    .section {
      flex: 1;
    }
    
    .section h3 {
      font-size: 11px;
      font-weight: bold;
      margin: 0 0 10px 0;
      text-align: center;
      background-color: #f5f5f5;
      padding: 3px;
      border: 1px solid #000;
    }
    
    .section-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    
    .section-table th,
    .section-table td {
      border: 1px solid #000;
      padding: 5px 8px;
      text-align: left;
    }
    
    .section-table .amount-cell {
      width: 100px;
      text-align: right;
    }
    
    .fringe-benefits {
      margin-top: 20px;
    }
    
    .fringe-label {
      font-weight: bold;
      display: inline-block;
      width: 120px;
    }
    
    /* Print styles */
    @media print {
      body {
        padding: 10px;
        font-size: 10px;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- Header with Logo -->
    <div class="header">
      ${logoHtml}
      <h1>PAYSLIP</h1>
    </div>
    
    <!-- Employer Information -->
    <div class="employer-section">
      <span class="employer-label">Name of Employer:</span>
      <span class="company-name">${company?.companyName || "Ndou Electrical Construction And Supply Engineers"}</span>
      <br>
      <span class="employer-label">Company Address:</span>
      <span class="company-name">${company?.address || "Shayandima 88 Khwevha Street"}</span>
      <br>
      <span class="employer-label"></span>
      <span class="company-name">${company?.address2 || "After Shoprite, after township next to Gwamasenga Dry Clean"}</span>
    </div>
    
    <!-- Employee Details -->
    <div class="employee-details">
      <div class="detail-label">Employee Code:</div>
      <div class="detail-value">${worker?.employeeNumber || "NECS 003"}</div>
      <div class="detail-label">Name of Employee:</div>
      <div class="detail-value">${worker?.firstName || "Ramahala"} ${worker?.lastName || "Andani"}</div>
      
      <div class="detail-label">Employee Address:</div>
      <div class="detail-value">${worker?.address || "House No 702"}</div>
      <div class="detail-label">I.D. Number:</div>
      <div class="detail-value">${worker?.idNumber || "9507135493083"}</div>
      
      <div class="detail-label"></div>
      <div class="detail-value">${worker?.address ? "" : "Tshisaulu, Siawoadza"}</div>
      <div class="detail-label">Job Title:</div>
      <div class="detail-value">${worker?.position || "Site Manager/Technician"}</div>
      
      <div class="detail-label">Tax Number:</div>
      <div class="detail-value">${worker?.taxNumber || "1267131199"}</div>
      <div class="detail-label">Pay Date:</div>
      <div class="detail-value">${this.formatDate(payment.payDate)}</div>
    </div>
    
    <div class="separator"></div>
    
    <!-- Main Table -->
    <table class="main-table">
      <thead>
        <tr>
          <th></th>
          <th class="units-column">Units</th>
          <th class="amount-column">Amount</th>
          <th>Deductions</th>
          <th class="opening-balance-column">Opening Balance</th>
          <th class="amount-column">Amount</th>
        </tr>
      </thead>
      <tbody>
        <!-- Basic Salary Row -->
        <tr>
          <td>Basic Salary</td>
          <td class="units-column">R</td>
          <td class="amount-column">${this.formatNumber(payment.baseAmount)}</td>
          <td>Unemployment Insurance Fund</td>
          <td class="opening-balance-column">-</td>
          <td class="amount-column">${uifDeduction ? this.formatNumber(uifDeduction.amount) : "-"}</td>
        </tr>
        
        <!-- Bonus Row 1 -->
        <tr>
          <td>${bonusRows[0].type}</td>
          <td class="units-column">R</td>
          <td class="amount-column">${bonusRows[0].amount > 0 ? this.formatNumber(bonusRows[0].amount) : "-"}</td>
          <td>Employee Tax</td>
          <td class="opening-balance-column">-</td>
          <td class="amount-column">${taxDeduction ? this.formatNumber(taxDeduction.amount) : "-"}</td>
        </tr>
        
        <!-- Bonus Row 2 -->
        <tr>
          <td>${bonusRows[1].type}</td>
          <td class="units-column">R</td>
          <td class="amount-column">${bonusRows[1].amount > 0 ? this.formatNumber(bonusRows[1].amount) : "-"}</td>
          <td>Tools</td>
          <td class="opening-balance-column">-</td>
          <td class="amount-column">${totalTools > 0 ? this.formatNumber(totalTools) : "-"}</td>
        </tr>
        
        <!-- Bonus Row 3 -->
        <tr>
          <td>${bonusRows[2].type}</td>
          <td class="units-column">R</td>
          <td class="amount-column">${bonusRows[2].amount > 0 ? this.formatNumber(bonusRows[2].amount) : "-"}</td>
          <td>Vehicle negligence</td>
          <td class="opening-balance-column">-</td>
          <td class="amount-column">${vehicleDeduction ? this.formatNumber(vehicleDeduction.amount) : "-"}</td>
        </tr>
        
        <!-- Total Row -->
        <tr class="total-row">
          <td><strong>Total Income</strong></td>
          <td class="units-column"><strong>R</strong></td>
          <td class="amount-column"><strong>${this.formatNumber(grossSalary)}</strong></td>
          <td><strong>Total Deductions</strong></td>
          <td class="opening-balance-column"></td>
          <td class="amount-column"><strong>${this.formatNumber(totalDeductions)}</strong></td>
        </tr>
      </tbody>
    </table>
    
    <!-- Net Pay -->
    <div class="net-pay-section">
      <span class="net-pay-label">Net Pay</span>
      <span class="net-pay-value">${this.formatNumber(netPay)}</span>
    </div>
    
    <!-- Bottom Sections -->
    <div class="bottom-sections">
      <!-- Company Deductions -->
      <div class="section">
        <h3>Company Deductions</h3>
        <table class="section-table">
          <thead>
            <tr>
              <th></th>
              <th class="amount-cell">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Unemployment Insurance Fund</td>
              <td class="amount-cell">${uifDeduction ? "R " + this.formatNumber(uifDeduction.amount) : "-"}</td>
            </tr>
            ${actualDeductions
              .filter(
                (d) =>
                  !d.type.includes("UIF") &&
                  !d.type.includes("TAX") &&
                  !d.type.toLowerCase().includes("tool") &&
                  !d.type.toLowerCase().includes("vehicle")
              )
              .map(
                (deduction) => `
              <tr>
                <td>${this.formatBonusType(deduction.type)}</td>
                <td class="amount-cell">R ${this.formatNumber(deduction.amount)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      
      <!-- YTD Totals -->
      <div class="section">
        <h3>YTD Totals</h3>
        <table class="section-table">
          <thead>
            <tr>
              <th></th>
              <th class="amount-cell">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Income taxable</td>
              <td class="amount-cell">${this.formatNumber(grossSalary)}</td>
            </tr>
            <tr>
              <td>Payment to employee</td>
              <td class="amount-cell">${this.formatNumber(netPay)}</td>
            </tr>
            <tr>
              <td>Tax Paid</td>
              <td class="amount-cell">${taxDeduction ? this.formatNumber(taxDeduction.amount) : "-"}</td>
            </tr>
            <tr>
              <td>Provision for Tax on Annual Bonus</td>
              <td class="amount-cell">0.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Fringe Benefits -->
    <div class="fringe-benefits">
      <span class="fringe-label">Fringe Benefits</span>
      <span>Amount</span>
    </div>
    
    <!-- Additional Bonuses (if more than 3) -->
    ${
      actualBonuses.length > 3
        ? `
    <div style="margin-top: 20px; font-size: 10px;">
      <strong>Additional Bonuses:</strong>
      <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
        ${actualBonuses
          .slice(3)
          .map(
            (bonus) => `
        <tr>
          <td style="padding: 2px 5px;">${bonus.type}</td>
          <td style="padding: 2px 5px; text-align: right;">R ${this.formatNumber(bonus.amount)}</td>
        </tr>
        `
          )
          .join("")}
      </table>
    </div>
    `
        : ""
    }
    
  </div>
</body>
</html>
    `;
  }
}
