# Monthly Compound Interest - Detailed Calculation Example

## How Monthly Compound Interest Works

**Key Principle**: Interest is calculated **EVERY MONTH** on the **REMAINING BALANCE** after the previous payment.

---

## Example: R100,000 loan @ 12% annual interest for 6 months

### Setup

- **Principal**: R100,000
- **Annual Interest Rate**: 12%
- **Monthly Interest Rate**: 12% ÷ 12 = **1% per month** (0.01)
- **Term**: 6 months
- **Monthly Payment**: R17,254.84 (calculated using amortization formula)

---

## Month-by-Month Breakdown

### 📅 **Month 1**

**Starting Balance**: R100,000.00

1. **Calculate Interest** on remaining balance:
   - Interest = R100,000 × 1% = **R1,000.00**

2. **Make Payment**: R17,254.84
   - Interest portion: R1,000.00
   - Principal portion: R17,254.84 - R1,000.00 = **R16,254.84**

3. **New Balance** after payment:
   - R100,000.00 - R16,254.84 = **R83,745.16**

---

### 📅 **Month 2**

**Starting Balance**: R83,745.16 ⬅️ _Interest calculated on THIS amount_

1. **Calculate Interest** on remaining balance:
   - Interest = R83,745.16 × 1% = **R837.45**

2. **Make Payment**: R17,254.84
   - Interest portion: R837.45
   - Principal portion: R17,254.84 - R837.45 = **R16,417.39**

3. **New Balance** after payment:
   - R83,745.16 - R16,417.39 = **R67,327.77**

---

### 📅 **Month 3**

**Starting Balance**: R67,327.77 ⬅️ _Interest calculated on THIS amount_

1. **Calculate Interest** on remaining balance:
   - Interest = R67,327.77 × 1% = **R673.28**

2. **Make Payment**: R17,254.84
   - Interest portion: R673.28
   - Principal portion: R17,254.84 - R673.28 = **R16,581.56**

3. **New Balance** after payment:
   - R67,327.77 - R16,581.56 = **R50,746.21**

---

### 📅 **Month 4**

**Starting Balance**: R50,746.21 ⬅️ _Interest calculated on THIS amount_

1. **Calculate Interest** on remaining balance:
   - Interest = R50,746.21 × 1% = **R507.46**

2. **Make Payment**: R17,254.84
   - Interest portion: R507.46
   - Principal portion: R17,254.84 - R507.46 = **R16,747.38**

3. **New Balance** after payment:
   - R50,746.21 - R16,747.38 = **R33,998.83**

---

### 📅 **Month 5**

**Starting Balance**: R33,998.83 ⬅️ _Interest calculated on THIS amount_

1. **Calculate Interest** on remaining balance:
   - Interest = R33,998.83 × 1% = **R339.99**

2. **Make Payment**: R17,254.84
   - Interest portion: R339.99
   - Principal portion: R17,254.84 - R339.99 = **R16,914.85**

3. **New Balance** after payment:
   - R33,998.83 - R16,914.85 = **R17,083.98**

---

### 📅 **Month 6** (Final Payment)

**Starting Balance**: R17,083.98 ⬅️ _Interest calculated on THIS amount_

1. **Calculate Interest** on remaining balance:
   - Interest = R17,083.98 × 1% = **R170.84**

2. **Make Payment**: R17,254.84
   - Interest portion: R170.84
   - Principal portion: R17,254.84 - R170.84 = **R17,084.00**

3. **New Balance** after payment:
   - R17,083.98 - R17,084.00 = **R0.00** ✅

---

## Summary Table

| Month     | Starting Balance | Interest (1%) | Payment         | Principal       | Ending Balance |
| --------- | ---------------- | ------------- | --------------- | --------------- | -------------- |
| 1         | R100,000.00      | R1,000.00     | R17,254.84      | R16,254.84      | R83,745.16     |
| 2         | R83,745.16       | R837.45       | R17,254.84      | R16,417.39      | R67,327.77     |
| 3         | R67,327.77       | R673.28       | R17,254.84      | R16,581.56      | R50,746.21     |
| 4         | R50,746.21       | R507.46       | R17,254.84      | R16,747.38      | R33,998.83     |
| 5         | R33,998.83       | R339.99       | R17,254.84      | R16,914.85      | R17,083.98     |
| 6         | R17,083.98       | R170.84       | R17,254.84      | R17,084.00      | R0.00          |
| **TOTAL** | -                | **R3,529.02** | **R103,529.04** | **R100,000.00** | -              |

---

## 🔑 Key Observations

1. **Interest Decreases Each Month**
   - Month 1: R1,000.00
   - Month 6: R170.84
   - Why? Because the remaining balance gets smaller

2. **Principal Increases Each Month**
   - Month 1: R16,254.84
   - Month 6: R17,084.00
   - Why? More of your payment goes to principal as interest decreases

3. **Payment Stays Constant**
   - Every month: R17,254.84
   - This is the "amortized" payment

4. **Total Interest Paid**
   - R3,529.02 (only 3.5% of the loan amount)
   - Much less than if we calculated 12% on the full R100,000

---

## 💡 The Formula in Action

The monthly payment is calculated using:

```
PMT = P × [r(1+r)^n] / [(1+r)^n - 1]

Where:
P = Principal (R100,000)
r = Monthly rate (0.01)
n = Number of months (6)

PMT = 100,000 × [0.01(1.01)^6] / [(1.01)^6 - 1]
PMT = 100,000 × [0.010615] / [0.061520]
PMT = 100,000 × 0.172548
PMT = R17,254.84
```

Then each month:

1. Calculate interest on **current balance**
2. Subtract interest from payment to get principal
3. Subtract principal from balance to get new balance
4. Repeat

---

## ✅ This is EXACTLY how your COMPOUND_INTEREST method works!

The code in `lib/loan-calc.ts` implements this correctly:

```typescript
for (let i = 1; i <= termMonths; i++) {
  const interestM = remainingBalance * monthlyRate; // Interest on REMAINING balance
  const principalM = monthlyPayment - interestM; // Rest goes to principal
  remainingBalance -= principalM; // Reduce balance
  // ... save to schedule
}
```
