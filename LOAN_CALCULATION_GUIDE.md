# Loan Calculation System - Updated Implementation

## Overview

The loan system now supports two distinct calculation methods as requested:

### 1. **Monthly Compound Interest** (`COMPOUND_INTEREST`)

- **How it works**: Interest is calculated monthly on the remaining balance
- **Formula**: Standard amortization formula with reducing balance
- **Use case**: Traditional bank loans, mortgages, car loans
- **Characteristics**:
  - Monthly payment stays constant
  - Interest portion decreases over time
  - Principal portion increases over time
  - Total interest is lower than fixed interest for same rate

### 2. **Long-term Fixed Interest** (`FIXED_INTEREST`)

- **How it works**: Total interest calculated upfront and split evenly across all months
- **Formula**: Total Interest = Principal × (Rate/100), then divided by number of months
- **Use case**: Simple interest loans, short-term business loans
- **Characteristics**:
  - Monthly payment stays constant
  - Interest portion stays the same each month
  - Principal portion stays the same each month
  - Matches your example exactly

## Example: Fixed Interest Loan

```
Loan Amount: R250,000
Interest Rate: 50%
Period: 10 Months

Calculation:
- Total Interest = R250,000 × 50% = R125,000
- Total Payable = R250,000 + R125,000 = R375,000
- Monthly Payment = R375,000 ÷ 10 = R37,500

Payment Schedule:
1. 15 February 2026 = R37,500
2. 15 March 2026 = R37,500
3. 15 April 2026 = R37,500
... (continues for 10 months)
10. 15 November 2026 = R37,500

Total Payable = R375,000
```

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)

```prisma
enum LoanCalculationMethod {
  COMPOUND_INTEREST    // Monthly compound interest (reducing balance)
  FIXED_INTEREST       // Long-term fixed interest (flat rate, total interest upfront)
}

model Loan {
  // ...
  calculationMethod LoanCalculationMethod @default(COMPOUND_INTEREST)
  // ...
}
```

### 2. Calculation Logic (`lib/loan-calc.ts`)

Updated the `calculateLoan` function to support both methods:

- `COMPOUND_INTEREST`: Uses standard amortization formula
- `FIXED_INTEREST`: Calculates total interest upfront and divides evenly

### 3. API Routes (`app/api/loans/route.ts`)

Updated to use new enum values and default to `COMPOUND_INTEREST`

### 4. User Interface (`app/dashboard/loans/_components/loan-modal.tsx`)

Updated the loan creation/edit form with clear labels:

- "Monthly Compound Interest (Reducing Balance)"
- "Long-term Fixed Interest (Flat Rate)"

## Migration Notes

### Existing Loans

- Old `AMORTIZED` loans will need to be migrated to `COMPOUND_INTEREST`
- Old `FLAT` loans will need to be migrated to `FIXED_INTEREST`
- The database migration will handle this automatically

### Data Migration Script (if needed)

```sql
-- Update existing loans to use new enum values
UPDATE loans
SET "calculationMethod" = 'COMPOUND_INTEREST'
WHERE "calculationMethod" = 'AMORTIZED';

UPDATE loans
SET "calculationMethod" = 'FIXED_INTEREST'
WHERE "calculationMethod" = 'FLAT';
```

## Testing

Run the example file to see both calculation methods in action:

```bash
npx ts-node lib/loan-examples.ts
```

This will show:

1. Fixed Interest example (matching your R250,000 @ 50% example)
2. Compound Interest example (showing how reducing balance works)
3. Key differences between the two methods

## Usage in the Application

### Creating a New Loan

1. Navigate to **Loans** section
2. Click **Add New Loan**
3. Fill in loan details:
   - Lender name
   - Loan amount
   - Interest rate (as a percentage)
   - Start date
   - Term in months
4. Select **Calculation Method**:
   - Choose "Monthly Compound Interest" for traditional bank loans
   - Choose "Long-term Fixed Interest" for simple interest loans
5. The system will automatically calculate:
   - Monthly payment
   - Total interest
   - Total payable amount
   - Complete payment schedule

### Viewing Loan Details

- The loan detail page shows the complete amortization schedule
- Each payment shows the breakdown of principal and interest
- For Fixed Interest loans, you'll see equal interest amounts each month
- For Compound Interest loans, you'll see decreasing interest amounts

## Key Benefits

1. **Clarity**: Clear naming that matches business terminology
2. **Accuracy**: Calculations match real-world loan structures
3. **Flexibility**: Support for both simple and complex loan types
4. **Transparency**: Full payment schedules show exactly how loans are calculated
