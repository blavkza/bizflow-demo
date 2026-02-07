-- Migration script to update LoanCalculationMethod enum values
-- This updates existing data from old values to new values

BEGIN;

-- Step 1: Update existing loans to use new enum values
UPDATE loans 
SET "calculationMethod" = 'COMPOUND_INTEREST' 
WHERE "calculationMethod" = 'AMORTIZED';

UPDATE loans 
SET "calculationMethod" = 'FIXED_INTEREST' 
WHERE "calculationMethod" = 'FLAT';

-- Step 2: Update existing lenders if they have the old values
UPDATE lenders 
SET "loanCalculationMethod" = 'COMPOUND_INTEREST' 
WHERE "loanCalculationMethod" = 'AMORTIZED';

UPDATE lenders 
SET "loanCalculationMethod" = 'FIXED_INTEREST' 
WHERE "loanCalculationMethod" = 'FLAT';

COMMIT;
