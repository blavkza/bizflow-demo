const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const q = await prisma.quotation.findFirst({
      select: {
        installmentPeriod: true,
        interestRate: true,
        interestAmount: true,
      }
    });
    console.log('Success: Quotation fields are accessible', q);
    
    const i = await prisma.invoice.findFirst({
      select: {
        installmentPeriod: true,
        interestRate: true,
        interestAmount: true,
      }
    });
    console.log('Success: Invoice fields are accessible', i);
  } catch (e) {
    console.error('Failure:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
