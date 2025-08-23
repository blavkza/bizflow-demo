"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Briefcase, Users, DollarSign, PenLine } from "lucide-react";

import { TabsContent } from "@/components/ui/tabs";
import { TabsSectionProps } from "@/types/department";

export default function OverviewSection({ department }: TabsSectionProps) {
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

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <TabsContent value="overview" className="space-y-4">
      <div className="grid grid-cols-1  gap-4">
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

        {/*   <Card>
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
        </Card> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest activities in the department</CardDescription>
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
            {/*    <div className="flex items-start gap-4">
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
            </div> */}
            {/* <div className="flex items-start gap-4">
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
            </div> */}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
