"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, DollarSign, Users } from "lucide-react";

interface Employee {
  status: string;
  salary: number;
}

interface Department {
  id: string;
  name: string;
}

interface StatsCardProps {
  employees: Employee[];
  departments: Department[];
}

export default function StatsCard({ employees, departments }: StatsCardProps) {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(
    (emp) => emp.status === "ACTIVE"
  ).length;
  const averageSalary =
    employees.length > 0
      ? employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmployees}</div>
          <p className="text-xs text-muted-foreground">
            Across all departments
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Employees
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeEmployees}</div>
          <p className="text-xs text-muted-foreground">Currently working</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R
            {averageSalary.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-muted-foreground">Daily Average</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Departments</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{departments.length}</div>
          <p className="text-xs text-muted-foreground">Active departments</p>
        </CardContent>
      </Card>
    </div>
  );
}
