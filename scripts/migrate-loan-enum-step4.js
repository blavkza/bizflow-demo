/**
 * Step 4: Manually recreate the enum with new values
 * This is a more aggressive approach that drops and recreates the enum
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Step 4: Manually recreating LoanCalculationMethod enum...\n');

  try {
    // Step 1: Change column to text temporarily
    console.log('📝 Converting calculationMethod column to TEXT...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE loans 
      ALTER COLUMN "calculationMethod" TYPE TEXT
    `);
    console.log('✅ Converted to TEXT\n');

    // Step 2: Drop the old enum
    console.log('📝 Dropping old LoanCalculationMethod enum...');
    await prisma.$executeRawUnsafe(`
      DROP TYPE IF EXISTS "LoanCalculationMethod" CASCADE
    `);
    console.log('✅ Dropped old enum\n');

    // Step 3: Create new enum with new values
    console.log('📝 Creating new LoanCalculationMethod enum...');
    await prisma.$executeRawUnsafe(`
      CREATE TYPE "LoanCalculationMethod" AS ENUM ('COMPOUND_INTEREST', 'FIXED_INTEREST')
    `);
    console.log('✅ Created new enum\n');

    // Step 4: Convert column back to enum
    console.log('📝 Converting calculationMethod column back to enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE loans 
      ALTER COLUMN "calculationMethod" TYPE "LoanCalculationMethod" 
      USING "calculationMethod"::"LoanCalculationMethod"
    `);
    console.log('✅ Converted back to enum\n');

    // Step 5: Set default value
    console.log('📝 Setting default value...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE loans 
      ALTER COLUMN "calculationMethod" SET DEFAULT 'COMPOUND_INTEREST'::"LoanCalculationMethod"
    `);
    console.log('✅ Set default value\n');

    console.log('✨ Step 4 complete! Enum successfully recreated.\n');
    console.log('📝 Next step: Run "npx prisma db push" to sync the rest of the schema\n');

  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error('\nError details:', error);
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
