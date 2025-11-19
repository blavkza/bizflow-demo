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

// Define a more specific interface for the employee with salary fields
interface EmployeeWithSalary {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  salaryType: string;
  dailySalary: number | Decimal | null;
  monthlySalary: number | Decimal | null;
  department: { name: string; id: string } | null;
}

interface PaymentWithWorker {
  id: string;
  amount: number | Decimal | null;
  baseAmount: number | Decimal | null;
  overtimeAmount: number | Decimal | null;
  overtimeHours: number | Decimal | null;
  regularHours: number | Decimal | null;
  daysWorked: number | null;
  employeeId: string | null;
  freeLancerId: string | null;
  payrollId: string;
  employee?: EmployeeWithSalary;
  freeLancer?: {
    id: string;
    freeLancerNumber: string;
    firstName: string;
    lastName: string;
    position: string;
    salary: number | Decimal | null;
    department: { name: string; id: string } | null;
  };
}

interface ExtendedPayroll extends Payroll {
  payments: PaymentWithWorker[];
  createdByName: string;
  notes?: string;
  transaction?: {
    id: string;
    reference: string;
    date: Date;
    description: string;
    amount: number | Decimal;
    currency: string;
  };
}

interface PayrollDetailsHeaderProps {
  payroll: ExtendedPayroll;
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

  const handlePrintPayrollReport = async () => {
    if (!payroll) return;

    setIsGeneratingReport(true);
    try {
      // Process the payroll data to match our report generator format
      const processedPayments: ProcessedPayment[] = payroll.payments.map(
        (payment): ProcessedPayment => {
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

      // Convert CompanySettings to CompanyInfo by providing defaults for required fields
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

      // Generate HTML report directly
      const payrollReportHTML =
        PayrollReportGenerator.generatePayrollReportHTML(
          processedPayroll,
          companyInfo
        );

      // Open in new window for printing
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
        onClick={handlePrintPayrollReport}
        className="flex items-center gap-2"
        disabled={isGeneratingReport}
      >
        <Printer className="h-4 w-4" />
        {isGeneratingReport ? "Generating Report..." : "Print Report"}
      </Button>
    </div>
  );
}
