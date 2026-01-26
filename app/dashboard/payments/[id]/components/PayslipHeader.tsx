import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PaymentDetail } from "../types";
import ActionButtons from "./ActionButtons";
import { useRouter } from "next/navigation";

interface PayslipHeaderProps {
  payment: PaymentDetail;
  onPrint: () => void;
  onDownload: () => void;
  onEmail: () => void;
  onExcel: () => void;
  printing: boolean;
  downloading: boolean;
  emailing: boolean;
}

const PayslipHeader: React.FC<PayslipHeaderProps> = ({
  payment,
  onPrint,
  onDownload,
  onEmail,
  onExcel,
  printing,
  downloading,
  emailing,
}) => {
  const router = useRouter();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payslips
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Payslip Details</h1>
        <p className="text-muted-foreground">
          {payment.worker?.firstName} {payment.worker?.lastName} •{" "}
          {formatDate(payment.payDate)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              payment.status === "PAID"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {payment.status || "PAID"}
          </span>
        </div>
      </div>
      <ActionButtons
        onPrint={onPrint}
        onDownload={onDownload}
        onEmail={onEmail}
        onExcel={onExcel}
        printing={printing}
        downloading={downloading}
        emailing={emailing}
      />
    </div>
  );
};

export default PayslipHeader;
