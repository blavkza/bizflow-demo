import db from "@/lib/db";
import Header from "./_components/Header";
import StatsCard from "./_components/Stats-Card";
import TabsSection from "./_components/TabsSection";
import { EmployeeWithDetails } from "@/types/employee";

export default async function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = await params.id;

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      department: {
        select: {
          id: true,
          name: true,
          manager: {
            select: {
              name: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          payDate: true,
          type: true,
          status: true,
          description: true,
        },
        orderBy: {
          payDate: "desc",
        },
      },
    },
  });

  if (!employee) {
    return <div>Employee not found</div>;
  }

  const employeeWithDetails: EmployeeWithDetails = {
    ...employee,
    payments: employee.payments?.map((payment) => ({
      ...payment,
      amount: payment.amount.toNumber(),
    })),
  };

  return (
    <div className="space-y-4">
      <Header employee={employeeWithDetails} />
      <StatsCard employee={employeeWithDetails} />
      <TabsSection employee={employeeWithDetails} />
    </div>
  );
}
