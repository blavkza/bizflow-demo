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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState("employees");

  const totalTeamMembers =
    department.employees.length + department.freelancers.length;

  return (
    <TabsContent value="employees" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members ({totalTeamMembers})</CardTitle>
            <CardDescription>
              Manage employees and freelancers in this department
            </CardDescription>
          </div>
          {(canCreateEmployees || hasFullAccess) && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Team Member</DialogTitle>
                  <DialogDescription>
                    Enter the team member's information to add them to your
                    department.
                  </DialogDescription>
                </DialogHeader>
                <EmployeeForm
                  type="create"
                  data={{ departmentId }}
                  onCancel={() => setIsAddDialogOpen(false)}
                  onSubmitSuccess={() => {
                    setIsAddDialogOpen(false);
                    router.refresh();
                    fetchDepartment();
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="employees">
                Employees ({department.employees.length})
              </TabsTrigger>
              <TabsTrigger value="freelancers">
                Freelancers ({department.freelancers.length})
              </TabsTrigger>
            </TabsList>

            {/* Employees Tab */}
            <TabsContent value="employees" className="space-y-4">
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
                      <TableHead>Salary</TableHead>
                      <TableHead>Salary Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {department.employees.map((employee) => (
                      <TableRow
                        key={employee.id}
                        className="cursor-pointer"
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
                        <TableCell>
                          R{" "}
                          {employee.salaryType === "DAILY"
                            ? employee.dailySalary?.toLocaleString() || "0"
                            : employee.monthlySalary?.toLocaleString() || "0"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              employee.salaryType === "DAILY"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {employee.salaryType === "DAILY"
                              ? "Daily"
                              : "Monthly"}
                          </span>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Employee
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Freelancers Tab */}
            <TabsContent value="freelancers" className="space-y-4">
              {department.freelancers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No freelancers in this department.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Freelancer</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Salary Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {department.freelancers.map((freelancer) => (
                      <TableRow
                        key={freelancer.id}
                        className="cursor-pointer"
                        onClick={() =>
                          (canViewEmployees || hasFullAccess) &&
                          router.push(
                            `/dashboard/human-resources/freelancers/${freelancer.id}`
                          )
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={freelancer.avatar || "/placeholder.svg"}
                                alt={`${freelancer.firstName} ${freelancer.lastName}`}
                              />
                              <AvatarFallback>
                                {`${freelancer.firstName.charAt(0)}${freelancer.lastName.charAt(0)}`}
                              </AvatarFallback>
                            </Avatar>
                            <div>{`${freelancer.firstName} ${freelancer.lastName}`}</div>
                          </div>
                        </TableCell>
                        <TableCell>{freelancer.position}</TableCell>
                        <TableCell>
                          R {freelancer.salary?.toLocaleString() || "0"}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Monthly
                          </span>
                        </TableCell>
                        <TableCell>{freelancer.email}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              freelancer.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {freelancer.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Freelancer
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
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
              {[...department.employees, ...department.freelancers]
                .filter(
                  (member) =>
                    !department.manager ||
                    `${member.firstName} ${member.lastName}` !==
                      department.manager.name
                )
                .slice(0, 3)
                .map((member) => (
                  <div
                    key={member.id}
                    className="p-4 border rounded-lg text-center"
                  >
                    <p className="font-medium">
                      {`${member.firstName} ${member.lastName}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.position}
                    </p>
                    <div className="flex flex-col gap-1 mt-2">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          "salaryType" in member
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {"salaryType" in member ? "Employee" : "Freelancer"}
                      </span>
                      {"salaryType" in member && (
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs ${
                            member.salaryType === "DAILY"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {member.salaryType === "DAILY" ? "Daily" : "Monthly"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
