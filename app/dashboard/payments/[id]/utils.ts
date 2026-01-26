import { PaymentDetail } from "./types";

export const formatType = (type: string): string => {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-ZA");
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
};

export const calculateTotalIncome = (payment: PaymentDetail): number => {
  return (
    payment.baseAmount +
    (payment.overtimeAmount || 0) +
    payment.paymentBonuses.reduce((sum, bonus) => sum + bonus.amount, 0)
  );
};

export const calculateTotalDeductions = (payment: PaymentDetail): number => {
  return payment.paymentDeductions.reduce(
    (sum, deduction) => sum + deduction.amount,
    0
  );
};
