/**
 * Step 1: Add new enum values to the database
 * This must be run BEFORE updating any data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Step 1: Adding new enum values to database...\n');

  try {
    // Add new enum values alongside the old ones
    console.log('📝 Adding COMPOUND_INTEREST to LoanCalculationMethod enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "LoanCalculationMethod" ADD VALUE IF NOT EXISTS 'COMPOUND_INTEREST'
    `);
    console.log('✅ Added COMPOUND_INTEREST\n');

    console.log('📝 Adding FIXED_INTEREST to LoanCalculationMethod enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "LoanCalculationMethod" ADD VALUE IF NOT EXISTS 'FIXED_INTEREST'
    `);
    console.log('✅ Added FIXED_INTEREST\n');

    console.log('✨ Step 1 complete! New enum values added successfully.\n');
    console.log('📝 Next step: Run "node scripts/migrate-loan-enum-step2.js"\n');

  } catch (error) {
    console.error('❌ Failed to add enum values:', error.message);
    console.error('\nThis might be okay if the values already exist.\n');
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
