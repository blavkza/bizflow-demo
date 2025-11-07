"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Calendar,
  DollarSign,
  Receipt,
  User,
  Users,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project } from "../type";
import { getStatusColor, getPriorityColor, formatProjectDates } from "../utils";
import { teamMembers } from "@/lib/data";

interface ProjectOverviewProps {
  project: Project;
  projectStatus: string | null;
  projectProgress: number;
  budgetUsedPercentage: number;
  invoiceTotal: number;
}

export function ProjectOverview({
  project,
  projectStatus,
  projectProgress,
  budgetUsedPercentage,
  invoiceTotal,
}: ProjectOverviewProps) {
  const { startDate, endDate } = formatProjectDates(project);

  // Calculate total expenses from all invoices in the project
  const calculateProjectExpenses = () => {
    if (!project.invoices || project.invoices.length === 0) {
      return {
        totalExpenses: 0,
        isOverBudget: false,
        remainingBudget: project.budget || 0,
      };
    }

    const totalExpenses = project.invoices.reduce((sum, invoice) => {
      const invoiceExpenses =
        invoice.Expense?.reduce((expenseSum, expense) => {
          return expenseSum + Number(expense.totalAmount || 0);
        }, 0) || 0;
      return sum + invoiceExpenses;
    }, 0);

    const projectBudget = project.budget || 0;
    const remainingBudget = projectBudget - totalExpenses;
    const isOverBudget = remainingBudget < 0;

    return {
      totalExpenses,
      remainingBudget,
      isOverBudget,
      budgetUtilization:
        projectBudget > 0 ? (totalExpenses / projectBudget) * 100 : 0,
    };
  };

  const { totalExpenses, remainingBudget, isOverBudget, budgetUtilization } =
    calculateProjectExpenses();
  const projectBudget = project.budget || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Project Overview</CardTitle>
          <div className="flex gap-2">
            <Badge className={`${getStatusColor(projectStatus)} text-white`}>
              {projectStatus}
            </Badge>
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority} PRIORITY
            </Badge>
            {isOverBudget && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Over Budget
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4">
          {/* Client */}
          <div className="flex items-center gap-3">
            <Building2 className="text-primary" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="text-sm font-medium">
                {project.client?.name || "No client"}
              </p>
            </div>
          </div>

          {/* Project Manager */}
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 border-2 border-background">
              {project.manager?.avatar ? (
                <AvatarImage
                  src={project.manager?.avatar}
                  alt={`${project.manager?.name}`}
                />
              ) : (
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Project Manager</p>
              <p className="text-sm font-medium">
                {project.manager?.name || "Unassigned"}
              </p>
            </div>
          </div>

          {/* Team Size */}
          <div className="flex items-center gap-3">
            <Users className="text-primary" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Team Size</p>
              <p className="text-sm font-medium">
                {(project?.teamMembers?.length || 0) + 1}{" "}
                {project?.teamMembers?.length === 0 ? "Member" : "Members"}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-3">
            <Calendar className="text-primary" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Timeline</p>
              <p className="text-sm font-medium">
                {startDate} - {endDate}
              </p>
            </div>
          </div>

          {/* Total Budget */}
          {project.budget && (
            <div className="flex items-center gap-3">
              <DollarSign className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-sm font-medium">
                  R {project.budget?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          )}

          {/* Total Invoiced */}
          {project.invoices && project.invoices.length > 0 && (
            <div className="flex items-center gap-3">
              <Receipt className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Total Invoiced</p>
                <p className="text-sm font-medium">
                  R {invoiceTotal?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-lg">Expense Tracking</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Amount Spent */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Spent</span>
                <span className="font-semibold text-orange-600">
                  R{totalExpenses.toLocaleString()}
                </span>
              </div>
              <Progress value={budgetUtilization} className="h-2" />
            </div>

            {/* Remaining Budget */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining Budget</span>
                <span
                  className={`font-semibold ${
                    isOverBudget ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {isOverBudget ? "-" : ""}R
                  {Math.abs(remainingBudget).toLocaleString()}
                </span>
              </div>
              {budgetUtilization && (
                <div className="text-xs text-muted-foreground">
                  {budgetUtilization.toFixed(1)}% of budget utilized
                </div>
              )}
            </div>

            {/* Budget Status */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget Status</span>
                <Badge
                  variant={isOverBudget ? "destructive" : "outline"}
                  className={
                    isOverBudget
                      ? ""
                      : "bg-green-500/10 text-green-600 border-green-200"
                  }
                >
                  {isOverBudget ? "Over Budget" : "Within Budget"}
                </Badge>
              </div>
              {isOverBudget && (
                <div className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Exceeded by R{Math.abs(remainingBudget).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Budget Breakdown */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between p-2 bg-background rounded">
              <span>Total Budget:</span>
              <span className="font-medium">
                R{projectBudget.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-background rounded">
              <span>Amount Spent:</span>
              <span className="font-medium text-orange-600">
                R{totalExpenses.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Project Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Project Progress</span>
            <span className="font-medium">{projectProgress}%</span>
          </div>
          <Progress value={projectProgress} className="h-3" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {project.tasks?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {project.tasks?.filter((task) => task.status === "COMPLETED")
                .length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Completed Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {project.invoices?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Invoices</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {project.invoices?.reduce(
                (count, invoice) => count + (invoice.Expense?.length || 0),
                0
              ) || 0}
            </p>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
