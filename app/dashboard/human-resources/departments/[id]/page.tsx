import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import db from "@/lib/db";
import TabsSection from "./_components/TabsSection";
import Header from "./_components/Header";

interface DepartmentWithRelations {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  location: string | null;
  floor: string | null;
  building: string | null;
  manager: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  employees: { id: string }[];
  budgets: {
    totalAmount: number;
    items: {
      id: string;
      amount: number;
      spent: number;
      notes: string | null;
    }[];
    alerts: {
      id: string;
      type: string;
      threshold: number;
      triggered: boolean;
    }[];
  }[];
}

export default async function DepartmentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const department = await db.department.findUnique({
    where: { id: params.id },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      employees: {
        select: {
          id: true,
          avatar: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
        },
      },
      budgets: {
        select: {
          totalAmount: true,
          items: {
            select: {
              id: true,
              amount: true,
              spent: true,
              notes: true,
            },
          },
          alerts: {
            select: {
              id: true,
              type: true,
              threshold: true,
              triggered: true,
            },
          },
        },
      },
    },
  });

  if (!department) {
    return <div>Department not found</div>;
  }

  // Convert Decimal to number for client-side compatibility
  const serializedDepartment: DepartmentWithRelations = {
    ...department,
    budgets: department.budgets.map((budget) => ({
      ...budget,
      totalAmount: budget.totalAmount.toNumber(),
      items: budget.items.map((item) => ({
        ...item,
        amount: item.amount.toNumber(),
        spent: item.spent.toNumber(),
      })),
      alerts: budget.alerts.map((alert) => ({
        ...alert,
        threshold: alert.threshold.toNumber(),
      })),
    })),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header department={serializedDepartment} />

      <TabsSection department={serializedDepartment} />
    </div>
  );
}
