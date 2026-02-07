/**
 * Migration script to update LoanCalculationMethod enum values
 * Run this BEFORE running prisma db push
 * 
 * This script updates existing loans and lenders from old enum values to new ones:
 * - AMORTIZED → COMPOUND_INTEREST
 * - FLAT → FIXED_INTEREST
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting enum migration...\n');

  try {
    // Step 1: Update loans with AMORTIZED to COMPOUND_INTEREST
    console.log('📊 Updating loans with AMORTIZED calculation method...');
    const loansAmortized = await prisma.$executeRawUnsafe(`
      UPDATE loans 
      SET "calculationMethod" = 'COMPOUND_INTEREST' 
      WHERE "calculationMethod" = 'AMORTIZED'
    `);
    console.log(`✅ Updated ${loansAmortized} loan(s) from AMORTIZED to COMPOUND_INTEREST\n`);

    // Step 2: Update loans with FLAT to FIXED_INTEREST
    console.log('📊 Updating loans with FLAT calculation method...');
    const loansFlat = await prisma.$executeRawUnsafe(`
      UPDATE loans 
      SET "calculationMethod" = 'FIXED_INTEREST' 
      WHERE "calculationMethod" = 'FLAT'
    `);
    console.log(`✅ Updated ${loansFlat} loan(s) from FLAT to FIXED_INTEREST\n`);

    // Step 3: Update lenders with AMORTIZED to COMPOUND_INTEREST
    console.log('🏦 Updating lenders with AMORTIZED calculation method...');
    const lendersAmortized = await prisma.$executeRawUnsafe(`
      UPDATE lenders 
      SET "loanCalculationMethod" = 'COMPOUND_INTEREST' 
      WHERE "loanCalculationMethod" = 'AMORTIZED'
    `);
    console.log(`✅ Updated ${lendersAmortized} lender(s) from AMORTIZED to COMPOUND_INTEREST\n`);

    // Step 4: Update lenders with FLAT to FIXED_INTEREST
    console.log('🏦 Updating lenders with FLAT calculation method...');
    const lendersFlat = await prisma.$executeRawUnsafe(`
      UPDATE lenders 
      SET "loanCalculationMethod" = 'FIXED_INTEREST' 
      WHERE "loanCalculationMethod" = 'FLAT'
    `);
    console.log(`✅ Updated ${lendersFlat} lender(s) from FLAT to FIXED_INTEREST\n`);

    // Step 5: Verify the migration
    console.log('🔍 Verifying migration...');
    const remainingOldLoans = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM loans 
      WHERE "calculationMethod" IN ('AMORTIZED', 'FLAT')
    `);
    const remainingOldLenders = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM lenders 
      WHERE "loanCalculationMethod" IN ('AMORTIZED', 'FLAT')
    `);

    const oldLoansCount = Number(remainingOldLoans[0]?.count || 0);
    const oldLendersCount = Number(remainingOldLenders[0]?.count || 0);

    if (oldLoansCount === 0 && oldLendersCount === 0) {
      console.log('✅ Migration successful! No records with old enum values found.\n');
      console.log('📝 Summary:');
      console.log(`   - Loans updated: ${loansAmortized + loansFlat}`);
      console.log(`   - Lenders updated: ${lendersAmortized + lendersFlat}`);
      console.log('\n✨ You can now safely run: npx prisma db push\n');
    } else {
      console.warn('⚠️  Warning: Some records still have old enum values:');
      console.warn(`   - Loans: ${oldLoansCount}`);
      console.warn(`   - Lenders: ${oldLendersCount}`);
      console.warn('\nPlease check your database manually.\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\nPlease check the error above and try again.\n');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
