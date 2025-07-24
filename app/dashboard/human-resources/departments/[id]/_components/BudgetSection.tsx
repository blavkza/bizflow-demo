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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { BudgetItem, TabsSectionProps } from "@/types/department";

export default function BudgetSection({ department }: TabsSectionProps) {
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

  return (
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
                <SelectItem value="current">Current Financial Year</SelectItem>
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
        {department.budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 mb-6">
            No Budget in this department.
          </p>
        ) : (
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
                      <TableCell className="font-medium">{item.name}</TableCell>
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
                        {(item.allocated - item.spent).toLocaleString("en-ZA", {
                          style: "currency",
                          currency: "ZAR",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={utilization} className="h-2 w-20" />
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
        )}
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
                  <h3 className="text-sm font-medium">Budget Utilization</h3>
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
                  <h3 className="font-medium">Additional Training Budget</h3>
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
  );
}
