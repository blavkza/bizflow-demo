import WorkerProfile from "./_components/Worker-Profile";
import Stats from "./_components/Stats";
import PaymentHistory from "./_components/Payment-History";
import { Separator } from "@/components/ui/separator";
import db from "@/lib/db";
import { EmployeeWithDetails } from "@/types/employee";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getUserAuth } from "@/lib/auth";

export default async function WorkerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  // Fetch employee data
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

  const companySettingsData = await db.generalSetting.findFirst({
    select: {
      companyName: true,
      logo: true,
      Address: true,
      city: true,
      province: true,
      postCode: true,
      phone: true,
      email: true,
      taxId: true,
    },
  });

  if (!employee) {
    return <div>Employee not found</div>;
  }

  const companySettings = companySettingsData
    ? {
        companyName: companySettingsData.companyName,
        logo: companySettingsData.logo || undefined,
        address: companySettingsData.Address,
        city: companySettingsData.city,
        province: companySettingsData.province,
        postCode: companySettingsData.postCode,
        phone: companySettingsData.phone,
        email: companySettingsData.email,
        taxId: companySettingsData.taxId,
      }
    : undefined;

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
        <WorkerProfile employee={employeeWithDetails} />
        <Stats employee={employeeWithDetails} />
        <PaymentHistory
          employee={employeeWithDetails}
          companySettings={companySettings}
        />
      </div>
    </div>
  );
}
