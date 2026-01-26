import React from "react";
import { Separator } from "@/components/ui/separator";
import { PaymentDetail } from "../types";

interface DeductionsSectionProps {
  payment: PaymentDetail;
  totalDeductions: number;
  formatCurrency: (amount: number) => string;
}

const DeductionsSection: React.FC<DeductionsSectionProps> = ({
  payment,
  totalDeductions,
  formatCurrency,
}) => {
  const formatType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const statutoryDeductions = payment.paymentDeductions.filter(
    (d) =>
      d.deductionType === "UIF" ||
      d.deductionType === "TAX" ||
      d.deductionType === "PENSION"
  );

  const otherDeductions = payment.paymentDeductions.filter(
    (d) =>
      d.deductionType !== "UIF" &&
      d.deductionType !== "TAX" &&
      d.deductionType !== "PENSION"
  );

  return (
    <div>
      <h3 className="font-bold text-lg mb-4">Deductions</h3>
      <div className="space-y-3">
        {/* Statutory Deductions */}
        {statutoryDeductions.map((deduction) => (
          <div key={deduction.id} className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <p className="font-medium">
                {formatType(deduction.deductionType)}
              </p>
              {deduction.description && (
                <p className="text-sm text-muted-foreground">
                  {deduction.description}
                </p>
              )}
            </div>
            <div className="text-right font-medium text-red-600">
              -{formatCurrency(deduction.amount)}
            </div>
          </div>
        ))}

        {/* Other Deductions */}
        {otherDeductions.map((deduction) => (
          <div key={deduction.id} className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <p className="font-medium">
                {formatType(deduction.deductionType)}
              </p>
              {deduction.description && (
                <p className="text-sm text-muted-foreground">
                  {deduction.description}
                </p>
              )}
            </div>
            <div className="text-right font-medium text-red-600">
              -{formatCurrency(deduction.amount)}
            </div>
          </div>
        ))}

        <Separator className="my-2" />

        <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
          <div className="col-span-2">
            <p className="font-bold">Total Deductions</p>
          </div>
          <div className="text-right font-bold text-red-600">
            -{formatCurrency(totalDeductions)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeductionsSection;
