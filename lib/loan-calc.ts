export type LoanCalculationResult = {
  monthlyPayment: number;
  totalPayable: number;
  totalInterest: number;
  amortizationSchedule?: {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
};

export const calculateLoan = (
  amount: number,
  interestRate: number, // Annual rate in percent
  termMonths: number,
  type: "COMPOUND_INTEREST" | "FIXED_INTEREST" = "COMPOUND_INTEREST",
): LoanCalculationResult => {
  if (amount <= 0 || termMonths <= 0) {
    return { monthlyPayment: 0, totalPayable: 0, totalInterest: 0 };
  }

  if (type === "FIXED_INTEREST") {
    // Long-term Fixed Interest Loan
    // Total interest is calculated upfront as: Principal * (Rate/100)
    // Then split evenly across all months
    // Example: R250,000 * 50% = R125,000 interest
    // Total = R375,000 / 10 months = R37,500 per month

    const totalInterest = amount * (interestRate / 100);
    const totalPayable = amount + totalInterest;
    const monthlyPayment = totalPayable / termMonths;

    const schedule = [];
    const monthlyPrincipal = amount / termMonths;
    const monthlyInterest = totalInterest / termMonths;
    let remainingBalance = amount;

    for (let i = 1; i <= termMonths; i++) {
      remainingBalance -= monthlyPrincipal;
      schedule.push({
        month: i,
        payment: monthlyPayment,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        balance: Math.max(0, remainingBalance),
      });
    }

    return {
      monthlyPayment,
      totalPayable,
      totalInterest,
      amortizationSchedule: schedule,
    };
  } else {
    // Monthly Compound Interest (Reducing Balance / Amortized)
    // User Requirement: Input Rate is MONTHLY Rate (percentage)
    // Formula: PMT = P * (r * (1+r)^n) / ((1+r)^n - 1)

    const monthlyRate = interestRate / 100;

    if (monthlyRate === 0) {
      const monthlyPayment = amount / termMonths;
      return { monthlyPayment, totalPayable: amount, totalInterest: 0 };
    }

    const monthlyPayment =
      (amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    const totalPayable = monthlyPayment * termMonths;
    const totalInterest = totalPayable - amount;

    const schedule = [];
    let remainingBalance = amount;
    for (let i = 1; i <= termMonths; i++) {
      const interestM = remainingBalance * monthlyRate;
      const principalM = monthlyPayment - interestM;
      remainingBalance -= principalM;
      schedule.push({
        month: i,
        payment: monthlyPayment,
        principal: principalM,
        interest: interestM,
        balance: Math.max(0, remainingBalance),
      });
    }

    return {
      monthlyPayment,
      totalPayable,
      totalInterest,
      amortizationSchedule: schedule,
    };
  }
};

/**
 * Calculate interest on current balance for flexible payment loans
 * For COMPOUND_INTEREST loans where payment amounts vary
 *
 * @param currentBalance - The current outstanding balance
 * @param interestRate - Monthly interest rate as a percentage (e.g., 30 for 30%)
 * @returns The interest amount for this month
 */
export const calculateMonthlyInterest = (
  currentBalance: number,
  interestRate: number,
): number => {
  const monthlyRate = interestRate / 100;
  return currentBalance * monthlyRate;
};

/**
 * Calculate the new balance after a payment for compound interest loans
 *
 * @param currentBalance - Current outstanding balance
 * @param paymentAmount - Amount being paid
 * @param annualInterestRate - Annual interest rate as a percentage
 * @returns Object with interest charged, principal paid, and new balance
 */
export const calculatePaymentBreakdown = (
  currentBalance: number,
  paymentAmount: number,
  annualInterestRate: number,
): {
  interestCharged: number;
  principalPaid: number;
  newBalance: number;
} => {
  // First, calculate interest on current balance
  const interestCharged = calculateMonthlyInterest(
    currentBalance,
    annualInterestRate,
  );

  // Principal is whatever is left after paying interest
  const principalPaid = Math.max(0, paymentAmount - interestCharged);

  // New balance is current balance minus principal paid
  const newBalance = Math.max(0, currentBalance - principalPaid);

  return {
    interestCharged,
    principalPaid,
    newBalance,
  };
};

export const getLoanTotals = (loans: any[]) => {
  return loans.reduce(
    (acc: any, loan: any) => {
      const principal = loan.amount;
      const paid = (loan.payments || []).reduce(
        (p: number, c: any) => p + c.amount,
        0,
      );

      // Use stored persistent values if they exist, otherwise fallback to theoretical calc
      let finalTotalPayable = loan.totalPayable;
      let finalInterest = loan.interestAmount;

      if (finalTotalPayable === null || finalTotalPayable === undefined) {
        const method = loan.calculationMethod || "COMPOUND_INTEREST";
        const term = loan.termMonths || 12;
        const rate = loan.interestRate || 0;
        const { totalPayable, totalInterest } = calculateLoan(
          principal,
          rate,
          term,
          method,
        );

        finalTotalPayable = totalPayable;
        if (loan.monthlyPayment && loan.termMonths) {
          finalTotalPayable = loan.monthlyPayment * loan.termMonths;
        }
        finalInterest = finalTotalPayable - principal;
      }

      return {
        borrowed: acc.borrowed + principal,
        interest: acc.interest + (finalInterest || 0),
        payable: acc.payable + (finalTotalPayable || 0),
        paid: acc.paid + paid,
        monthly:
          acc.monthly +
          (loan.status === "ACTIVE" ? loan.monthlyPayment || 0 : 0),
      };
    },
    { borrowed: 0, interest: 0, payable: 0, paid: 0, monthly: 0 },
  );
};
