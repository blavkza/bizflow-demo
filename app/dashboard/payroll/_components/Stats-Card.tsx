"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, Users } from "lucide-react";
import { Employee } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

interface Payment {
  amount: Decimal;
  payDate: Date;
}

interface DepartmentManager {
  name: string;
}

interface Department {
  id: string;
  name: string;
  manager: DepartmentManager | null;
}

interface EmployeeWithDetails extends Employee {
  department: Department | null;
  payments: Payment[];
}

interface StatsCardProps {
  employees?: EmployeeWithDetails[];
}

export default function StatsCard({ employees = [] }: StatsCardProps) {
  const totalPayroll = employees.reduce(
    (sum, employee) =>
      employee?.status === "ACTIVE" ? sum + Number(employee?.salary || 0) : sum,
    0
  );

  const activeWorkers = employees.filter(
    (employee) => employee?.status === "ACTIVE"
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{employees.length}</div>
          <p className="text-xs text-muted-foreground">
            {activeWorkers} active workers
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Payroll</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R{totalPayroll.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Total expenses for{" "}
            <span className="text-green-500 font-bold">ACTIVE</span> employees
            per Day
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Payroll</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{"Not scheduled"}</div>
          <p className="text-xs text-muted-foreground">N/A days remaining</p>
        </CardContent>
      </Card>
    </div>
  );
}
