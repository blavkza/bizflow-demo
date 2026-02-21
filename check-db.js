const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.trainee.count();
  console.log(`Total trainees: ${count}`);
  const trainees = await prisma.trainee.findMany({ take: 5 });
  console.log('Sample trainees:', JSON.stringify(trainees, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

