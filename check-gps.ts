import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
      canCheckByGPS: true,
    },
  });
  console.log("Employees GPS Check Permission:");
  console.table(employees);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
