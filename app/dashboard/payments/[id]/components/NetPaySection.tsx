import React from "react";

interface NetPaySectionProps {
  netAmount: number;
  payDate: string;
  formatCurrency: (amount: number) => string;
  formatDateShort: (dateString: string) => string;
}

const NetPaySection: React.FC<NetPaySectionProps> = ({
  netAmount,
  payDate,
  formatCurrency,
  formatDateShort,
}) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2">
          <p className="font-bold text-lg">NETT PAY</p>
          <p className="text-sm text-muted-foreground">
            Amount to be transferred to employee's account
          </p>
        </div>
        <div className="text-center md:text-right">
          <p className="font-bold text-3xl text-green-700">
            {formatCurrency(netAmount)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Payment due: {formatDateShort(payDate)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NetPaySection;
