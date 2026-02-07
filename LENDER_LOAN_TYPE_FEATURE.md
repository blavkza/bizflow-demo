# Lender Loan Type Feature

## ✅ What Was Added

Added the ability to track **what type of loan calculation method** each lender offers.

---

## 🔧 Changes Made

### 1. **Database Schema** (`prisma/schema.prisma`)

Added `loanCalculationMethod` field to the `Lender` model:

```prisma
model Lender {
  id                     String                  @id @default(cuid())
  name                   String
  contactPerson          String?
  email                  String?
  phone                  String?
  website                String?
  address                String?
  description            String?
  createdAt              DateTime                @default(now())
  updatedAt              DateTime                @updatedAt
  interestRate           Float?
  termMonths             Int?
  loanCalculationMethod  LoanCalculationMethod?  // ⬅️ NEW FIELD
  createdBy              String?
  documents              Document[]
  creator                User?                   @relation(fields: [createdBy], references: [id])
  loans                  Loan[]

  @@map("lenders")
}
```

### 2. **Lender Form** (`lenders/_components/lender-modal.tsx`)

Added dropdown to select the loan calculation method:

- **Monthly Compound Interest (Flexible Payments)**
- **Long-term Fixed Interest (Flat Rate)**

### 3. **Loan Creation Form** (`_components/loan-modal.tsx`)

Updated to auto-fill the calculation method when a lender is selected:

```typescript
if (selected.loanCalculationMethod) {
  form.setValue("calculationMethod", selected.loanCalculationMethod);
}
```

---

## 💡 How It Works

### **When Creating a Lender:**

1. Go to **Lenders** section
2. Click **Add New Lender**
3. Fill in lender details
4. **Select Loan Calculation Method**:
   - **Monthly Compound Interest** - For flexible payment loans
   - **Long-term Fixed Interest** - For flat rate loans
5. Save the lender

### **When Creating a Loan:**

1. Go to **Loans** section
2. Click **Add New Loan**
3. **Select a Lender** from the dropdown
4. The system **automatically fills**:
   - Interest Rate (if set)
   - Term in Months (if set)
   - **Calculation Method** (if set) ⬅️ NEW!
5. You can still override these values if needed

---

## 🎯 Benefits

### ✅ **Consistency**

Each lender's preferred loan type is stored and auto-applied

### ✅ **Efficiency**

No need to manually select the calculation method every time

### ✅ **Accuracy**

Reduces errors by using the lender's standard loan structure

### ✅ **Flexibility**

Can still override the auto-filled value if needed

---

## 📊 Example Use Cases

### **Example 1: Bank (Compound Interest)**

**Lender**: Standard Bank  
**Loan Calculation Method**: Monthly Compound Interest (Flexible Payments)  
**Interest Rate**: 12%  
**Term**: 12 months

When you select "Standard Bank" for a new loan:

- ✅ Calculation Method auto-fills to "COMPOUND_INTEREST"
- ✅ Interest Rate auto-fills to 12%
- ✅ Term auto-fills to 12 months

---

### **Example 2: Private Lender (Fixed Interest)**

**Lender**: ABC Finance  
**Loan Calculation Method**: Long-term Fixed Interest (Flat Rate)  
**Interest Rate**: 50%  
**Term**: 10 months

When you select "ABC Finance" for a new loan:

- ✅ Calculation Method auto-fills to "FIXED_INTEREST"
- ✅ Interest Rate auto-fills to 50%
- ✅ Term auto-fills to 10 months

---

## 🔄 Migration

Existing lenders will have `loanCalculationMethod` set to `null` (optional field).

You can:

1. Edit each lender
2. Set their preferred loan calculation method
3. Save

From then on, all new loans from that lender will auto-fill the calculation method!

---

## ✅ Summary

Now your system tracks:

- ✅ What type of loans each lender offers
- ✅ Auto-fills the calculation method when creating loans
- ✅ Saves time and reduces errors
- ✅ Maintains flexibility to override when needed

Perfect for managing multiple lenders with different loan structures! 🎉
