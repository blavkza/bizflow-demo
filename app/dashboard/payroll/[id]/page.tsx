import WorkerProfile from "./_components/Worker-Profile";
import Stats from "./_components/Stats";
import PaymentHistory from "./_components/Payment-History";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import db from "@/lib/db";
import { EmployeeWithDetails } from "@/types/employee";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function WorkerDetailPage({
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
    <div className="p-6">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <Link href="/dashboard/payroll">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Worker Profile */}
        <WorkerProfile employee={employeeWithDetails} />

        {/* Worker Information & Stats */}
        <Stats employee={employeeWithDetails} />

        {/* Payment History */}
        <PaymentHistory employee={employeeWithDetails} />
      </div>
    </div>
  );
}
