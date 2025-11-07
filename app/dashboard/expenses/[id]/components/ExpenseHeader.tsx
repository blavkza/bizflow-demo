"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Expense } from "../types";
import { Download, Trash2, RefreshCw, Printer, Loader2 } from "lucide-react";
import RecordPaymentDialog from "./RecordPaymentDialog";
import { ExpenseReportGenerator } from "@/lib/ExpenseReportGenerator";
import { toast } from "sonner";
import { useCompanyInfo } from "@/hooks/use-company-info";

interface ExpenseHeaderProps {
  expense: Expense;
  onDelete: () => void;
  onRefresh: () => void;
}

export default function ExpenseHeader({
  expense,
  onDelete,
  onRefresh,
}: ExpenseHeaderProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const { companyInfo } = useCompanyInfo();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "default";
      case "PARTIAL":
        return "secondary";
      case "PENDING":
        return "outline";
      case "OVERDUE":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handlePrintReport = async () => {
    setIsPrinting(true);
    try {
      const expenseReportHTML =
        ExpenseReportGenerator.generateExpenseReportHTML(expense, companyInfo);

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(expenseReportHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error printing expense report:", error);
      toast.error("Failed to generate expense report");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">{expense.description}</CardTitle>
              <Badge variant={getStatusColor(expense.status)}>
                {expense.status}
              </Badge>
            </div>
            <CardDescription className="text-base">
              {expense.expenseNumber} •{" "}
              {expense.category?.name || "Uncategorized"} • Created:{" "}
              {new Date(expense.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              R{parseFloat(expense.totalAmount.toString()).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <RecordPaymentDialog
            expense={expense}
            onPaymentRecorded={onRefresh}
          />

          <Button
            variant="outline"
            onClick={handlePrintReport}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            {isPrinting ? "Printing..." : "Print"}
          </Button>

          {/*   <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button> */}
        </div>
      </CardHeader>
    </Card>
  );
}
