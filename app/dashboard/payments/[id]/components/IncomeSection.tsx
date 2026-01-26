import React from "react";
import { Separator } from "@/components/ui/separator";
import { PaymentDetail } from "../types";

interface IncomeSectionProps {
  payment: PaymentDetail;
  totalIncome: number;
  formatCurrency: (amount: number) => string;
}

const IncomeSection: React.FC<IncomeSectionProps> = ({
  payment,
  totalIncome,
  formatCurrency,
}) => {
  const formatType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div>
      <h3 className="font-bold text-lg mb-4">Income</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <p className="font-medium">Basic Salary</p>
            <p className="text-sm text-muted-foreground">
              {payment.daysWorked} days worked
            </p>
          </div>
          <div className="text-right font-medium">
            {formatCurrency(payment.baseAmount)}
          </div>
        </div>

        {payment.overtimeAmount > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <p className="font-medium">Overtime</p>
              <p className="text-sm text-muted-foreground">
                {payment.overtimeHours?.toFixed(2)} hours
              </p>
            </div>
            <div className="text-right font-medium text-orange-600">
              +{formatCurrency(payment.overtimeAmount)}
            </div>
          </div>
        )}

        {/* Bonuses */}
        {payment.paymentBonuses.map((bonus) => (
          <div key={bonus.id} className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <p className="font-medium">{formatType(bonus.bonusType)}</p>
              {bonus.description && (
                <p className="text-sm text-muted-foreground">
                  {bonus.description}
                </p>
              )}
            </div>
            <div className="text-right font-medium text-green-600">
              +{formatCurrency(bonus.amount)}
            </div>
          </div>
        ))}

        <Separator className="my-2" />

        <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
          <div className="col-span-2">
            <p className="font-bold">Total Income</p>
          </div>
          <div className="text-right font-bold">
            {formatCurrency(totalIncome)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeSection;
