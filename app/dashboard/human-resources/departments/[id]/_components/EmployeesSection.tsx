"use client";

import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { Department } from "@/types/department";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import EmployeeForm from "../../../employees/_components/employee-Form";
import { useState } from "react";
import { Employee } from "@prisma/client";

interface EmployeesSectionProps {
  department: Department;
  canCreateEmployees: boolean;
  canViewEmployees: boolean;
  hasFullAccess: boolean;
  fetchDepartment: () => void;
  departmentId: string;
}

export default function EmployeesSection({
  department,
  canCreateEmployees,
  canViewEmployees,
  hasFullAccess,
  fetchDepartment,
  departmentId,
}: EmployeesSectionProps) {
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <TabsContent value="employees" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Department Employees</CardTitle>
            <CardDescription>
              Manage employees in this department
            </CardDescription>
          </div>
          {(canCreateEmployees || hasFullAccess) && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Enter the employee's information to add them to your team.
                  </DialogDescription>
                </DialogHeader>
                <EmployeeForm
                  type="create"
                  data={{ departmentId }}
                  onCancel={() => setIsAddDialogOpen(false)}
                  onSubmitSuccess={() => {
                    setIsAddDialogOpen(false);
                    router.refresh();
                    fetchDepartment;
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {department.employees.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No employees in this department.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Daily Rate</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {department.employees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="cursor-pointer "
                    onClick={() =>
                      (canViewEmployees || hasFullAccess) &&
                      router.push(
                        `/dashboard/human-resources/employees/${employee.id}`
                      )
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={employee.avatar || "/placeholder.svg"}
                            alt={`${employee.firstName} ${employee.lastName}`}
                          />
                          <AvatarFallback>
                            {`${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>{`${employee.firstName} ${employee.lastName}`}</div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>R {employee.salary.toLocaleString()}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Structure</CardTitle>
          <CardDescription>
            Department hierarchy and reporting lines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 border rounded-lg w-64 text-center">
              <p className="font-medium">
                {department.manager?.name || "No manager"}
              </p>
              <p className="text-sm text-muted-foreground">
                Department Manager
              </p>
            </div>
            <div className="h-6 w-px bg-border"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {department.employees
                .filter(
                  (emp) =>
                    !department.manager ||
                    `${emp.firstName} ${emp.lastName}` !==
                      department.manager.name
                )
                .slice(0, 3)
                .map((employee) => (
                  <div
                    key={employee.id}
                    className="p-4 border rounded-lg text-center"
                  >
                    <p className="font-medium">
                      {`${employee.firstName} ${employee.lastName}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {employee.position}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
