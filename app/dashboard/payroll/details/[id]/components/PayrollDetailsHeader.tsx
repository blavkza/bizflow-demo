import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { Payroll } from "@/types/payroll";
import { Decimal } from "@prisma/client/runtime/library";
import { toast } from "sonner";
import { useState } from "react";
import { PayrollPDFGenerator } from "@/lib/pdf-generator";
import { formatCurrency } from "@/lib/formatters";
import { formatHours } from "../../../utils";

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

interface PayrollDetailsHeaderProps {
  payroll: Payroll;
  company: CompanySettings | null;
  formatMonth: (month: string) => string;
  onBack: () => void;
  payrollId: string;
  getPaymentAmount: (amount: number | Decimal | undefined | null) => number;
}

export default function PayrollDetailsHeader({
  payroll,
  company,
  formatMonth,
  onBack,
  payrollId,
  getPaymentAmount,
}: PayrollDetailsHeaderProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadReport = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfBlob = await PayrollPDFGenerator.generatePayrollReport(
        payroll,
        company,
        getPaymentAmount,
        formatCurrency,
        formatHours,
        formatMonth
      );

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-${payroll.month}-${payrollId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Payroll report downloaded successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Payroll Details</h1>
          <p className="text-muted-foreground">
            {formatMonth(payroll.month)} • {payroll.description}
          </p>
        </div>
      </div>
      <Button
        onClick={handleDownloadReport}
        className="flex items-center gap-2"
        disabled={isGeneratingPdf}
      >
        <Download className="h-4 w-4" />
        {isGeneratingPdf ? "Generating PDF..." : "Download Report"}
      </Button>
    </div>
  );
}
