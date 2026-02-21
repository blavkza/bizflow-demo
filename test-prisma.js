const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const settings = await prisma.generalSetting.findFirst({
      select: {
        depositPaymentEnabled: true,
      }
    });
    console.log('Success: depositPaymentEnabled is accessible', settings);
  } catch (e) {
    console.error('Failure:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
