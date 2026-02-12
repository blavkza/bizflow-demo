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
  FileText,
  Wrench,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project } from "../type";
import {
  getStatusColor,
  getPriorityColor,
  formatProjectDates,
  getProjectTypeColor,
  getBillingTypeColor,
} from "../utils";
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

  const formatProjectType = (type: string) => {
    return type
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatBillingType = (type: string) => {
    return type
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Project Overview</CardTitle>

          <div className="flex gap-2">
            <div className="flex flex-wrap gap-2">
              {project.projectType && (
                <Badge
                  variant="outline"
                  className={getProjectTypeColor(project.projectType)}
                >
                  <FileText size={12} className="mr-1" />
                  {formatProjectType(project.projectType)}
                </Badge>
              )}
              {project.billingType && (
                <Badge
                  variant="outline"
                  className={getBillingTypeColor(project.billingType)}
                >
                  <DollarSign size={12} className="mr-1" />
                  {formatBillingType(project.billingType)}
                </Badge>
              )}
            </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 p-4">
          {/* Client */}
          {/* Client Info */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              Client
            </p>
            <div className="pl-6 text-sm">
              <p className="font-semibold truncate">
                {project.client?.company || "No Company"}
              </p>
              <p className="text-muted-foreground text-xs truncate">
                {project.client?.name || "No Client"}
              </p>
              {project.client?.email && (
                <p className="text-[10px] text-muted-foreground truncate italic">
                  {project.client.email}
                </p>
              )}
            </div>
          </div>

          {/* Project Manager/Lead */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <User size={16} className="text-primary" />
              Lead
            </p>
            <div className="pl-6 flex items-center gap-2">
              <Avatar className="w-6 h-6 border">
                <AvatarImage src={project.manager?.avatar || ""} />
                <AvatarFallback className="text-[10px]">
                  {project.manager?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium truncate">
                {project.manager?.name || "Unassigned"}
              </p>
            </div>
          </div>

          {/* Team Stack */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Team
            </p>
            <div className="pl-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  ...(project.assistantEmployees || []),
                  ...(project.assistantFreelancers || []),
                ]
                  .slice(0, 5)
                  .map((assistant, idx) => (
                    <Avatar
                      key={`ast-${idx}`}
                      className="w-6 h-6 border border-background"
                    >
                      <AvatarImage src={assistant.avatar || ""} />
                      <AvatarFallback className="text-[8px]">
                        {"name" in assistant
                          ? assistant.name[0]
                          : assistant.firstName[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                +
                {(project?.assistantEmployees?.length || 0) +
                  (project?.assistantFreelancers?.length || 0)}
              </p>
            </div>
          </div>

          {/* Timeline Info */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Timeline
            </p>
            <div className="pl-6">
              <p className="text-sm font-medium">
                {startDate} - {endDate}
              </p>
              {project.scheduledStartTime && (
                <p className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1 inline-block rounded">
                  Scheduled: {project.scheduledStartTime}
                </p>
              )}
            </div>
          </div>

          {/* Financials in one group or separate columns */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign size={16} className="text-green-600" />
              Budget & Billing
            </p>
            <div className="pl-6 space-y-1">
              <p className="text-sm font-semibold">
                R {project.budget?.toLocaleString() || "0"}
              </p>
              {invoiceTotal > 0 && (
                <p className="text-[10px] text-blue-600 flex items-center gap-1">
                  <Receipt size={10} />
                  Invoiced: R{invoiceTotal.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Tools Pillar */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Wrench size={16} className="text-primary" />
              Tools
            </p>
            <div className="pl-6">
              <p className="text-sm font-medium">
                {project.tools?.length || 0} Tools Assigned
              </p>
              {project.tools && project.tools.length > 0 && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {project.tools
                    .slice(0, 2)
                    .map((t) => t.name)
                    .join(", ")}
                  {project.tools.length > 2 ? "..." : ""}
                </p>
              )}
            </div>
          </div>
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
                0,
              ) || 0}
            </p>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
