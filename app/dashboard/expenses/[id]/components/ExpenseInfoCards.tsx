import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense } from "../types";
import { FileText, Building, CreditCard, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExpenseInfoCardsProps {
  expense: Expense;
}

export default function ExpenseInfoCards({ expense }: ExpenseInfoCardsProps) {
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

  console.log(expense);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {/* Expense Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">
            Expense Information
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Expense Date:</span>
            <span className="text-sm font-medium">
              {new Date(expense.expenseDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Due Date:</span>
            <span className="text-sm font-medium">
              {new Date(expense.dueDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Priority:</span>
            <Badge variant="outline">{expense.priority}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={getStatusColor(expense.status)}>
              {expense.status}
            </Badge>
          </div>
          {expense.paidDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Paid Date:</span>
              <span className="text-sm font-medium">
                {new Date(expense.paidDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendor Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">Vendor Details</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Name:</span>
            <span className="text-sm font-medium">
              {expense.Vendor?.name || "Unknown Vendor"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Email:</span>
            <span className="text-sm font-medium text-blue-600 truncate max-w-[150px]">
              {expense.vendorEmail || expense.Vendor?.email || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Phone:</span>
            <span className="text-sm font-medium">
              {expense.vendorPhone || expense.Vendor?.phone || "N/A"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Accounting Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">Accounting</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Account Code:</span>
            <span className="text-sm font-medium">
              {expense.accountCode || "N/A"}
            </span>
          </div> */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Project:</span>
            <span className="text-sm font-medium">
              {expense.Project?.title || expense.projectCode || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Invoice:</span>
            <span className="text-sm font-medium">
              {expense.Invoice?.invoiceNumber || "N/A"}
            </span>
          </div>
          {expense.paymentMethod && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Payment Method:
              </span>
              <span className="text-sm font-medium">
                {expense.paymentMethod}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">Notes</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {expense.notes || "No notes available for this expense."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
