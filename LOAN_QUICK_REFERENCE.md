# 🎯 Quick Reference: Loan Calculations

## 📌 The Two Main Types

### 1️⃣ COMPOUND_INTEREST

**Interest calculated on REMAINING BALANCE each month**

**Formula**: `Interest = Current Balance × (Annual Rate ÷ 12 ÷ 100)`

**Example**:

- Balance: R50,000
- Rate: 12% annual (1% monthly)
- Interest this month: R50,000 × 1% = **R500**
- After R10,000 payment: New balance = **R40,500**
- Next month interest: R40,500 × 1% = **R405** ⬅️ Lower!

---

### 2️⃣ FIXED_INTEREST

**Interest calculated UPFRONT on FULL PRINCIPAL**

**Formula**: `Total Interest = Principal × (Rate ÷ 100)`

**Example**:

- Principal: R250,000
- Rate: 50%
- Total Interest: R250,000 × 50% = **R125,000**
- Monthly Interest: R125,000 ÷ 10 = **R12,500** (same every month)

---

## 🔧 Helper Functions

### Calculate Monthly Interest

```typescript
import { calculateMonthlyInterest } from "@/lib/loan-calc";

const interest = calculateMonthlyInterest(50000, 12);
// Returns: 500 (R50,000 × 1%)
```

### Calculate Payment Breakdown

```typescript
import { calculatePaymentBreakdown } from "@/lib/loan-calc";

const breakdown = calculatePaymentBreakdown(50000, 10000, 12);
// Returns: {
//   interestCharged: 500,
//   principalPaid: 9500,
//   newBalance: 40500
// }
```

### Calculate Full Loan Schedule

```typescript
import { calculateLoan } from "@/lib/loan-calc";

// For Compound Interest
const compound = calculateLoan(100000, 12, 12, "COMPOUND_INTEREST");

// For Fixed Interest
const fixed = calculateLoan(250000, 50, 10, "FIXED_INTEREST");
```

---

## ⚡ Quick Decision Guide

**Choose COMPOUND_INTEREST when:**

- ✅ Customer can pay variable amounts
- ✅ Want fair interest (only on what's owed)
- ✅ Business loan with flexible payments
- ✅ Want to reward early payments

**Choose FIXED_INTEREST when:**

- ✅ Want simple, predictable calculations
- ✅ Total interest known upfront
- ✅ Short-term business loan
- ✅ Matches example: R250k @ 50% = R125k interest

---

## 📊 Side-by-Side Example

**Loan: R100,000 @ 12% for 6 months**

| Month     | Compound Interest | Fixed Interest |
| --------- | ----------------- | -------------- |
| 1         | R1,000            | R2,000         |
| 2         | R837              | R2,000         |
| 3         | R673              | R2,000         |
| 4         | R507              | R2,000         |
| 5         | R340              | R2,000         |
| 6         | R171              | R2,000         |
| **TOTAL** | **R3,528**        | **R12,000**    |

**Compound Interest**: R3,528 (3.5% of principal)  
**Fixed Interest**: R12,000 (12% of principal)

---

## ⚠️ Important Rules

### For COMPOUND_INTEREST:

- Interest calculated **AFTER each payment**
- Balance **DECREASES** → Interest **DECREASES**
- Must pay **at least the interest** each month
- Can pay **any amount** (flexible)

### For FIXED_INTEREST:

- Interest calculated **ONCE at start**
- Interest **NEVER CHANGES**
- Payment **ALWAYS THE SAME**
- Simple and predictable

---

## 💡 Pro Tips

1. **Compound Interest saves money** if customer pays regularly
2. **Fixed Interest is simpler** to explain to customers
3. **Flexible payments** work best with Compound Interest
4. **Use the helper functions** - they handle all the math!

---

## 🚀 Ready to Use!

Your system now has:

- ✅ Two calculation methods
- ✅ Flexible payment support
- ✅ Helper functions for easy calculations
- ✅ Complete documentation

Just choose the right method for each loan! 🎉
