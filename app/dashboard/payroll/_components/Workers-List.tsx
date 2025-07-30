// app/_components/WorkersList.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeWithDetails } from "@/types/payroll";
import Link from "next/link";

interface WorkersListProps {
  employees: EmployeeWithDetails[];
}

export default function WorkersList({ employees }: WorkersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Directory</CardTitle>
        <CardDescription>
          Manage employee information and payroll details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Daily Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/payroll/${employee.id}`}
                    className="flex items-center space-x-3"
                  >
                    <Avatar>
                      <AvatarImage
                        src={employee.avatar || "/placeholder.svg"}
                        alt={`${employee.firstName} ${employee.lastName}`}
                      />
                      <AvatarFallback>
                        {`${employee.firstName?.[0] || ""}${
                          employee.lastName?.[0] || ""
                        }`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{`${employee.firstName} ${employee.lastName}`}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.email}
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.department?.name || "N/A"}</TableCell>
                <TableCell>
                  R{Number(employee.salary).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      employee.status === "ACTIVE" ? "default" : "secondary"
                    }
                  >
                    {employee.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {employee.hireDate
                    ? new Date(employee.hireDate).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Link
                      href={`/dashboard/payroll/${employee.id}`}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
