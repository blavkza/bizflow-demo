# Monthly Compound Interest with Flexible Payments

## 🔄 How It Works

For **COMPOUND_INTEREST** loans, customers can pay **ANY AMOUNT** each month. The interest is calculated on the **remaining balance** after each payment.

---

## 📊 Example: R100,000 Loan @ 12% Annual Interest

### Loan Details

- **Principal**: R100,000
- **Annual Interest Rate**: 12% (1% per month)
- **Payment Schedule**: Flexible (customer decides each month)

---

## Month-by-Month with Flexible Payments

### 📅 **Month 1**

**Starting Balance**: R100,000.00

1. **Calculate Interest** on current balance:
   - Interest = R100,000 × 1% = **R1,000.00**

2. **Customer Pays**: R20,000 (they decide this amount)
   - Interest portion: R1,000.00
   - Principal portion: R20,000 - R1,000 = **R19,000.00**

3. **New Balance**:
   - R100,000 - R19,000 = **R81,000.00**

---

### 📅 **Month 2**

**Starting Balance**: R81,000.00 ⬅️ _Interest calculated on THIS_

1. **Calculate Interest** on current balance:
   - Interest = R81,000 × 1% = **R810.00**

2. **Customer Pays**: R15,000 (different amount - they choose!)
   - Interest portion: R810.00
   - Principal portion: R15,000 - R810 = **R14,190.00**

3. **New Balance**:
   - R81,000 - R14,190 = **R66,810.00**

---

### 📅 **Month 3**

**Starting Balance**: R66,810.00 ⬅️ _Interest calculated on THIS_

1. **Calculate Interest** on current balance:
   - Interest = R66,810 × 1% = **R668.10**

2. **Customer Pays**: R30,000 (bigger payment this month!)
   - Interest portion: R668.10
   - Principal portion: R30,000 - R668.10 = **R29,331.90**

3. **New Balance**:
   - R66,810 - R29,331.90 = **R37,478.10**

---

### 📅 **Month 4**

**Starting Balance**: R37,478.10 ⬅️ _Interest calculated on THIS_

1. **Calculate Interest** on current balance:
   - Interest = R37,478.10 × 1% = **R374.78**

2. **Customer Pays**: R10,000 (smaller payment this month)
   - Interest portion: R374.78
   - Principal portion: R10,000 - R374.78 = **R9,625.22**

3. **New Balance**:
   - R37,478.10 - R9,625.22 = **R27,852.88**

---

### 📅 **Month 5**

**Starting Balance**: R27,852.88 ⬅️ _Interest calculated on THIS_

1. **Calculate Interest** on current balance:
   - Interest = R27,852.88 × 1% = **R278.53**

2. **Customer Pays**: R28,131.41 (paying off the loan!)
   - Interest portion: R278.53
   - Principal portion: R28,131.41 - R278.53 = **R27,852.88**

3. **New Balance**:
   - R27,852.88 - R27,852.88 = **R0.00** ✅ PAID OFF!

---

## 📊 Summary Table

| Month     | Balance Start | Interest (1%) | Payment         | Principal       | Balance End |
| --------- | ------------- | ------------- | --------------- | --------------- | ----------- |
| 1         | R100,000.00   | R1,000.00     | R20,000.00      | R19,000.00      | R81,000.00  |
| 2         | R81,000.00    | R810.00       | R15,000.00      | R14,190.00      | R66,810.00  |
| 3         | R66,810.00    | R668.10       | R30,000.00      | R29,331.90      | R37,478.10  |
| 4         | R37,478.10    | R374.78       | R10,000.00      | R9,625.22       | R27,852.88  |
| 5         | R27,852.88    | R278.53       | R28,131.41      | R27,852.88      | R0.00       |
| **TOTAL** | -             | **R3,131.41** | **R103,131.41** | **R100,000.00** | -           |

---

## 🔑 Key Rules for Flexible Payments

### ✅ **The Process Each Month:**

1. **Calculate Interest** on the **current balance**

   ```
   Interest = Current Balance × (Annual Rate ÷ 12 ÷ 100)
   ```

2. **Customer Makes Payment** (any amount they want)

   ```
   Principal Paid = Payment Amount - Interest
   ```

3. **Calculate New Balance**

   ```
   New Balance = Current Balance - Principal Paid
   ```

4. **Repeat** next month with the new balance

---

## ⚠️ Important Notes

### **Minimum Payment**

The customer must pay **at least the interest** each month, otherwise the balance will grow!

**Example of insufficient payment:**

- Balance: R50,000
- Interest: R500 (1%)
- Payment: R300 ❌ **TOO LOW!**
- Result: Balance increases to R50,200 (R50,000 + R500 - R300)

### **Recommended Minimum**

```
Minimum Payment = Interest + Some Principal
Minimum Payment = (Balance × 1%) + (Balance × 1%)
Minimum Payment = Balance × 2%
```

For R50,000 balance:

- Interest: R500
- Recommended minimum: R1,000 (to also pay some principal)

---

## 💻 Using the Helper Functions

### Calculate Interest for Current Month

```typescript
import { calculateMonthlyInterest } from "@/lib/loan-calc";

const currentBalance = 50000;
const annualRate = 12; // 12%

const interest = calculateMonthlyInterest(currentBalance, annualRate);
// Result: R500
```

### Calculate Payment Breakdown

```typescript
import { calculatePaymentBreakdown } from "@/lib/loan-calc";

const currentBalance = 50000;
const paymentAmount = 10000;
const annualRate = 12;

const breakdown = calculatePaymentBreakdown(
  currentBalance,
  paymentAmount,
  annualRate,
);

console.log(breakdown);
// {
//   interestCharged: 500,
//   principalPaid: 9500,
//   newBalance: 40500
// }
```

---

## 🎯 Real-World Example

### Scenario: Business Loan with Variable Income

**Loan**: R250,000 @ 18% annual (1.5% monthly)

| Month | Balance  | Interest | Payment | Why This Amount? |
| ----- | -------- | -------- | ------- | ---------------- |
| 1     | R250,000 | R3,750   | R50,000 | Good sales month |
| 2     | R200,000 | R3,000   | R20,000 | Slow month       |
| 3     | R180,000 | R2,700   | R80,000 | Great month!     |
| 4     | R100,000 | R1,500   | R30,000 | Average month    |
| 5     | R70,000  | R1,050   | R25,000 | Average month    |
| 6     | R45,000  | R675     | R45,675 | Pay off!         |

**Total Interest Paid**: R12,675  
**Total Paid**: R262,675  
**Paid off in**: 6 months (instead of fixed 12+ months)

---

## ✅ Benefits of Flexible Payments

1. **Pay More When You Can** - Reduce interest faster
2. **Pay Less When Needed** - Manage cash flow
3. **Early Payoff** - No penalty for paying off early
4. **Fair Interest** - Only pay interest on what you owe
5. **Transparent** - Easy to calculate and understand

---

## 🔧 How Your System Handles This

### When Recording a Payment:

1. **Fetch Current Loan Balance**
2. **Calculate Interest** using `calculateMonthlyInterest()`
3. **Customer Enters Payment Amount**
4. **Calculate Breakdown** using `calculatePaymentBreakdown()`
5. **Show Customer**:
   - Interest: R500
   - Principal: R9,500
   - New Balance: R40,500
6. **Save Payment Record** with breakdown
7. **Update Loan Balance**

### The System Automatically:

- ✅ Calculates interest on current balance
- ✅ Splits payment into interest and principal
- ✅ Updates the remaining balance
- ✅ Tracks total interest paid
- ✅ Shows payment history with breakdowns
