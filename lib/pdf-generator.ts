import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Payroll } from "@/types/payroll";
import { Decimal } from "@prisma/client/runtime/library";

interface CompanySettings {
  id: string;
  companyName: string;
  taxId: string;
  address: string;
  city: string;
  website?: string;
  paymentTerms?: string;
  note?: string;
  bankAccount?: string;
  bankAccount2?: string;
  bankName?: string;
  bankName2?: string;
  logo?: string;
  province: string;
  postCode: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  email: string;
}

// Define proper RGB color tuples
type RGBColor = [number, number, number];

interface ColorScheme {
  primary: RGBColor;
  secondary: RGBColor;
  accent: RGBColor;
  success: RGBColor;
  warning: RGBColor;
  lightBg: RGBColor;
  border: RGBColor;
}

export class PayrollPDFGenerator {
  // Color scheme for professional look - properly typed as RGB tuples
  private static readonly COLORS: ColorScheme = {
    primary: [15, 23, 42], // Slate-900
    secondary: [71, 85, 105], // Slate-600
    accent: [14, 165, 233], // Sky-500
    success: [16, 185, 129], // Emerald-500
    warning: [245, 158, 11], // Amber-500
    lightBg: [248, 250, 252], // Slate-50
    border: [226, 232, 240], // Slate-200
  };

  static async generatePayrollReport(
    payroll: Payroll,
    company: CompanySettings | null,
    getPaymentAmount: (amount: number | Decimal | undefined | null) => number,
    formatCurrency: (amount: number) => string,
    formatHours: (hours: number) => string,
    formatMonth: (month: string) => string
  ): Promise<Blob> {
    const doc = new jsPDF();

    // Set default font
    doc.setFont("helvetica");

    // Add cover page for professional look
    await this.addCoverPage(doc, payroll, company, formatMonth);

    // Add summary page
    this.addSummaryPage(
      doc,
      payroll,
      company,
      getPaymentAmount,
      formatCurrency,
      formatMonth
    );

    // Add employee directory
    this.addEmployeeDirectory(doc, payroll, getPaymentAmount, formatCurrency);

    // Add detailed breakdown - this should start on a new page after employee directory
    this.addDetailedBreakdown(
      doc,
      payroll,
      getPaymentAmount,
      formatCurrency,
      formatHours
    );

    return doc.output("blob");
  }

  private static async addCoverPage(
    doc: jsPDF,
    payroll: Payroll,
    company: CompanySettings | null,
    formatMonth: (month: string) => string
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add background design element
    doc.setFillColor(...this.COLORS.lightBg);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Add logo centered at top
    if (company?.logo) {
      try {
        const logoImg = await this.loadImage(company.logo);
        const logoSize = 60;
        const logoX = (pageWidth - logoSize) / 2;
        doc.addImage(logoImg, "PNG", logoX, 40, logoSize, logoSize);
      } catch (error) {
        console.warn("Could not load logo:", error);
      }
    }

    // Main title
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.COLORS.primary);
    doc.text("PAYROLL REPORT", pageWidth / 2, 130, { align: "center" });

    // Period
    doc.setFontSize(18);
    doc.setTextColor(...this.COLORS.secondary);
    doc.text(formatMonth(payroll.month), pageWidth / 2, 150, {
      align: "center",
    });

    // Company name
    if (company?.companyName) {
      doc.setFontSize(16);
      doc.setTextColor(...this.COLORS.accent);
      doc.text(company.companyName, pageWidth / 2, 170, { align: "center" });
    }

