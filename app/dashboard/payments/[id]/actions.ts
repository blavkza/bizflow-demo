import { toast } from "sonner";
import { PaymentDetail } from "./types";
import { PayslipGenerator } from "@/lib/payslip-generator";

// Dynamic imports for PDF generation
const loadPDFLibraries = async () => {
  const [jsPDFModule, html2canvasModule] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  return {
    jsPDF: jsPDFModule.default,
    html2canvas: html2canvasModule.default,
  };
};

export const handlePrintPayslip = async (
  payment: PaymentDetail,
  setPrinting: (value: boolean) => void
) => {
  setPrinting(true);
  try {
    const payslipHTML = PayslipGenerator.generatePayslipHTML(
      payment as any,
      payment.company
    );

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(payslipHTML);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load
      setTimeout(() => {
        printWindow.print();
        toast.success("Payslip sent to printer");
      }, 500);

      // Close after printing (optional)
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }
  } catch (error) {
    console.error("Error printing payslip:", error);
    toast.error("Failed to print payslip");
  } finally {
    setPrinting(false);
  }
};

export const handleDownloadPDF = async (
  payment: PaymentDetail,
  setDownloading: (value: boolean) => void
) => {
  setDownloading(true);
  try {
    const payslipHTML = PayslipGenerator.generatePayslipHTML(
      payment as any,
      payment.company
    );

    // Create a temporary element for PDF generation
    const element = document.createElement("div");
    element.innerHTML = payslipHTML;
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.width = "210mm"; // A4 width
    element.style.padding = "15mm";
    document.body.appendChild(element);

    // Load PDF libraries dynamically
    const { jsPDF, html2canvas } = await loadPDFLibraries();

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(
      canvas.toDataURL("image/jpeg", 1.0),
      "JPEG",
      0,
      0,
      imgWidth,
      imgHeight
    );

    // Save PDF
    pdf.save(`payslip-${payment.id.slice(-8)}.pdf`);

    toast.success("Payslip PDF downloaded successfully");

    // Clean up
    document.body.removeChild(element);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    toast.error("Failed to download PDF");

    // Fallback to printing
    toast.info("Falling back to print...");
    await handlePrintPayslip(payment, setPrinting);
  } finally {
    setDownloading(false);
  }
};

export const handleEmailPayslip = async (
  payment: PaymentDetail,
  setEmailing: (value: boolean) => void
) => {
  setEmailing(true);
  try {
    const email = prompt("Enter recipient email:", payment.worker?.email || "");
    if (!email) {
      setEmailing(false);
      return;
    }

    const payslipHTML = PayslipGenerator.generatePayslipHTML(
      payment as any,
      payment.company
    );

    // Send email via API
    const response = await fetch("/api/payroll/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment,
        email,
        html: payslipHTML,
        subject: `Payslip - ${payment.worker?.firstName} ${payment.worker?.lastName} - ${new Date(
          payment.payDate
        ).toLocaleDateString("en-ZA")}`,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send email");
    }

    toast.success(`Payslip emailed to ${email}`);
  } catch (error) {
    console.error("Error emailing payslip:", error);
    toast.error("Failed to email payslip");
  } finally {
    setEmailing(false);
  }
};

export const handleDownloadExcel = async (payment: PaymentDetail) => {
  try {
    // Create CSV content
    let csvContent = "Payslip Summary\r\n\r\n";

    // Add header
    csvContent += "Category,Description,Amount (R)\r\n\r\n";

    // Add earnings
    csvContent += "EARNINGS\r\n";
    csvContent += `Basic Salary,,${payment.baseAmount.toFixed(2)}\r\n`;
    if (payment.overtimeAmount > 0) {
      csvContent += `Overtime,,${payment.overtimeAmount.toFixed(2)}\r\n`;
    }
    payment.paymentBonuses.forEach((bonus) => {
      csvContent += `${bonus.bonusType},,${bonus.amount.toFixed(2)}\r\n`;
    });
    csvContent += `Total Earnings,,${payment.amount.toFixed(2)}\r\n\r\n`;

    // Add deductions
    csvContent += "DEDUCTIONS\r\n";
    payment.paymentDeductions.forEach((deduction) => {
      csvContent += `${deduction.deductionType},,${deduction.amount.toFixed(2)}\r\n`;
    });
    csvContent += `Total Deductions,,${payment.deductionAmount.toFixed(2)}\r\n\r\n`;

    // Add totals
    csvContent += "SUMMARY\r\n";
    csvContent += `Net Pay,,${payment.netAmount.toFixed(2)}\r\n`;
    csvContent += `Currency,${payment.currency}\r\n`;
    csvContent += `Status,${payment.status || "PAID"}\r\n`;

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `payslip-${payment.id.slice(-8)}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Excel file downloaded");
  } catch (error) {
    console.error("Error downloading Excel:", error);
    toast.error("Failed to download Excel file");
  }
};
