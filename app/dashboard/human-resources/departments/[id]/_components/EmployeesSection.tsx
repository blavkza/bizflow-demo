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
import { TabsSectionProps } from "@/types/department";

export default function EmployeesSection({ department }: TabsSectionProps) {
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
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
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {department.employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={employee.avatar || "/placeholder.svg"}
                            alt={`${employee.firstName} ${employee.lastName}`}
                          />
                          <AvatarFallback>
                            {`${employee.firstName.charAt(
                              0
                            )}${employee.lastName.charAt(0)}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>{`${employee.firstName} ${employee.lastName}`}</div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
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
