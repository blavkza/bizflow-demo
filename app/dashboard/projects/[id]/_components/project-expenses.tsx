import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Project, Expense } from "../type";
import { Plus, FileText, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { Decimal } from "@prisma/client/runtime/library";
import Link from "next/link";
import { UserRole } from "@prisma/client";

interface ProjectExpensesProps {
  project: Project;
  fetchProject: () => void;
  canViewFinancial?: boolean | null;
  currentUserRole: string | null;
  isManager: boolean;
}

export function ProjectExpenses({
  project,
  fetchProject,
  canViewFinancial,
  currentUserRole,
  isManager,
}: ProjectExpensesProps) {
  const expenses = project.Expense || [];

  const hasPermission =
    canViewFinancial || currentUserRole === "ADMIN" || isManager;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => {
    return sum + Number(expense.totalAmount || 0);
  }, 0);

  const totalPaid = expenses.reduce((sum, expense) => {
    return sum + Number(expense.paidAmount || 0);
  }, 0);

  const totalRemaining = expenses.reduce((sum, expense) => {
    return sum + Number(expense.remainingAmount || 0);
  }, 0);

  if (!hasPermission) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            You don't have permission to view financial information.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Expense Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              R {totalExpenses.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              R {totalPaid.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">
              R {totalRemaining.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Remaining Balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Expense Details</CardTitle>
            {/*  <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button> */}
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No expenses have been recorded for this project.
              </p>
              {/* <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Expense
              </Button> */}
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <Card
                  key={expense.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">
                              {expense.expenseNumber}
                            </h4>
                            <Badge
                              variant="secondary"
                              className={getStatusColor(expense.status)}
                            >
                              {expense.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getPriorityColor(expense.priority)}
                            >
                              {expense.priority}
                            </Badge>
                          </div>

                          <p className="text-sm">{expense.description}</p>

                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(
                                  new Date(expense.expenseDate),
                                  "MMM d, yyyy"
                                )}
                              </span>
                            </div>

                            {expense.vendor && (
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>{expense.vendor.name}</span>
                              </div>
                            )}

                            {expense.category && (
                              <Badge variant="outline">
                                {expense.category.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className="space-y-1">
                          <div className="text-lg font-semibold">
                            R {Number(expense.totalAmount).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Paid: R{" "}
                            {Number(expense.paidAmount).toLocaleString()}
                          </div>
                          <div className="text-sm text-amber-600">
                            Due: R{" "}
                            {Number(expense.remainingAmount).toLocaleString()}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Due:{" "}
                          {format(new Date(expense.dueDate), "MMM d, yyyy")}
                        </div>

                        <Link
                          href={`/dashboard/expeneses/${expense.id}`}
                          className="flex space-x-2 justify-end"
                        >
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
