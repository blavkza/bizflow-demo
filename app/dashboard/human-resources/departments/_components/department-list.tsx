"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Department, User } from "@prisma/client";

export interface DepartmentWithRelations extends Department {
  manager: User | null;
  employees: { id: string }[];
  budgets: { totalAmount: number }[];
}

interface DepartmentListProps {
  departments: DepartmentWithRelations[];
}

export default function DepartmentList({ departments }: DepartmentListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description &&
        dept.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (dept.manager &&
        dept.manager.name &&
        dept.manager.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Department Management</CardTitle>
          <CardDescription>
            Manage your organization's departments, budgets, and personnel.
          </CardDescription>
          <div className="flex items-center gap-2 pt-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              className="h-9 md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Employees</TableHead>
                {/*  <TableHead>Budget (ZAR)</TableHead> */}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((dept) => {
                const totalBudget =
                  dept.budgets?.reduce(
                    (sum, budget) => sum + (Number(budget.totalAmount) || 0),
                    0
                  ) || 0;

                return (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{dept.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {dept.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dept.manager ? dept.manager.name : "No manager"}
                    </TableCell>
                    <TableCell>{dept.employees?.length || 0}</TableCell>
                    {/*   <TableCell>
                      {totalBudget.toLocaleString("en-ZA", {
                        style: "currency",
                        currency: "ZAR",
                      })}
                    </TableCell> */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          dept.status === "ACTIVE"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {dept.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/dashboard/human-resources/departments/${dept.id}`}
                        >
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
