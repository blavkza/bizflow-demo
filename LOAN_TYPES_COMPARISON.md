# Loan Types Comparison

## 🏦 Type 1: Monthly Compound Interest (COMPOUND_INTEREST)

**Best for**: Traditional bank loans, mortgages, car loans

### How it works:

- Interest is calculated **monthly** on the **remaining balance**
- As you pay down the loan, the interest portion decreases
- The principal portion increases over time
- Uses standard banking amortization formula

### Example: R250,000 @ 12% annual (1% monthly) for 10 months

| Month | Payment | Principal | Interest | Balance  |
| ----- | ------- | --------- | -------- | -------- |
| 1     | R26,361 | R23,861   | R2,500   | R226,139 |
| 2     | R26,361 | R24,100   | R2,261   | R202,039 |
| 3     | R26,361 | R24,341   | R2,020   | R177,698 |
| ...   | ...     | ...       | ...      | ...      |
| 10    | R26,361 | R26,099   | R262     | R0       |

**Total Interest**: ~R13,610  
**Total Payable**: ~R263,610  
**Monthly Payment**: R26,361 (constant)

---

## 💰 Type 2: Long-term Fixed Interest (FIXED_INTEREST)

**Best for**: Simple interest loans, short-term business loans

### How it works:

- Total interest calculated **upfront**: Principal × Rate
- Interest is **split evenly** across all months
- Principal is **split evenly** across all months
- Simple, predictable calculation

### Example: R250,000 @ 50% for 10 months (YOUR EXAMPLE)

| Month | Payment | Principal | Interest | Balance  |
| ----- | ------- | --------- | -------- | -------- |
| 1     | R37,500 | R25,000   | R12,500  | R225,000 |
| 2     | R37,500 | R25,000   | R12,500  | R200,000 |
| 3     | R37,500 | R25,000   | R12,500  | R175,000 |
| ...   | ...     | ...       | ...      | ...      |
| 10    | R37,500 | R25,000   | R12,500  | R0       |

**Total Interest**: R125,000  
**Total Payable**: R375,000  
**Monthly Payment**: R37,500 (constant)

**Calculation**:

- Interest = R250,000 × 50% = R125,000
- Total = R250,000 + R125,000 = R375,000
- Monthly = R375,000 ÷ 10 = R37,500

---

## 📊 Key Differences

| Feature                  | Compound Interest                | Fixed Interest             |
| ------------------------ | -------------------------------- | -------------------------- |
| **Interest Calculation** | Monthly on remaining balance     | Upfront on full amount     |
| **Interest per Month**   | Decreases over time              | Stays constant             |
| **Principal per Month**  | Increases over time              | Stays constant             |
| **Total Interest**       | Lower (for same rate)            | Higher (for same rate)     |
| **Complexity**           | More complex                     | Simple                     |
| **Common Use**           | Bank loans, mortgages            | Business loans, short-term |
| **Formula**              | PMT = P × (r(1+r)^n)/((1+r)^n-1) | Total = P × (1 + Rate)     |

---

## 🎯 When to Use Each Type

### Use COMPOUND_INTEREST when:

- ✅ Working with traditional bank loans
- ✅ Long-term financing (mortgages, car loans)
- ✅ You want to minimize total interest paid
- ✅ Standard banking practices apply

### Use FIXED_INTEREST when:

- ✅ Simple business loans
- ✅ Short-term financing
- ✅ You want predictable, easy-to-calculate payments
- ✅ The lender quotes a "total interest" amount
- ✅ Matches your example: R250k @ 50% = R125k interest

---

## 💡 Pro Tip

For the **same interest rate percentage**, Fixed Interest will always result in **higher total interest** than Compound Interest because:

- Fixed Interest: Interest is calculated on the **full principal** for the entire term
- Compound Interest: Interest is calculated on the **decreasing balance** as you pay it down

**Example with 12% rate for 10 months on R250,000**:

- Fixed Interest: R25,000 total interest (R250k × 10%)
- Compound Interest: ~R13,610 total interest (calculated on reducing balance)

This is why Fixed Interest loans often use **higher percentage rates** (like 50% in your example) to achieve the desired total interest amount.
