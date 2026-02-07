/**
 * LOAN CALCULATION EXAMPLES
 *
 * This file demonstrates the two types of loan calculations available:
 * 1. COMPOUND_INTEREST - Monthly compound interest (reducing balance)
 * 2. FIXED_INTEREST - Long-term fixed interest (flat rate)
 */

import { calculateLoan } from "./loan-calc";

console.log("=".repeat(80));
console.log("LOAN CALCULATION EXAMPLES");
console.log("=".repeat(80));

// Example 1: FIXED_INTEREST (Long-term Fixed Interest Loan)
// This matches your WhatsApp example exactly
console.log("\n📊 Example 1: FIXED_INTEREST (Long-term Fixed Interest Loan)");
console.log("-".repeat(80));

const fixedLoanAmount = 250000;
const fixedInterestRate = 50; // 50% total interest
const fixedTermMonths = 10;

const fixedResult = calculateLoan(
  fixedLoanAmount,
  fixedInterestRate,
  fixedTermMonths,
  "FIXED_INTEREST",
);

console.log(`Loan Amount: R${fixedLoanAmount.toLocaleString()}`);
console.log(`Interest Rate: ${fixedInterestRate}%`);
console.log(`Period: ${fixedTermMonths} Months`);
console.log(
  `Interest Amount/Profit: R${fixedResult.totalInterest.toLocaleString()}`,
);
console.log(
  `Installment Amount per Month: R${fixedResult.monthlyPayment.toLocaleString()}`,
);
console.log(
  `Total (Loan Capital + Interest): R${fixedResult.totalPayable.toLocaleString()}`,
);

console.log("\n📅 Payment Schedule:");
fixedResult.amortizationSchedule?.forEach((payment, index) => {
  console.log(
    `${index + 1}. Month ${payment.month}: R${payment.payment.toFixed(2)} ` +
      `(Principal: R${payment.principal.toFixed(2)}, Interest: R${payment.interest.toFixed(2)}, ` +
      `Balance: R${payment.balance.toFixed(2)})`,
  );
});

// Example 2: COMPOUND_INTEREST (Monthly Compound Interest)
console.log(
  "\n\n📊 Example 2: COMPOUND_INTEREST (Monthly Compound Interest - Reducing Balance)",
);
console.log("-".repeat(80));

const compoundLoanAmount = 250000;
const compoundInterestRate = 12; // 12% annual rate (1% per month)
const compoundTermMonths = 10;

const compoundResult = calculateLoan(
  compoundLoanAmount,
  compoundInterestRate,
  compoundTermMonths,
  "COMPOUND_INTEREST",
);

console.log(`Loan Amount: R${compoundLoanAmount.toLocaleString()}`);
console.log(
  `Interest Rate: ${compoundInterestRate}% per annum (${(compoundInterestRate / 12).toFixed(2)}% per month)`,
);
console.log(`Period: ${compoundTermMonths} Months`);
console.log(
  `Total Interest: R${compoundResult.totalInterest.toLocaleString()}`,
);
console.log(
  `Monthly Payment: R${compoundResult.monthlyPayment.toLocaleString()}`,
);
console.log(`Total Payable: R${compoundResult.totalPayable.toLocaleString()}`);

console.log(
  "\n📅 Payment Schedule (Interest calculated on remaining balance):",
);
compoundResult.amortizationSchedule?.forEach((payment, index) => {
  console.log(
    `${index + 1}. Month ${payment.month}: R${payment.payment.toFixed(2)} ` +
      `(Principal: R${payment.principal.toFixed(2)}, Interest: R${payment.interest.toFixed(2)}, ` +
      `Balance: R${payment.balance.toFixed(2)})`,
  );
});

console.log("\n" + "=".repeat(80));
console.log("KEY DIFFERENCES:");
console.log("=".repeat(80));
console.log(`
1. FIXED_INTEREST:
   - Total interest calculated upfront: Principal × Rate
   - Same payment every month
   - Interest portion stays the same each month
   - Example: R250,000 × 50% = R125,000 total interest
   - R375,000 ÷ 10 months = R37,500 per month

2. COMPOUND_INTEREST:
   - Interest calculated monthly on remaining balance
   - Payment stays the same, but interest/principal split changes
   - More interest paid early, more principal paid later
   - Lower total interest than fixed rate for same percentage
   - Standard banking/amortization method
`);

console.log("=".repeat(80));
