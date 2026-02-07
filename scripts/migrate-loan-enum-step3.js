/**
 * Step 3: Remove default value constraint from database
 * This removes the old default value so we can drop the old enum values
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Step 3: Removing old default value constraint...\n');

  try {
    // Remove the default value from the calculationMethod column
    console.log('📝 Removing default value from loans.calculationMethod...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE loans 
      ALTER COLUMN "calculationMethod" DROP DEFAULT
    `);
    console.log('✅ Removed default value\n');

    // Set it back to the new default
    console.log('📝 Setting new default value...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE loans 
      ALTER COLUMN "calculationMethod" SET DEFAULT 'COMPOUND_INTEREST'::"LoanCalculationMethod"
    `);
    console.log('✅ Set new default value to COMPOUND_INTEREST\n');

    console.log('✨ Step 3 complete!\n');
    console.log('📝 Next step: Run "npx prisma db push" to complete the migration\n');

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
