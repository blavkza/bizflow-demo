"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PayrollStatus } from "@prisma/client";
import { Payroll } from "@/types/payroll";
import { Decimal } from "@prisma/client/runtime/library";
import Loading from "../../_components/loading";
import { formatCurrency, formatHours } from "../../utils";
import PayrollDetailsHeader from "./components/PayrollDetailsHeader";
import SummaryCards from "./components/SummaryCards";
import PayrollInformation from "./components/PayrollInformation";
import EmployeeBreakdown from "./components/EmployeeBreakdown";
import TransactionDetails from "./components/TransactionDetails";

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

export default function PayrollDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const payrollId = params.id as string;

  useEffect(() => {
    const fetchPayrollDetails = async () => {
      try {
        const response = await fetch(`/api/payroll/${payrollId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch payroll details");
        }
        const data = await response.json();
        setPayroll(data);

        // Fetch company settings
        const companyResponse = await fetch("/api/settings/general");
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          setCompany(companyData.data || companyData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollDetails();
  }, [payrollId]);

  const getStatusVariant = (status: PayrollStatus) => {
    switch (status) {
      case PayrollStatus.PROCESSED:
        return "default";
      case PayrollStatus.PAID:
        return "secondary";
      case PayrollStatus.DRAFT:
        return "outline";
      case PayrollStatus.CANCELLED:
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatMonth = (month: string) => {
    if (!month) return "";
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  // Helper function to safely convert amount to number
  const getPaymentAmount = (
    amount: number | Decimal | undefined | null
  ): number => {
    if (amount === undefined || amount === null) return 0;
    if (typeof amount === "number") return amount;
    if (amount && typeof amount === "object" && "toNumber" in amount) {
      return amount.toNumber();
    }
    // Fallback string conversion
    return Number(amount) || 0;
  };

  if (loading) return <Loading />;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!payroll) return <div className="p-6">Payroll not found</div>;

  // Calculate totals from individual payments safely
  const totalBaseAmount = payroll.payments.reduce((sum, payment) => {
    return sum + getPaymentAmount(payment.baseAmount);
  }, 0);

  const totalOvertimeAmount = payroll.payments.reduce((sum, payment) => {
    return sum + getPaymentAmount(payment.overtimeAmount);
  }, 0);

  const totalAmount = payroll.payments.reduce((sum, payment) => {
    return sum + getPaymentAmount(payment.amount);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <PayrollDetailsHeader
        payroll={payroll as any}
        company={company as any}
        formatMonth={formatMonth}
        onBack={() => router.back()}
        getPaymentAmount={getPaymentAmount}
      />

      <SummaryCards
        payroll={payroll}
        formatMonth={formatMonth}
        getStatusVariant={getStatusVariant}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PayrollInformation
          payroll={payroll}
          getStatusVariant={getStatusVariant}
          totalBaseAmount={totalBaseAmount}
          totalOvertimeAmount={totalOvertimeAmount}
          totalAmount={totalAmount}
        />

        <EmployeeBreakdown
          payroll={payroll}
          getPaymentAmount={getPaymentAmount}
          formatCurrency={formatCurrency}
          formatHours={formatHours}
        />
      </div>

      <TransactionDetails payroll={payroll} formatCurrency={formatCurrency} />
    </div>
  );
}
