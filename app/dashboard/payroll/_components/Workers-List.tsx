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
import { useRouter } from "next/navigation";

interface WorkersListProps {
  employees: EmployeeWithDetails[];
  canViewEmployee: boolean;
  hasFullAccess: boolean;
}

export default function WorkersList({
  employees,
  canViewEmployee,
  hasFullAccess,
}: WorkersListProps) {
  const router = useRouter();
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow
                key={employee.id}
                onClick={() => {
                  if (canViewEmployee || hasFullAccess) {
                    router.push(`/dashboard/payroll/${employee.id}`);
                  }
                }}
                className=" cursor-pointer"
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
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
                  </div>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
