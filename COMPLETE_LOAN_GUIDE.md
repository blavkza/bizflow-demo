# Loan Calculation Methods - Complete Guide

## 📋 Overview

Your system supports **TWO** main loan types:

1. **COMPOUND_INTEREST** - Monthly compound interest (flexible or fixed payments)
2. **FIXED_INTEREST** - Long-term fixed interest (flat rate)

---

## 🔄 Type 1: Monthly Compound Interest (COMPOUND_INTEREST)

### **Core Principle**

Interest is calculated **every month** on the **remaining balance** after the previous payment.

### **Two Sub-Types:**

#### **A) Flexible Payments** (Recommended for most business loans)

- Customer can pay **any amount** each month
- Interest calculated on current balance
- No fixed monthly payment
- Can pay off early without penalty
- **Use Case**: Business loans, lines of credit

**Example:**

```
Month 1: Balance R100,000 → Interest R1,000 → Pay R20,000 → New Balance R81,000
Month 2: Balance R81,000 → Interest R810 → Pay R15,000 → New Balance R66,190
Month 3: Balance R66,190 → Interest R662 → Pay R30,000 → New Balance R36,852
... (continues until paid off)
```

#### **B) Fixed Amortized Payments** (Traditional bank loans)

- Same payment amount every month
- Interest calculated on current balance
- Payment split changes each month (more principal, less interest over time)
- **Use Case**: Mortgages, car loans, personal loans

**Example:**

```
Month 1: Balance R100,000 → Interest R1,000 → Pay R17,255 → Principal R16,255
Month 2: Balance R83,745 → Interest R837 → Pay R17,255 → Principal R16,418
Month 3: Balance R67,327 → Interest R673 → Pay R17,255 → Principal R16,582
... (continues for agreed term)
```

---

## 💰 Type 2: Long-term Fixed Interest (FIXED_INTEREST)

### **Core Principle**

Total interest calculated **upfront** on full principal, then split evenly across all months.

### **Characteristics:**

- Interest = Principal × Rate (calculated once at start)
- Same payment every month
- Same interest portion every month
- Same principal portion every month
- **Use Case**: Simple business loans, short-term financing

**Example:**

```
Loan: R250,000 @ 50% for 10 months

Upfront Calculation:
- Total Interest = R250,000 × 50% = R125,000
- Total Payable = R375,000
- Monthly Payment = R375,000 ÷ 10 = R37,500

Every Month (1-10):
- Payment: R37,500
- Interest: R12,500 (always the same)
- Principal: R25,000 (always the same)
```

---

## 📊 Comparison Table

| Feature                  | Compound (Flexible)      | Compound (Fixed)       | Fixed Interest                          |
| ------------------------ | ------------------------ | ---------------------- | --------------------------------------- |
| **Payment Amount**       | Varies (customer choice) | Same every month       | Same every month                        |
| **Interest Calculation** | On remaining balance     | On remaining balance   | Upfront on full amount                  |
| **Interest per Month**   | Decreases if paying down | Decreases over time    | Always the same                         |
| **Principal per Month**  | Varies with payment      | Increases over time    | Always the same                         |
| **Can Pay Off Early?**   | ✅ Yes, anytime          | ✅ Yes, saves interest | ✅ Yes, but interest already calculated |
| **Total Interest**       | Depends on payments      | Lower (for same rate)  | Higher (for same rate)                  |
| **Best For**             | Business loans           | Bank loans             | Simple loans                            |

---

## 🎯 When to Use Each Type

### Use **COMPOUND_INTEREST (Flexible)** when:

- ✅ Customer has variable income
- ✅ Want flexibility in payment amounts
- ✅ Business loans with seasonal cash flow
- ✅ Want to pay off faster when possible
- ✅ Fair interest calculation (only on what's owed)

### Use **COMPOUND_INTEREST (Fixed Amortized)** when:

- ✅ Traditional bank loan structure
- ✅ Customer wants predictable payments
- ✅ Long-term financing (mortgages, car loans)
- ✅ Standard banking practices

### Use **FIXED_INTEREST** when:

- ✅ Simple, easy-to-understand loan
- ✅ Short-term business financing
- ✅ Lender quotes "total interest" amount
- ✅ Want same interest every month
- ✅ Matches your example: R250k @ 50% = R125k interest

---

## 💻 Implementation in Your System

### For COMPOUND_INTEREST (Flexible Payments)

When recording a payment:

```typescript
import { calculatePaymentBreakdown } from "@/lib/loan-calc";

// Get current loan balance
const currentBalance = 50000;
const annualRate = 12;
const paymentAmount = 10000; // Customer decides this

// Calculate breakdown
const breakdown = calculatePaymentBreakdown(
  currentBalance,
  paymentAmount,
  annualRate,
);

console.log(breakdown);
// {
//   interestCharged: 500,      // Interest on R50,000
//   principalPaid: 9500,       // Rest goes to principal
//   newBalance: 40500          // New balance after payment
// }

// Save payment record with this breakdown
// Update loan balance to 40500
```

### For COMPOUND_INTEREST (Fixed Amortized)

When creating the loan:

```typescript
import { calculateLoan } from "@/lib/loan-calc";

const result = calculateLoan(
  100000, // Principal
  12, // Annual rate
  12, // Term in months
  "COMPOUND_INTEREST", // Type
);

console.log(result.monthlyPayment); // R8,884.88
console.log(result.totalInterest); // R6,618.56
console.log(result.amortizationSchedule); // Full schedule
```

### For FIXED_INTEREST

When creating the loan:

```typescript
import { calculateLoan } from "@/lib/loan-calc";

const result = calculateLoan(
  250000, // Principal
  50, // Interest rate (50%)
  10, // Term in months
  "FIXED_INTEREST", // Type
);

console.log(result.monthlyPayment); // R37,500
console.log(result.totalInterest); // R125,000
console.log(result.totalPayable); // R375,000
```

---

## 📝 Summary

### **COMPOUND_INTEREST** = Interest on Remaining Balance

- **Flexible**: Pay any amount, interest on what you owe
- **Fixed**: Same payment, interest on what you owe

### **FIXED_INTEREST** = Interest on Full Principal

- Total interest calculated upfront
- Split evenly across all months
- Simple and predictable

---

## ✅ Your System Now Supports All Three!

1. **Flexible Compound Interest** - Use `calculatePaymentBreakdown()` for each payment
2. **Fixed Compound Interest** - Use `calculateLoan()` with `COMPOUND_INTEREST`
3. **Fixed Interest** - Use `calculateLoan()` with `FIXED_INTEREST`

Choose the right one based on your customer's needs and loan structure! 🎉
