import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { auth } from "@clerk/nextjs/server";
import { formatCurrency } from "@/lib/formatters";

// Type definitions for our data
interface Employee {
  firstName: string;
  lastName: string;
  position: string;
  department: {
    name: string;
  } | null;
  employeeNumber: string;
}

interface Payment {
  id: string;
  baseAmount: any;
  overtimeAmount: any;
  amount: any;
  employee: Employee;
  type: string;
  daysWorked: number | null;
  overtimeHours: any;
  regularHours: any;
  payDate: Date;
  description?: string;
}

interface Transaction {
  reference: string;
  date: Date;
  description: string;
}

interface Payroll {
  id: string;
  month: string;
  description: string;
  status: string;
  type: string;
  currency: string;
  totalAmount: any;
  baseAmount: any;
  overtimeAmount: any;
  createdAt: Date;
  createdByName?: string;
  payments: Payment[];
  transaction: Transaction;
  _count?: {
    payments: number;
  };
}

interface GeneralSetting {
  id: string;
  userId: string;
  companyName: string;
  taxId: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  website?: string;
  paymentTerms?: string;
  note?: string;
  bankAccount?: string;
  bankAccount2?: string;
  bankName?: string;
  bankName2?: string;
  logo?: string;
  email: string;
  Address: string;
  city: string;
  province: string;
  postCode: string;
  createdAt: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🔍 Payroll report API called");

