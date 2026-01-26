"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import LoadingState from "./components/LoadingState";
import ErrorState from "./components/ErrorState";
import { usePaymentDetails } from "@/hooks/usePaymentDetails";
import { PaymentDetail } from "./types";
import {
  handlePrintPayslip,
  handleDownloadPDF,
  handleEmailPayslip,
  handleDownloadExcel,
} from "./actions";
import PayslipHeader from "./components/PayslipHeader";
import QuickStats from "./components/QuickStats";
import CompanyDetails from "./components/CompanyDetails";
import EmployeeDetails from "./components/EmployeeDetails";
import IncomeSection from "./components/IncomeSection";
import DeductionsSection from "./components/DeductionsSection";
import NetPaySection from "./components/NetPaySection";
import WorkSummary from "./components/WorkSummary";

interface PaymentDetailPageProps {
  paymentId?: string;
}

export default function PaymentDetailPage({
  paymentId,
}: PaymentDetailPageProps) {
  const { payment, loading } = usePaymentDetails(paymentId);
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA");
  };

  const handleAction = async (
    action: "print" | "download" | "email" | "excel",
    payment: PaymentDetail
  ) => {
    switch (action) {
      case "print":
        await handlePrintPayslip(payment, setPrinting);
        break;
      case "download":
        await handleDownloadPDF(payment, setDownloading);
        break;
      case "email":
        await handleEmailPayslip(payment, setEmailing);
        break;
      case "excel":
        await handleDownloadExcel(payment);
        break;
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!payment) {
    return <ErrorState />;
  }

  const totalIncome = calculateTotalIncome(payment);
  const totalDeductions = calculateTotalDeductions(payment);

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <PayslipHeader
        payment={payment}
        onPrint={() => handleAction("print", payment)}
        onDownload={() => handleAction("download", payment)}
        onEmail={() => handleAction("email", payment)}
        onExcel={() => handleAction("excel", payment)}
        printing={printing}
        downloading={downloading}
        emailing={emailing}
      />

      {/* Quick Stats */}
      <QuickStats
        grossSalary={payment.amount}
        totalDeductions={totalDeductions}
        netPay={payment.netAmount}
        payDate={payment.payDate}
        formatCurrency={formatCurrency}
        formatDateShort={formatDateShort}
      />

      {/* Main Payslip Card */}
      <Card className="border-2 shadow-lg">
        <div className="p-6">
          {/* Payslip Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">PAYSLIP</h2>
            <div className="h-1 bg-primary w-24 mx-auto mb-6"></div>
          </div>

          {/* Company Details */}
          <CompanyDetails company={payment.company} />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Employee Details */}
            <EmployeeDetails worker={payment.worker} payment={payment} />

            {/* Right Column - Additional Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">I.D. Number:</h3>
                <p className="text-lg">
                  {payment.worker?.idNumber || "9507135493083"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Job Title:</h3>
                <p className="text-lg">
                  {payment.worker?.position || "Site Manager/Technician"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Tax Number:</h3>
                <p className="text-lg">
                  {payment.worker?.taxNumber || "1267131199"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Pay Date:</h3>
                <p className="text-lg">
                  {new Date(payment.payDate).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Rate per hour:</h3>
                <p className="text-lg">
                  {payment.worker?.ratePerHour
                    ? formatCurrency(payment.worker.ratePerHour)
                    : "R20.35"}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Income & Deductions Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Income */}
            <IncomeSection
              payment={payment}
              totalIncome={totalIncome}
              formatCurrency={formatCurrency}
            />

            {/* Right Column - Deductions */}
            <DeductionsSection
              payment={payment}
              totalDeductions={totalDeductions}
              formatCurrency={formatCurrency}
            />
          </div>

          {/* Net Pay Section */}
          <NetPaySection
            netAmount={payment.netAmount}
            payDate={payment.payDate}
            formatCurrency={formatCurrency}
            formatDateShort={formatDateShort}
          />

          {/* Work Details */}
          <WorkSummary
            daysWorked={payment.daysWorked}
            regularHours={payment.regularHours}
            overtimeHours={payment.overtimeHours}
          />
        </div>
      </Card>
    </div>
  );
}

// Helper functions
function calculateTotalIncome(payment: PaymentDetail): number {
  return (
    payment.baseAmount +
    (payment.overtimeAmount || 0) +
    payment.paymentBonuses.reduce((sum, bonus) => sum + bonus.amount, 0)
  );
}

function calculateTotalDeductions(payment: PaymentDetail): number {
  return payment.paymentDeductions.reduce(
    (sum, deduction) => sum + deduction.amount,
    0
  );
}
