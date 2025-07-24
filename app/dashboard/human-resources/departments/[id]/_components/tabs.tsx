"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Users,
  DollarSign,
  Settings,
  Plus,
  PenLine,
} from "lucide-react";

interface BudgetItem {
  id: string;
  name: string;
  allocated: number;
  spent: number;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  manager: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  employees: {
    id: string;
    avatar: string | null;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
  }[];
  budgets: {
    id: string;
    name: string;
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

interface TabsSectionProps {
  department: Department;
}

export default function TabsSection({ department }: TabsSectionProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate total budget spent
  const totalBudget = department.budgets.reduce(
    (sum, budget) => sum + budget.totalAmount,
    0
  );

  const totalSpent = department.budgets.reduce(
    (sum, budget) =>
      sum + budget.items.reduce((itemSum, item) => itemSum + item.spent, 0),
    0
  );

  const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Transform budget items for display
  const budgetItems: BudgetItem[] = department.budgets.flatMap((budget) =>
    budget.items.map((item) => ({
      id: item.id,
      name: item.notes || "Unnamed Item",
      allocated: item.amount,
      spent: item.spent,
    }))
  );

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            Employees
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            Budget
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Department Information</CardTitle>
                <CardDescription>
                  Basic information about the department
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Description
                  </h3>
                  <p>{department.description || "No description provided"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Manager
                    </h3>
                    <p>{department.manager?.name || "No manager assigned"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Employees
                    </h3>
                    <p>{department.employees.length}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Created
                    </h3>
                    <p>{formatDate(department.createdAt)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Location
                    </h3>
                    <p>{department.location || "No location specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
                <CardDescription>
                  Current budget status and allocation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Budget Utilization</h3>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(budgetProgress)}%
                    </p>
                  </div>
                  <Progress value={budgetProgress} className="h-2 mt-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Total Budget
                    </h3>
                    <p className="text-lg font-semibold">
                      {totalBudget.toLocaleString("en-ZA", {
                        style: "currency",
                        currency: "ZAR",
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Spent
                    </h3>
                    <p className="text-lg font-semibold">
                      {totalSpent.toLocaleString("en-ZA", {
                        style: "currency",
                        currency: "ZAR",
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Remaining
                    </h3>
                    <p className="text-lg font-semibold">
                      {(totalBudget - totalSpent).toLocaleString("en-ZA", {
                        style: "currency",
                        currency: "ZAR",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest activities in the department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">New employee added</p>
                    <p className="text-sm text-muted-foreground">
                      {department.employees.length > 0
                        ? `${department.employees[0].firstName} ${department.employees[0].lastName} joined as ${department.employees[0].position}`
                        : "No recent employee activity"}
                    </p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-green-100 p-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Budget updated</p>
                    <p className="text-sm text-muted-foreground">
                      Budget last updated on {formatDate(new Date())}
                    </p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-amber-100 p-2">
                    <PenLine className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Department updated</p>
                    <p className="text-sm text-muted-foreground">
                      {department.manager?.name
                        ? `Modified by ${department.manager.name}`
                        : "Modified by system"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {department.createdAt === department.updatedAt
                        ? "No updates have been made"
                        : formatDate(department.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Budget Allocation</CardTitle>
                <CardDescription>
                  Manage department budget and expenses
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="current">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">
                      Current Financial Year
                    </SelectItem>
                    <SelectItem value="previous">
                      Previous Financial Year
                    </SelectItem>
                    <SelectItem value="next">Next Financial Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Budget Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Budget Item</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetItems.map((item) => {
                    const utilization = (item.spent / item.allocated) * 100;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell>
                          {item.allocated.toLocaleString("en-ZA", {
                            style: "currency",
                            currency: "ZAR",
                          })}
                        </TableCell>
                        <TableCell>
                          {item.spent.toLocaleString("en-ZA", {
                            style: "currency",
                            currency: "ZAR",
                          })}
                        </TableCell>
                        <TableCell>
                          {(item.allocated - item.spent).toLocaleString(
                            "en-ZA",
                            {
                              style: "currency",
                              currency: "ZAR",
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={utilization}
                              className="h-2 w-20"
                            />
                            <span className="text-sm">
                              {Math.round(utilization)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget Summary</CardTitle>
                <CardDescription>Overall budget status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Total Budget</h3>
                    <p className="text-2xl font-bold">
                      {totalBudget.toLocaleString("en-ZA", {
                        style: "currency",
                        currency: "ZAR",
                      })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Spent
                      </h3>
                      <p className="text-lg font-semibold">
                        {totalSpent.toLocaleString("en-ZA", {
                          style: "currency",
                          currency: "ZAR",
                        })}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Remaining
                      </h3>
                      <p className="text-lg font-semibold">
                        {(totalBudget - totalSpent).toLocaleString("en-ZA", {
                          style: "currency",
                          currency: "ZAR",
                        })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        Budget Utilization
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(budgetProgress)}%
                      </p>
                    </div>
                    <Progress value={budgetProgress} className="h-2 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Requests</CardTitle>
                <CardDescription>
                  Pending budget adjustment requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        Additional Training Budget
                      </h3>
                      <Badge>Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Request for R50,000 additional training budget
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs text-muted-foreground">
                        Requested by: {department.manager?.name || "Unknown"}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Reject
                        </Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Software License Budget</h3>
                      <Badge>Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Request for R25,000 additional software license budget
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs text-muted-foreground">
                        Requested by:{" "}
                        {department.employees[0]
                          ? `${department.employees[0].firstName} ${department.employees[0].lastName}`
                          : "Unknown"}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Reject
                        </Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Settings</CardTitle>
              <CardDescription>Manage department configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dept-name">Department Name</Label>
                    <Input id="dept-name" defaultValue={department.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-manager">Department Manager</Label>
                    <Input
                      id="dept-manager"
                      defaultValue={department.manager?.name || "No manager"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-location">Location</Label>
                    <Input
                      id="dept-location"
                      defaultValue={department.location || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-status">Status</Label>
                    <Select defaultValue={department.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dept-description">Description</Label>
                    <Textarea
                      id="dept-description"
                      defaultValue={department.description || ""}
                      rows={4}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">
                    Department Permissions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="perm-budget"
                        className="rounded border-gray-300"
                        defaultChecked
                      />
                      <Label htmlFor="perm-budget">Budget Management</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="perm-employees"
                        className="rounded border-gray-300"
                        defaultChecked
                      />
                      <Label htmlFor="perm-employees">
                        Employee Management
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="perm-reports"
                        className="rounded border-gray-300"
                        defaultChecked
                      />
                      <Label htmlFor="perm-reports">Report Access</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="perm-settings"
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="perm-settings">Settings Access</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for this department
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h3 className="font-medium text-red-800">Archive Department</h3>
                <p className="text-sm text-red-600 mt-1">
                  This will archive the department and make it inactive. All
                  employees will need to be reassigned.
                </p>
                <div className="mt-4">
                  <Button variant="destructive">Archive Department</Button>
                </div>
              </div>

              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h3 className="font-medium text-red-800">Delete Department</h3>
                <p className="text-sm text-red-600 mt-1">
                  This action cannot be undone. All department data will be
                  permanently deleted.
                </p>
                <div className="mt-4">
                  <Button variant="destructive">Delete Department</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
