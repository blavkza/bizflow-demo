"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Eye,
  Receipt,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { Invoice, Project } from "../type";
import Link from "next/link";

interface InvoiceListProps {
  project: Project;
}

export function InvoiceList({ project }: InvoiceListProps) {
  console.log(project.invoices);

  const calculateInvoiceStats = (invoice: Invoice) => {
    // Calculate total expenses for this invoice
    const totalExpenses =
      invoice.Expense?.reduce((sum, expense) => {
        return sum + Number(expense.totalAmount || 0);
      }, 0) || 0;

    const invoiceAmount = invoice.totalAmount || 0;
    const remainingAmount = invoiceAmount - totalExpenses;
    const spentPercentage =
      invoiceAmount > 0 ? (totalExpenses / invoiceAmount) * 100 : 0;

    const isOverBudget = remainingAmount < 0;
    const overBudgetAmount = isOverBudget ? Math.abs(remainingAmount) : 0;

    return {
      totalExpenses,
      remainingAmount,
      spentPercentage,
      isOverBudget,
      overBudgetAmount,
    };
  };

  const getProgressColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return "bg-red-500";
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-orange-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getAmountColor = (amount: number, isOverBudget: boolean) => {
    if (isOverBudget) return "text-destructive font-semibold";
    if (amount < 0) return "text-destructive";
    if (amount === 0) return "text-muted-foreground";
    return "text-green-600";
  };

  return (
    <div className="space-y-4">
      {project.invoices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No invoices found for this project.</p>
        </div>
      ) : (
        project.invoices.map((invoice) => {
          const {
            totalExpenses,
            remainingAmount,
            spentPercentage,
            isOverBudget,
            overBudgetAmount,
          } = calculateInvoiceStats(invoice);

          const progressColor = getProgressColor(spentPercentage, isOverBudget);
          const amountColor = getAmountColor(remainingAmount, isOverBudget);

          return (
            <Card
              key={invoice.id}
              className={`bg-gradient-to-br from-card to-card/80 border-border/50 hover:shadow-md transition-shadow ${
                isOverBudget ? "border-destructive/20" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isOverBudget ? "bg-destructive/10" : "bg-primary/10"
                        }`}
                      >
                        <Receipt
                          className={`h-5 w-5 ${
                            isOverBudget ? "text-destructive" : "text-primary"
                          }`}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">
                          {invoice.invoiceNumber}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={
                              invoice.status === "PAID"
                                ? "bg-green-500/10 text-green-600 border-green-200"
                                : invoice.status === "OVERDUE"
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : "bg-warning/10 text-warning border-warning/20"
                            }
                          >
                            {invoice.status}
                          </Badge>
                          {isOverBudget && (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Over Budget
                            </Badge>
                          )}
                          {invoice.Expense && invoice.Expense.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-500/10 text-blue-600"
                            >
                              {invoice.Expense.length} expense
                              {invoice.Expense.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span>Issued:</span>
                        <span className="font-medium">
                          {invoice.issueDate
                            ? format(new Date(invoice.issueDate), "MMM d, yyyy")
                            : "N/A"}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>Due:</span>
                        <span className="font-medium">
                          {invoice.dueDate
                            ? format(new Date(invoice.dueDate), "MMM d, yyyy")
                            : "N/A"}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      R{invoice.totalAmount?.toLocaleString() || "0"}
                    </div>
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Expense Progress Section */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Budget Utilization</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-green-600 font-semibold">
                        R{totalExpenses.toLocaleString()} spent
                      </span>
                      <span className={amountColor}>
                        {isOverBudget
                          ? `-R${overBudgetAmount.toLocaleString()} over`
                          : `R${remainingAmount.toLocaleString()} remaining`}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {isOverBudget ? "100%" : `${spentPercentage.toFixed(1)}%`}{" "}
                      utilized
                      {isOverBudget && " (Over Budget)"}
                    </span>
                    <span>
                      Total: R{invoice.totalAmount?.toLocaleString() || "0"}
                    </span>
                  </div>

                  {/* Over Budget Warning */}
                  {isOverBudget && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Over Budget</span>
                      </div>
                      <p className="text-destructive text-xs mt-1">
                        Expenses exceed invoice amount by R
                        {overBudgetAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Recent Expenses Preview */}
                {invoice.Expense && invoice.Expense.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Recent Expenses
                    </h5>
                    <div className="space-y-2">
                      {invoice.Expense.slice(0, 3).map((expense) => (
                        <div
                          key={expense.id}
                          className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded"
                        >
                          <span className="truncate flex-1">
                            {expense.description || "Expense"}
                          </span>
                          <span className="font-medium text-destructive ml-2">
                            R{expense.totalAmount?.toLocaleString() || "0"}
                          </span>
                        </div>
                      ))}
                      {invoice.Expense.length > 3 && (
                        <div className="text-center text-xs text-muted-foreground pt-2">
                          +{invoice.Expense.length - 3} more expenses
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
