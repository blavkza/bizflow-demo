"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, User, FileText, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: string | null;
  data: any;
}

export function DetailDialog({
  open,
  onOpenChange,
  type,
  data,
}: DetailDialogProps) {
  if (!type) return null;

  const getDialogContent = () => {
    switch (type) {
      case "financial-summary":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Invoices</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">
                      {data?.financialSummary?.totalInvoices || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      {data?.financialSummary?.paidInvoices || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Unpaid:</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {data?.financialSummary?.unpaidInvoices || 0}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Expenses</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">
                      {data?.financialSummary?.totalExpenses || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      {data?.financialSummary?.paidExpenses || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Unpaid:</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {data?.financialSummary?.unpaidExpenses || 0}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "project-summary":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Active",
                  value: data?.projectSummary?.activeProjects,
                  color: "blue",
                },
                {
                  label: "Completed",
                  value: data?.projectSummary?.completedProjects,
                  color: "green",
                },
                {
                  label: "Pending",
                  value: data?.projectSummary?.pendingProjects,
                  color: "yellow",
                },
                {
                  label: "Overdue",
                  value: data?.projectSummary?.overdueProjects,
                  color: "red",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-3 border rounded-lg"
                >
                  <div className={`text-2xl font-bold text-${item.color}-600`}>
                    {item.value || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "task-summary":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Total",
                  value: data?.taskSummary?.totalTasks,
                  color: "gray",
                },
                {
                  label: "Completed",
                  value: data?.taskSummary?.completedTasks,
                  color: "green",
                },
                {
                  label: "In Progress",
                  value: data?.taskSummary?.inProgressTasks,
                  color: "blue",
                },
                {
                  label: "Overdue",
                  value: data?.taskSummary?.overdueTasks,
                  color: "red",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-3 border rounded-lg"
                >
                  <div className="text-2xl font-bold">{item.value || 0}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>No details available for {type}</div>;
    }
  };

  const getTitle = () => {
    const titles = {
      "financial-summary": "Financial Details",
      "project-summary": "Project Details",
      "task-summary": "Task Details",
      "employee-summary": "Employee Details",
      "freelancer-summary": "Freelancer Details",
    };
    return titles[type as keyof typeof titles] || "Details";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            Detailed overview of {type.replace("-", " ")}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">{getDialogContent()}</div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onOpenChange(false)}>Export Report</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
