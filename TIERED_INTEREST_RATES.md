# Tiered Interest Rates for Fixed Interest Loans

## ✅ Feature Added

Added support for **tiered interest rates** based on loan term length for lenders offering **FIXED_INTEREST** loans.

---

## 📊 Default Tiers

For **Long-term Fixed Interest** loans, the following tiers are recommended:

| Term Length   | Interest Rate |
| ------------- | ------------- |
| **3 months**  | 40%           |
| **6 months**  | 50%           |
| **9 months**  | 60%           |
| **12 months** | 75%           |

---

## 🔧 How It Works

### **1. Setting Up a Lender with Tiered Rates**

When creating or editing a lender:

1. Go to **Lenders** → **Add New Lender** (or edit existing)
2. Fill in basic details (name, contact, etc.)
3. Select **Loan Calculation Method**: "Long-term Fixed Interest (Flat Rate)"
4. **Tiered Interest Rates section appears** 📋
5. Enter rates for each term:
   - 3 Months: 40%
   - 6 Months: 50%
   - 9 Months: 60%
   - 12 Months: 75%
6. Save the lender

---

### **2. Creating a Loan with Tiered Rates**

When creating a loan from a lender with tiered rates:

1. Go to **Loans** → **Add New Loan**
2. **Select Lender**: Choose your lender (e.g., "ABC Finance")
3. **System auto-fills**:
   - Calculation Method: FIXED_INTEREST
4. **Enter Term**: e.g., 6 months
5. **System auto-selects rate**: 50% (for 6 months)
6. Continue with loan details and save

---

## 💡 Example Scenario

### **Lender Setup: ABC Finance**

```
Name: ABC Finance
Loan Type: Long-term Fixed Interest (Flat Rate)

Tiered Rates:
- 3 Months: 40%
- 6 Months: 50%
- 9 Months: 60%
- 12 Months: 75%
```

### **Creating Loans:**

#### **Loan 1: 6-Month Term**

```
Lender: ABC Finance
Amount: R250,000
Term: 6 months
Interest Rate: 50% ← Auto-filled from tier

Calculation:
- Total Interest = R250,000 × 50% = R125,000
- Total Payable = R375,000
- Monthly Payment = R375,000 ÷ 6 = R62,500
```

#### **Loan 2: 12-Month Term**

```
Lender: ABC Finance
Amount: R250,000
Term: 12 months
Interest Rate: 75% ← Auto-filled from tier

Calculation:
- Total Interest = R250,000 × 75% = R187,500
- Total Payable = R437,500
- Monthly Payment = R437,500 ÷ 12 = R36,458.33
```

---

## 🎯 Benefits

### ✅ **Automatic Rate Selection**

- System automatically selects the correct rate based on term
- No manual lookup needed
- Reduces errors

### ✅ **Flexible Pricing**

- Different rates for different terms
- Encourages longer-term loans (higher rates = more profit)
- Fair pricing based on risk/duration

### ✅ **Easy Management**

- All rates stored in one place
- Update rates for all future loans by editing lender
- Clear visibility of pricing structure

---

## 🔄 How Auto-Selection Works

When you select a lender and enter a term:

```typescript
// System logic:
1. Check if lender uses FIXED_INTEREST
2. Check the term length entered
3. Match term to appropriate tier:
   - If term = 3 months → use interestRate3Months
   - If term = 6 months → use interestRate6Months
   - If term = 9 months → use interestRate9Months
   - If term = 12 months → use interestRate12Months
4. Auto-fill the interest rate field
5. User can still override if needed
```

---

## ⚙️ Database Schema

Added to `Lender` model:

```prisma
model Lender {
  // ... existing fields

  loanCalculationMethod  LoanCalculationMethod?

  // Tiered interest rates for FIXED_INTEREST loans
  interestRate3Months    Float?  // Interest rate for 3 month term
  interestRate6Months    Float?  // Interest rate for 6 month term
  interestRate9Months    Float?  // Interest rate for 9 month term
  interestRate12Months   Float?  // Interest rate for 12 month term

  // ... rest of fields
}
```

---

## 📝 UI Behavior

### **Lender Form:**

- Tiered rates section **only shows** when "Long-term Fixed Interest" is selected
- Fields are optional (can leave blank if not using tiers)
- Placeholder values show recommended rates (40, 50, 60, 75)

### **Loan Form:**

- When lender is selected, calculation method is auto-filled
- When term is entered, appropriate tiered rate is auto-selected
- User can still manually change the rate if needed
- Works seamlessly with existing loan calculation logic

---

## 🚀 Usage Tips

### **Tip 1: Set Default Tiers**

When creating a new FIXED_INTEREST lender, fill in all four tiers even if you don't plan to offer all terms. This gives you flexibility later.

### **Tip 2: Update Rates Easily**

To change rates for all future loans:

1. Edit the lender
2. Update the tiered rates
3. Save
   All new loans will use the updated rates!

### **Tip 3: Override When Needed**

The auto-filled rate is just a suggestion. You can always manually change it for special cases or negotiations.

### **Tip 4: Non-Standard Terms**

If a customer wants a 5-month loan, the system will use the fallback `interestRate` field. You can then manually adjust as needed.

---

## ✅ Summary

Your loan system now supports:

✅ **Tiered interest rates** for FIXED_INTEREST loans  
✅ **Automatic rate selection** based on term length  
✅ **Four standard tiers**: 3, 6, 9, and 12 months  
✅ **Flexible override** capability  
✅ **Easy rate management** per lender

Perfect for lenders who offer different rates based on loan duration! 🎉

---

## 📊 Complete Example

### **Step-by-Step: Setting Up and Using Tiered Rates**

#### **Step 1: Create Lender**

```
Lenders → Add New Lender
Name: Quick Cash Finance
Loan Calculation Method: Long-term Fixed Interest (Flat Rate)

Tiered Rates:
✓ 3 Months: 40%
✓ 6 Months: 50%
✓ 9 Months: 60%
✓ 12 Months: 75%

Save
```

#### **Step 2: Create Loan**

```
Loans → Add New Loan
Lender: Quick Cash Finance ← Select
Calculation Method: FIXED_INTEREST ← Auto-filled
Amount: R100,000
Term: 6 months ← Enter
Interest Rate: 50% ← Auto-filled from tier!

Result:
- Total Interest: R50,000
- Total Payable: R150,000
- Monthly Payment: R25,000

Save
```

Done! The system handled all the rate selection automatically! ✨