  try {
    const { userId: clerkUserId } = await auth();
    console.log("👤 Clerk User ID:", clerkUserId);

    if (!clerkUserId) {
      console.log("❌ Unauthorized access");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Await the params before using them
    const { id: payrollId } = await params;
    console.log("📋 Payroll ID:", payrollId);

    // Fetch payroll with all related data
    const payroll = await db.payroll.findUnique({
      where: {
        id: payrollId,
      },
      include: {
        payments: {
          include: {
            employee: {
              include: {
                department: true,
              },
            },
          },
        },
        transaction: true,
      },
    });

    console.log("📊 Payroll data found:", !!payroll);
    if (payroll) {
      console.log("📊 Payroll details:", {
        id: payroll.id,
        month: payroll.month,
        paymentsCount: payroll.payments?.length,
        totalAmount: payroll.totalAmount,
        status: payroll.status,
      });
    }

    if (!payroll) {
      console.log("❌ Payroll not found");
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    // Fetch company settings
    console.log("🏢 Fetching company settings...");
    const companySettings = await db.generalSetting.findFirst();

    console.log("🏢 Company settings found:", !!companySettings);
    if (companySettings) {
      console.log("🏢 Company name:", companySettings.companyName);
      console.log("🏢 Logo URL:", companySettings.logo);
      console.log("🏢 Email:", companySettings.email);
      console.log("🏢 Address:", companySettings.Address);
    }

    if (!companySettings) {
      console.log("❌ No company settings found");
      return NextResponse.json(
        { error: "Company settings not found" },
        { status: 404 }
      );
    }

    console.log("📄 Starting PDF generation...");

    // Generate PDF report
    const payrollData = payroll as unknown as Payroll;
    const companyData = companySettings as unknown as GeneralSetting;

    try {
      const pdfBuffer = await generatePayrollReportPDF(
        payrollData,
        companyData
      );
      console.log("✅ PDF generated successfully, size:", pdfBuffer.length);

      // Convert Buffer to Uint8Array for NextResponse
      const pdfUint8Array = new Uint8Array(pdfBuffer);

      // Return PDF as downloadable file
      return new NextResponse(pdfUint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="payroll-${payroll.month}-${payrollId}.pdf"`,
          "Content-Length": pdfUint8Array.length.toString(),
        },
      });
    } catch (pdfError) {
      console.error("❌ PDF generation error:", pdfError);
      throw new Error(`PDF generation failed: ${pdfError}`);
    }
  } catch (error) {
    console.error("❌ Error in payroll report API:", error);

    // More detailed error information
    if (error instanceof Error) {
      console.error("❌ Error name:", error.name);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to generate payroll report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PDF Generation function using jsPDF
async function generatePayrollReportPDF(
  payroll: Payroll,
  company: GeneralSetting
): Promise<Buffer> {
  console.log("📄 Starting generatePayrollReportPDF...");
  try {
    const result = await generatePDFWithJSPDF(payroll, company);
    console.log("✅ generatePayrollReportPDF completed");
    return result;
  } catch (error) {
    console.error("❌ generatePayrollReportPDF failed:", error);
    throw error;
  }
}

// Implementation with jsPDF
async function generatePDFWithJSPDF(
  payroll: Payroll,
  company: GeneralSetting
): Promise<Buffer> {
  console.log("📄 Starting generatePDFWithJSPDF...");

  try {
    const doc = new jsPDF();
    console.log("✅ jsPDF instance created");

    // Add header with company info - make this more robust
    console.log("📄 Adding header...");
    addHeader(doc, payroll, company);

    // Add payroll summary section
    console.log("📄 Adding payroll summary...");
    addPayrollSummary(doc, payroll);

    // Add employee breakdown table
    console.log("📄 Adding employee table...");
    addEmployeeTable(doc, payroll);

    // Add company footer
    console.log("📄 Adding footer...");
    addFooter(doc, payroll, company);

    console.log("📄 Converting to buffer...");
    // Convert to Buffer
    const pdfOutput = doc.output("arraybuffer");
    const buffer = Buffer.from(pdfOutput);

    console.log(
      "✅ generatePDFWithJSPDF completed, buffer size:",
      buffer.length
    );
    return buffer;
  } catch (error) {
    console.error("❌ generatePDFWithJSPDF failed:", error);
    throw error;
  }
}

function addHeader(doc: jsPDF, payroll: Payroll, company: GeneralSetting) {
  try {
    const pageWidth = doc.internal.pageSize.width;

    console.log("🏢 Adding company information to header...");
    console.log("🏢 Company:", company.companyName);
    console.log("🏢 Logo available:", !!company.logo);

    // Always show company information on the left
    const companyInfoX = 20;
    let currentY = 25;

    // Company Name - always show this
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(company.companyName, companyInfoX, currentY);
    currentY += 8;

    // Try to add logo in a non-blocking way
    let logoSuccess = false;
    if (company.logo) {
      try {
        console.log("🖼️ Attempting to load logo:", company.logo);
        // Use a simple approach - if it fails, we'll catch and continue
        doc.addImage(company.logo, "PNG", pageWidth - 60, 15, 40, 40);
        logoSuccess = true;
        console.log("✅ Logo added successfully");
      } catch (logoError) {
        console.warn(
          "❌ Could not load company logo, continuing without it:",
          logoError
        );
        logoSuccess = false;
      }
    }

    // Company contact info - ALWAYS show this regardless of logo
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Address
    const addressText = `Address: ${company.Address}, ${company.city}, ${company.province} ${company.postCode}`;
    doc.text(addressText, companyInfoX, currentY, { maxWidth: pageWidth - 40 });
    currentY += 6;

    // Phone
    doc.text(`Phone: ${company.phone}`, companyInfoX, currentY);
    currentY += 6;

    // Phone 2 if available
    if (company.phone2) {
      doc.text(`Phone 2: ${company.phone2}`, companyInfoX, currentY);
      currentY += 6;
    }

    // Email
    doc.text(`Email: ${company.email}`, companyInfoX, currentY);
    currentY += 6;

    // Website if available
    if (company.website) {
      doc.text(`Website: ${company.website}`, companyInfoX, currentY);
      currentY += 6;
    }

    // Tax ID if available
    if (company.taxId) {
      doc.text(`Tax ID: ${company.taxId}`, companyInfoX, currentY);
      currentY += 6;
    }

    // Add a separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, currentY + 5, pageWidth - 20, currentY + 5);
    currentY += 15;

    // Report Title and Details
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("PAYROLL REPORT", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${formatMonth(payroll.month)}`, pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 6;
    doc.text(`Description: ${payroll.description}`, pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 10;

    // Status and processed info
    doc.text(`Status: ${payroll.status}`, 20, currentY);
    doc.text(
      `Processed By: ${payroll.createdByName || "Unknown"}`,
      pageWidth - 20,
      currentY,
      { align: "right" }
    );
    currentY += 6;

    doc.text(
      `Processed Date: ${payroll.createdAt.toLocaleDateString()}`,
      20,
      currentY
    );
    doc.text(
      `Transaction Ref: ${payroll.transaction.reference}`,
      pageWidth - 20,
      currentY,
      { align: "right" }
    );

    console.log("✅ Header added successfully with company information");
  } catch (error) {
    console.error("❌ Error in addHeader:", error);
    // Don't throw the error - continue with PDF generation
    // Add basic header as fallback
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PAYROLL REPORT", 105, 30, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${formatMonth(payroll.month)}`, 105, 45, {
      align: "center",
    });
  }
}

function addPayrollSummary(doc: jsPDF, payroll: Payroll) {
  try {
    const startY = 120;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PAYROLL SUMMARY", 20, startY);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Summary boxes
    const boxWidth = 45;
    const boxHeight = 22;
    const spacing = 8;
    const startX = 20;
    const currentY = startY + 10;

    // Colors for summary boxes
    const colors = [
      [240, 248, 255], // Light blue
      [240, 255, 240], // Light green
      [255, 250, 240], // Light orange
      [255, 240, 245], // Light pink
    ];

    const summaries = [
      {
        label: "Employees",
        value: payroll.payments.length.toString(),
        color: colors[0],
      },
      {
        label: "Total Amount",
        value: formatCurrency(getDecimalValue(payroll.totalAmount)),
        color: colors[1],
      },
      {
        label: "Base Salaries",
        value: formatCurrency(getDecimalValue(payroll.baseAmount)),
        color: colors[2],
      },
      {
        label: "Overtime",
        value: formatCurrency(getDecimalValue(payroll.overtimeAmount)),
        color: colors[3],
      },
    ];

    summaries.forEach((summary, index) => {
      const xPos = startX + (boxWidth + spacing) * index;

      doc.setFillColor(summary.color[0], summary.color[1], summary.color[2]);
      doc.rect(xPos, currentY, boxWidth, boxHeight, "F");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(summary.label, xPos + 3, currentY + 8);

      doc.setFontSize(9);
      doc.text(summary.value, xPos + 3, currentY + 16);
    });

    console.log("✅ Payroll summary added successfully");
  } catch (error) {
    console.error("❌ Error in addPayrollSummary:", error);
    throw error;
  }
}

function addEmployeeTable(doc: jsPDF, payroll: Payroll) {
  try {
    const startY = 160;

    // Prepare table data
    console.log("📊 Preparing employee table data...");
    const tableData = payroll.payments.map((payment, index) => {
      // Safely handle decimal values
      const baseAmount = getDecimalValue(payment.baseAmount);
      const overtimeAmount = getDecimalValue(payment.overtimeAmount);
      const totalAmount = getDecimalValue(payment.amount);

      return [
        (index + 1).toString(),
        `${payment.employee.firstName} ${payment.employee.lastName}`,
        `#${payment.employee.employeeNumber}`,
        payment.employee.position,
        payment.employee.department?.name || "N/A",
        formatCurrency(baseAmount),
        formatCurrency(overtimeAmount),
        formatCurrency(totalAmount),
      ];
    });

    console.log("📊 Table data prepared, rows:", tableData.length);

    // Add employee table with autoTable
    autoTable(doc, {
      head: [
        [
          "#",
          "Employee Name",
          "Emp ID",
          "Position",
          "Department",
          "Base Salary",
          "Overtime",
          "Total Amount",
        ],
      ],
      body: tableData,
      startY: startY,
      styles: {
        fontSize: 7,
        font: "helvetica",
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        fontStyle: "bold",
        textColor: 255,
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 22 },
        7: { cellWidth: 25 },
      },
      margin: { top: startY },
      theme: "grid",
    });

    console.log("✅ Employee table added successfully");
  } catch (error) {
    console.error("❌ Error in addEmployeeTable:", error);
    throw error;
  }
}

function addFooter(doc: jsPDF, payroll: Payroll, company: GeneralSetting) {
  try {
    const pageCount = (doc as any).getNumberOfPages();
    console.log("📄 Adding footer to", pageCount, "pages");

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);

      // Company footer info
      const footerY = pageHeight - 20;

      // Left side - Company info
      doc.text(company.companyName, 20, footerY);
      if (company.taxId) {
        doc.text(`Tax ID: ${company.taxId}`, 20, footerY + 4);
      }
      doc.text(
        `Phone: ${company.phone} | Email: ${company.email}`,
        20,
        footerY + 8
      );

      // Right side - Report info
      const reportInfo = `Generated on ${new Date().toLocaleDateString()} | Ref: ${payroll.transaction.reference} | Page ${i} of ${pageCount}`;
      doc.text(reportInfo, pageWidth - 20, footerY + 8, { align: "right" });

      // Reset text color
      doc.setTextColor(0, 0, 0);
    }

    console.log("✅ Footer added successfully");
  } catch (error) {
    console.error("❌ Error in addFooter:", error);
    throw error;
  }
}

// Helper function to safely convert Decimal to number
function getDecimalValue(value: any): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toNumber" in value) {
    return value.toNumber();
  }
  if (typeof value === "string") {
    return parseFloat(value) || 0;
  }
  return 0;
}

// Helper functions
function formatMonth(month: string): string {
  try {
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  } catch (error) {
    console.error("❌ Error formatting month:", month, error);
    return month;
  }
}
