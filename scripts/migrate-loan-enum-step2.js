/**
 * Step 2: Update existing data to use new enum values
 * Run this AFTER step 1 has completed successfully
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Step 2: Updating existing data to use new enum values...\n');

  try {
    // Update loans with AMORTIZED to COMPOUND_INTEREST
    console.log('📊 Updating loans with AMORTIZED calculation method...');
    const loansAmortized = await prisma.$executeRawUnsafe(`
      UPDATE loans 
      SET "calculationMethod" = 'COMPOUND_INTEREST' 
      WHERE "calculationMethod" = 'AMORTIZED'
    `);
    console.log(`✅ Updated ${loansAmortized} loan(s) from AMORTIZED to COMPOUND_INTEREST\n`);

    // Update loans with FLAT to FIXED_INTEREST
    console.log('📊 Updating loans with FLAT calculation method...');
    const loansFlat = await prisma.$executeRawUnsafe(`
      UPDATE loans 
      SET "calculationMethod" = 'FIXED_INTEREST' 
      WHERE "calculationMethod" = 'FLAT'
    `);
    console.log(`✅ Updated ${loansFlat} loan(s) from FLAT to FIXED_INTEREST\n`);

    // Update lenders (skip if column doesn't exist yet)
    let lendersAmortized = 0;
    let lendersFlat = 0;
    
    try {
      console.log('🏦 Updating lenders with AMORTIZED calculation method...');
      lendersAmortized = await prisma.$executeRawUnsafe(`
        UPDATE lenders 
        SET "loanCalculationMethod" = 'COMPOUND_INTEREST' 
        WHERE "loanCalculationMethod" = 'AMORTIZED'
      `);
      console.log(`✅ Updated ${lendersAmortized} lender(s) from AMORTIZED to COMPOUND_INTEREST\n`);

      console.log('🏦 Updating lenders with FLAT calculation method...');
      lendersFlat = await prisma.$executeRawUnsafe(`
        UPDATE lenders 
        SET "loanCalculationMethod" = 'FIXED_INTEREST' 
        WHERE "loanCalculationMethod" = 'FLAT'
      `);
      console.log(`✅ Updated ${lendersFlat} lender(s) from FLAT to FIXED_INTEREST\n`);
    } catch (error) {
      if (error.code === 'P2010' && error.meta?.message?.includes('does not exist')) {
        console.log('ℹ️  Lenders table doesn\'t have loanCalculationMethod column yet - skipping lender updates\n');
      } else {
        throw error;
      }
    }

    // Verify the migration
    console.log('🔍 Verifying migration...');
    const remainingOldLoans = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM loans 
      WHERE "calculationMethod" IN ('AMORTIZED', 'FLAT')
    `);
    
    let remainingOldLenders = [{ count: 0 }];
    try {
      remainingOldLenders = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count 
        FROM lenders 
        WHERE "loanCalculationMethod" IN ('AMORTIZED', 'FLAT')
      `);
    } catch (error) {
      // Column doesn't exist yet, that's okay
    }

    const oldLoansCount = Number(remainingOldLoans[0]?.count || 0);
    const oldLendersCount = Number(remainingOldLenders[0]?.count || 0);

    if (oldLoansCount === 0 && oldLendersCount === 0) {
      console.log('✅ Migration successful! No records with old enum values found.\n');
      console.log('📝 Summary:');
      console.log(`   - Loans updated: ${loansAmortized + loansFlat}`);
      console.log(`   - Lenders updated: ${lendersAmortized + lendersFlat}`);
      console.log('\n✨ Step 2 complete!\n');
      console.log('📝 Next step: Run "npx prisma db push" to update the schema\n');
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
