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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Expense } from "../types";
import { useState } from "react";
import { PaginationControls } from "@/components/PaginationControls";

interface ExpensesTableProps {
  expenses: Expense[];
}

export default function ExpensesTable({ expenses }: ExpensesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate pagination
  const totalItems = expenses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = expenses.slice(startIndex, endIndex);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-orange-600";
      case "LOW":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Records</CardTitle>
        <CardDescription>
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
          {totalItems} expenses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Expense Date</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {expense.expenseNumber}
                </TableCell>
                <TableCell>
                  {expense.Vendor?.name || "Unknown Vendor"}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {expense.category?.name || "NA"}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(expense.expenseDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right font-medium">
                  R{expense.totalAmount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  R{expense.paidAmount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-orange-600">
                  R{expense.remainingAmount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(expense.status)}>
                    {expense.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(expense.dueDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <span
                    className={`font-medium ${getPriorityColor(expense.priority)}`}
                  >
                    {expense.priority}
                  </span>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/expenses/${expense.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6">
          <PaginationControls
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onItemsPerPageChange={handleItemsPerPageChange}
            onPageChange={handlePageChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
