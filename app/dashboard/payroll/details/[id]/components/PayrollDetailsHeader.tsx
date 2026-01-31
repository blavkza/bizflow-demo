import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { Payroll } from "@/types/payroll";
import { Decimal } from "@prisma/client/runtime/library";
import { toast } from "sonner";
import { useState } from "react";
import {
  ProcessedPayroll,
  ProcessedPayment,
  ProcessedWorker,
  CompanyInfo,
} from "@/types/payroll-report";
import { PayrollReportGenerator } from "@/lib/generatePayrollReport";
import { useRouter } from "next/navigation";

interface PayrollDetailsHeaderProps {
  payroll: any; // Using any here to accommodate extended properties from Prisma
  company: CompanyInfo | null;
  formatMonth: (month: string) => string;
  onBack: () => void;
  getPaymentAmount: (amount: number | Decimal | undefined | null) => number;
}

export default function PayrollDetailsHeader({
  payroll,
  company,
  formatMonth,
  onBack,
  getPaymentAmount,
}: PayrollDetailsHeaderProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const router = useRouter();

  const handlePrintPayrollReport = async () => {
    if (!payroll) return;

    setIsGeneratingReport(true);
    try {
      // Process the payroll data to match our report generator format
      const processedPayments: ProcessedPayment[] = payroll.payments.map(
        (payment: any): ProcessedPayment => {
          const worker = payment.employee || payment.freeLancer;
          const isFreelancer = !!payment.freeLancerId;

          let displaySalary = 0;
          let salaryType = "MONTHLY";

          if (isFreelancer) {
            // For freelancers, use the salary field
            displaySalary = payment.freeLancer?.salary
              ? getPaymentAmount(payment.freeLancer.salary)
              : 0;
            salaryType = "DAILY";
          } else {
            // For employees, determine salary based on salaryType
            salaryType = payment.employee?.salaryType || "MONTHLY";
            if (salaryType === "DAILY") {
              displaySalary = payment.employee?.dailySalary
                ? getPaymentAmount(payment.employee.dailySalary)
                : 0;
            } else {
              displaySalary = payment.employee?.monthlySalary
                ? getPaymentAmount(payment.employee.monthlySalary)
                : 0;
            }
          }

          const processedWorker: ProcessedWorker | null = worker
            ? {
                id: worker.id,
                firstName: worker.firstName,
                lastName: worker.lastName,
                position: worker.position,
                department: worker.department,
                isFreelancer,
                workerNumber: isFreelancer
                  ? payment.freeLancer?.freeLancerNumber || "N/A"
                  : payment.employee?.employeeNumber || "N/A",
                salary: displaySalary,
                salaryType: salaryType,
              }
            : null;

          return {
            id: payment.id,
            amount: getPaymentAmount(payment.amount),
            baseAmount: getPaymentAmount(payment.baseAmount),
            overtimeAmount: getPaymentAmount(payment.overtimeAmount),
            overtimeHours: payment.overtimeHours
              ? Number(payment.overtimeHours)
              : 0,
            regularHours: payment.regularHours
              ? Number(payment.regularHours)
              : 0,
            daysWorked: payment.daysWorked || 0,
            employeeId: payment.employeeId,
            freeLancerId: payment.freeLancerId,
            payrollId: payment.payrollId,
            worker: processedWorker,
          };
        }
      );

      const processedPayroll: ProcessedPayroll = {
        id: payroll.id,
        month: payroll.month,
        description: payroll.description,
        status: payroll.status,
        createdBy: payroll.createdBy || "",
        createdAt: payroll.createdAt,
        updatedAt: payroll.updatedAt,
        transactionId: payroll.transactionId,
        createdByName: payroll.createdByName,
        notes: payroll.notes,
        payments: processedPayments,
        transaction: payroll.transaction || null,
      };

      const companyInfo: CompanyInfo | null = company
        ? {
            ...company,
            website: company.website || "",
            paymentTerms: company.paymentTerms || "",
            note: company.note || "",
            bankAccount: company.bankAccount || "",
            bankAccount2: company.bankAccount2 || "",
            bankName: company.bankName || "",
            bankName2: company.bankName2 || "",
            phone2: company.phone2 || "",
            phone3: company.phone3 || "",
          }
        : null;

      const payrollReportHTML =
        PayrollReportGenerator.generatePayrollReportHTML(
          processedPayroll,
          companyInfo
        );

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(payrollReportHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }

      toast.success("Payroll report generated successfully");
    } catch (error) {
      console.error("Error printing payroll report:", error);
      toast.error("Failed to generate payroll report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!window.confirm("Are you sure you want to discard this draft? This cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/payroll/${payroll.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to discard draft");
      }

      toast.success("Payroll draft discarded");
      router.push("/dashboard/payroll");
      router.refresh();
    } catch (error) {
      console.error("Error discarding draft:", error);
      toast.error("Failed to discard draft");
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
      <div className="flex items-center gap-2">
        {payroll.status === "DRAFT" && (
          <>
            <Button
              onClick={handleDiscardDraft}
              variant="destructive"
              className="flex items-center gap-2"
            >
              Discard Draft
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/payroll/edit/${payroll.id}`)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              Edit Draft
            </Button>
          </>
        )}
        <Button
          onClick={handlePrintPayrollReport}
          className="flex items-center gap-2"
          disabled={isGeneratingReport}
        >
          <Printer className="h-4 w-4" />
          {isGeneratingReport ? "Generating..." : "Print Report"}
        </Button>
      </div>
    </div>
  );
}