    // Report details
    doc.setFontSize(11);
    doc.setTextColor(...this.COLORS.secondary);
    doc.text(
      `Reference: ${payroll.transaction.reference}`,
      pageWidth / 2,
      200,
      { align: "center" }
    );
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      210,
      { align: "center" }
    );
    doc.text(
      `Processed by: ${payroll.createdByName || "System"}`,
      pageWidth / 2,
      220,
      { align: "center" }
    );

    // Footer note
    doc.setFontSize(9);
    doc.setTextColor(...this.COLORS.secondary);
    doc.text("Confidential Payroll Document", pageWidth / 2, pageHeight - 30, {
      align: "center",
    });
  }

  private static addSummaryPage(
    doc: jsPDF,
    payroll: Payroll,
    company: CompanySettings | null,
    getPaymentAmount: (amount: number | Decimal | undefined | null) => number,
    formatCurrency: (amount: number) => string,
    formatMonth: (month: string) => string
  ) {
    doc.addPage();

    // Header
    this.addPageHeader(doc, "Executive Summary", payroll, formatMonth);

    const startY = 50;

    // Key metrics in a professional grid
    const metrics = [
      {
        label: "Total Employees",
        value: payroll.payments.length.toString(),
        color: this.COLORS.accent,
      },
      {
        label: "Total Payroll",
        value: formatCurrency(
          payroll.payments.reduce(
            (sum, p) => sum + getPaymentAmount(p.amount),
            0
          )
        ),
        color: this.COLORS.success,
      },
      {
        label: "Base Salaries",
        value: formatCurrency(
          payroll.payments.reduce(
            (sum, p) => sum + getPaymentAmount(p.baseAmount),
            0
          )
        ),
        color: this.COLORS.primary,
      },
      {
        label: "Overtime Total",
        value: formatCurrency(
          payroll.payments.reduce(
            (sum, p) => sum + getPaymentAmount(p.overtimeAmount),
            0
          )
        ),
        color: this.COLORS.warning,
      },
    ];

    // Add metrics cards
    metrics.forEach((metric, index) => {
      const x = 20 + (index % 2) * 85;
      const y = startY + Math.floor(index / 2) * 35;

      // Card background
      doc.setFillColor(...this.COLORS.lightBg);
      doc.roundedRect(x, y, 75, 25, 3, 3, "F");

      // Border
      doc.setDrawColor(...this.COLORS.border);
      doc.roundedRect(x, y, 75, 25, 3, 3, "S");

      // Label
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.COLORS.secondary);
      doc.text(metric.label, x + 5, y + 8);

      // Value
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...metric.color);
      doc.text(metric.value, x + 5, y + 18);
    });

    // Department breakdown
    const departmentBreakdown = this.getDepartmentBreakdown(
      payroll,
      getPaymentAmount,
      formatCurrency
    );
    const breakdownY = startY + 80;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.COLORS.primary);
    doc.text("Department Breakdown", 20, breakdownY);

    autoTable(doc, {
      startY: breakdownY + 8,
      head: [["Department", "Employees", "Total Payroll", "Average Salary"]],
      body: departmentBreakdown,
      theme: "grid",
      headStyles: {
        fillColor: this.COLORS.primary,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: this.COLORS.primary,
      },
      alternateRowStyles: {
        fillColor: this.COLORS.lightBg,
      },
      styles: {
        lineColor: this.COLORS.border,
        lineWidth: 0.1,
      },
      margin: { horizontal: 20 },
    });

    this.addPageFooter(doc, payroll, 1);
  }

  private static addEmployeeDirectory(
    doc: jsPDF,
    payroll: Payroll,
    getPaymentAmount: (amount: number | Decimal | undefined | null) => number,
    formatCurrency: (amount: number) => string
  ) {
    doc.addPage();

    this.addPageHeader(doc, "Employee Directory", payroll);

    // Calculate totals for the summary header
    const totalBase = payroll.payments.reduce(
      (sum, p) => sum + getPaymentAmount(p.baseAmount),
      0
    );
    const totalOvertime = payroll.payments.reduce(
      (sum, p) => sum + getPaymentAmount(p.overtimeAmount),
      0
    );
    const totalAmount = payroll.payments.reduce(
      (sum, p) => sum + getPaymentAmount(p.amount),
      0
    );

    // Add summary header
    const startY = 50;

    // Summary header background
    doc.setFillColor(...this.COLORS.primary);
    doc.rect(15, startY, doc.internal.pageSize.getWidth() - 30, 12, "F");

    // Summary header text
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);

    // Summary values
    doc.text("Total Employees", 20, startY + 8);
    doc.text(
      formatCurrency(totalBase),
      doc.internal.pageSize.getWidth() - 85,
      startY + 8,
      { align: "right" }
    );
    doc.text(
      formatCurrency(totalOvertime),
      doc.internal.pageSize.getWidth() - 55,
      startY + 8,
      { align: "right" }
    );
    doc.text(
      formatCurrency(totalAmount),
      doc.internal.pageSize.getWidth() - 20,
      startY + 8,
      { align: "right" }
    );

    const tableData = payroll.payments.map((payment, index) => [
      (index + 1).toString(),
      `${payment.employee.firstName} ${payment.employee.lastName}`,
      `#${payment.employee.employeeNumber}`,
      payment.employee.department?.name || "N/A",
      formatCurrency(getPaymentAmount(payment.baseAmount)),
      formatCurrency(getPaymentAmount(payment.overtimeAmount)),
      formatCurrency(getPaymentAmount(payment.amount)),
    ]);

    autoTable(doc, {
      startY: startY + 15,
      head: [
        [
          "#",
          "Employee Name",
          "Emp ID",
          "Department",
          "Base Salary",
          "Overtime",
          "Total",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: this.COLORS.primary,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: this.COLORS.primary,
      },
      alternateRowStyles: {
        fillColor: this.COLORS.lightBg,
      },
      // Balanced column widths for better readability
      columnStyles: {
        0: { cellWidth: 12, halign: "center" }, // # column
        1: { cellWidth: 42 }, // Employee Name
        2: { cellWidth: 30, fontStyle: "bold" }, // Emp ID
        3: { cellWidth: 35 }, // Department
        4: { cellWidth: 28, halign: "left" }, // Base Salary
        5: { cellWidth: 25, halign: "left" }, // Overtime
        6: { cellWidth: 28, halign: "left", fontStyle: "bold" }, // Total
      },
      styles: {
        lineColor: this.COLORS.border,
        lineWidth: 0.1,
        font: "helvetica",
      },
      margin: { horizontal: 15 },
      tableWidth: "auto",
      didDrawPage: (data) => {
        this.addPageNumber(doc, data, 2);
      },
    });
  }

  private static addDetailedBreakdown(
    doc: jsPDF,
    payroll: Payroll,
    getPaymentAmount: (amount: number | Decimal | undefined | null) => number,
    formatCurrency: (amount: number) => string,
    formatHours: (hours: number) => string
  ) {
    // Always start detailed breakdown on a new page
    // Get current page count and add a new page if we're not already at the end
    const currentPageCount = doc.getNumberOfPages();

    // Start individual employee pages from page 4 onwards (after cover, summary, and directory)
    let currentPage = 4;

    payroll.payments.forEach((payment, index) => {
      // Always add a new page for each employee detail
      if (index > 0 || currentPageCount < 4) {
        doc.addPage();
        currentPage++;
      }

      this.addPageHeader(
        doc,
        `${payment.employee.firstName} ${payment.employee.lastName}`,
        payroll
      );

      let startY = 50;

      // Employee Information Card
      doc.setFillColor(...this.COLORS.lightBg);
      doc.roundedRect(
        20,
        startY,
        doc.internal.pageSize.getWidth() - 40,
        35,
        3,
        3,
        "F"
      );
      doc.setDrawColor(...this.COLORS.border);
      doc.roundedRect(
        20,
        startY,
        doc.internal.pageSize.getWidth() - 40,
        35,
        3,
        3,
        "S"
      );

      // Employee details
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...this.COLORS.primary);
      doc.text("EMPLOYEE INFORMATION", 25, startY + 8);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.COLORS.secondary);
      doc.text(
        `Name: ${payment.employee.firstName} ${payment.employee.lastName}`,
        25,
        startY + 16
      );
      doc.text(
        `Employee ID: #${payment.employee.employeeNumber}`,
        25,
        startY + 22
      );
      doc.text(`Position: ${payment.employee.position}`, 25, startY + 28);
      doc.text(
        `Department: ${payment.employee.department?.name || "N/A"}`,
        120,
        startY + 16
      );

      startY += 45;

      // Payment Details Card
      doc.setFillColor(...this.COLORS.lightBg);
      doc.roundedRect(
        20,
        startY,
        doc.internal.pageSize.getWidth() - 40,
        45,
        3,
        3,
        "F"
      );
      doc.setDrawColor(...this.COLORS.border);
      doc.roundedRect(
        20,
        startY,
        doc.internal.pageSize.getWidth() - 40,
        45,
        3,
        3,
        "S"
      );

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...this.COLORS.primary);
      doc.text("PAYMENT DETAILS", 25, startY + 8);

      const paymentDetails = [
        [
          "Base Salary:",
          formatCurrency(getPaymentAmount(payment.baseAmount)),
          "Regular Hours:",
          formatHours(getPaymentAmount(payment.regularHours)),
        ],
        [
          "Overtime Amount:",
          formatCurrency(getPaymentAmount(payment.overtimeAmount)),
          "Overtime Hours:",
          formatHours(getPaymentAmount(payment.overtimeHours)),
        ],
        [
          "Total Amount:",
          formatCurrency(getPaymentAmount(payment.amount)),
          "Days Worked:",
          `${payment.daysWorked || 0} days`,
        ],
        [
          "Payment Type:",
          payment.type.toUpperCase(),
          "Payment Date:",
          new Date(payment.payDate).toLocaleDateString(),
        ],
      ];

      paymentDetails.forEach((detail, rowIndex) => {
        const y = startY + 16 + rowIndex * 7;

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...this.COLORS.secondary);
        doc.text(detail[0], 25, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...this.COLORS.primary);
        doc.text(detail[1], 70, y);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...this.COLORS.secondary);
        doc.text(detail[2], 120, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...this.COLORS.primary);
        doc.text(detail[3], 160, y);
      });

      // Notes section if available
      if (payment.description) {
        startY += 55;
        doc.setFillColor(...this.COLORS.lightBg);
        doc.roundedRect(
          20,
          startY,
          doc.internal.pageSize.getWidth() - 40,
          20,
          3,
          3,
          "F"
        );
        doc.setDrawColor(...this.COLORS.border);
        doc.roundedRect(
          20,
          startY,
          doc.internal.pageSize.getWidth() - 40,
          20,
          3,
          3,
          "S"
        );

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...this.COLORS.primary);
        doc.text("ADDITIONAL NOTES", 25, startY + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...this.COLORS.secondary);
        doc.text(payment.description, 25, startY + 15, { maxWidth: 150 });
      }

      this.addPageFooter(doc, payroll, currentPage);
    });
  }

  private static addPageHeader(
    doc: jsPDF,
    title: string,
    payroll: Payroll,
    formatMonth?: (month: string) => string
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top border
    doc.setDrawColor(...this.COLORS.accent);
    doc.setLineWidth(2);
    doc.line(20, 15, pageWidth - 20, 15);

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.COLORS.primary);
    doc.text(title, 20, 25);

    // Subtitle
    if (formatMonth) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.COLORS.secondary);
      doc.text(`Payroll Period: ${formatMonth(payroll.month)}`, 20, 32);
    }

    // Reference
    doc.setFontSize(9);
    doc.setTextColor(...this.COLORS.secondary);
    doc.text(`Ref: ${payroll.transaction.reference}`, pageWidth - 20, 25, {
      align: "right",
    });
  }

  private static addPageFooter(
    doc: jsPDF,
    payroll: Payroll,
    pageNumber: number
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Footer border
    doc.setDrawColor(...this.COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);

    // Page number
    doc.setFontSize(9);
    doc.setTextColor(...this.COLORS.secondary);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 15, {
      align: "center",
    });

    // Confidential notice
    doc.text("Confidential and Proprietary", pageWidth - 20, pageHeight - 15, {
      align: "right",
    });
  }

  private static addPageNumber(doc: jsPDF, data: any, section: number) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(...this.COLORS.secondary);
    doc.text(
      `Section ${section} - Page ${data.pageNumber} of ${pageCount}`,
      data.settings.margin.left,
      doc.internal.pageSize.height - 10
    );
  }

  private static getDepartmentBreakdown(
    payroll: Payroll,
    getPaymentAmount: (amount: number | Decimal | undefined | null) => number,
    formatCurrency: (amount: number) => string
  ): string[][] {
    const deptMap = new Map();

    payroll.payments.forEach((payment) => {
      const deptName = payment.employee.department?.name || "No Department";
      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, {
          count: 0,
          total: 0,
        });
      }
      const dept = deptMap.get(deptName);
      dept.count++;
      dept.total += getPaymentAmount(payment.amount);
    });

    return Array.from(deptMap.entries()).map(([dept, data]) => [
      dept,
      data.count.toString(),
      formatCurrency(data.total),
      formatCurrency(data.total / data.count),
    ]);
  }

  private static loadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}
