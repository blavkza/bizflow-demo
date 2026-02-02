
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
  type: "AMORTIZED" | "FLAT" = "AMORTIZED"
): LoanCalculationResult => {
  if (amount <= 0 || termMonths <= 0) {
    return { monthlyPayment: 0, totalPayable: 0, totalInterest: 0 };
  }

  if (type === "FLAT") {
    // Simple Interest / Flat Rate logic
    // Interest is calculated on the full principal for the entire term
    // Formula: Interest = Principal * (Rate/100) * (Months/12)
    // BUT common "short term" loans often quote a monthly rate or a flat fee. 
    // If the user enters "5%" for a 3 month loan, do they mean 5% per annum or 5% flat?
    // Standard interpretation in this app context (Input says "Interest Rate (%)") usually implies Annum for banks, 
    // but for short term/payday it might be per month.
    // Let's assume the user input is Annual Rate for consistency, but if it's "Short Term", 
    // we calculate simple interest.
    
    // Total Interest = P * (r/100) * (n/12)
    const totalInterest = amount * (interestRate / 100) * (termMonths / 12);
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
            balance: Math.max(0, remainingBalance)
        });
    }

    return {
      monthlyPayment,
      totalPayable,
      totalInterest,
      amortizationSchedule: schedule
    };
  } else {
    // Amortization (Reducing Balance)
    // Formula: PMT = P * (r * (1+r)^n) / ((1+r)^n - 1)
    // where r is monthly rate (annual / 12 / 100)
    
    const monthlyRate = interestRate / 100 / 12;
    
    if (monthlyRate === 0) {
        const monthlyPayment = amount / termMonths;
        return { monthlyPayment, totalPayable: amount, totalInterest: 0 };
    }

    const monthlyPayment =
      amount *
      (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
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
            balance: Math.max(0, remainingBalance)
        });
    }

    return {
      monthlyPayment,
      totalPayable,
      totalInterest,
      amortizationSchedule: schedule
    };
  }
};

export const getLoanTotals = (loans: any[]) => {
    return loans.reduce(
        (acc: any, loan: any) => {
            const principal = loan.amount;
            const paid = (loan.payments || []).reduce((p: number, c: any) => p + c.amount, 0);
            
            // Use stored persistent values if they exist, otherwise fallback to theoretical calc
            let finalTotalPayable = loan.totalPayable;
            let finalInterest = loan.interestAmount;

            if (finalTotalPayable === null || finalTotalPayable === undefined) {
                const method = (loan.loanType || "").toUpperCase().includes("SHORT") ? "FLAT" : "AMORTIZED";
                const term = loan.termMonths || 12;
                const rate = loan.interestRate || 0;
                const { totalPayable, totalInterest } = calculateLoan(principal, rate, term, method);
                
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
                monthly: acc.monthly + (loan.status === "ACTIVE" ? (loan.monthlyPayment || 0) : 0),
            };
        },
        { borrowed: 0, interest: 0, payable: 0, paid: 0, monthly: 0 }
    );
};
