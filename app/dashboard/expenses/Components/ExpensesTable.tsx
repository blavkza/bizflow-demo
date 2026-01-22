"use client";

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
import { Eye, MoreVertical, Trash2, Pencil, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Expense, ComboboxOption } from "../types";
import { useState } from "react";
import { PaginationControls } from "@/components/PaginationControls";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddExpenseDialog from "./AddExpenseDialog";

interface ExpensesTableProps {
  expenses: Expense[];
  categoriesOptions: ComboboxOption[];
  vendorsOptions: ComboboxOption[];
  vendorsData: any[];
  onExpenseDeleted?: () => void;
  onExpenseUpdated?: () => void;
}

export default function ExpensesTable({
  expenses,
  categoriesOptions,
  vendorsOptions,
  vendorsData,
  onExpenseDeleted,
  onExpenseUpdated,
}: ExpensesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [invoicesOptions, setInvoicesOptions] = useState<ComboboxOption[]>([]);
  const [projectsOptions, setProjectsOptions] = useState<ComboboxOption[]>([]);

  const router = useRouter();

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

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    fetchInvoicesAndProjects();
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleViewExpense = (expense: Expense, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/expenses/${expense.id}`);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      setIsDeleting(true);
      await axios.delete(`/api/expenses/${expenseToDelete.id}`);
      toast.success("Expense deleted successfully");
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
      onExpenseDeleted?.();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchInvoicesAndProjects = async () => {
    try {
      const [invoicesRes, projectsRes] = await Promise.all([
        axios.get("/api/invoices"),
        axios.get("/api/projects"),
      ]);

      setInvoicesOptions(
        invoicesRes.data?.map((invoice: any) => ({
          label: invoice.invoiceNumber,
          value: invoice.id,
        })) || []
      );

      setProjectsOptions(
        projectsRes.data?.map((project: any) => ({
          label: project.title,
          value: project.id,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      setInvoicesOptions([]);
      setProjectsOptions([]);
    }
  };

  return (
    <>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentExpenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900"
                  onClick={() =>
                    router.push(`/dashboard/expenses/${expense.id}`)
                  }
                >
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
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleViewExpense(
                                expense,
                                new MouseEvent("click") as any
                              )
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {/*   <DropdownMenuItem
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Expense
                          </DropdownMenuItem> */}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={expense.paidAmount > 0}
                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                            onClick={() => handleDeleteClick(expense)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Expense
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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

      {/* Edit Expense Dialog */}
      {expenseToEdit && (
        <AddExpenseDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onExpenseAdded={() => {
            setIsEditDialogOpen(false);
            setExpenseToEdit(null);
            onExpenseUpdated?.();
          }}
          categoriesOptions={categoriesOptions}
          vendorsOptions={vendorsOptions}
          vendorsData={vendorsData}
          expenseData={expenseToEdit}
          mode="edit"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {expenseToDelete && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expense Number:</span>
                  <span className="text-sm">
                    {expenseToDelete.expenseNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Description:</span>
                  <span className="text-sm truncate max-w-[200px]">
                    {expenseToDelete.description}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-sm font-medium">
                    R{expenseToDelete.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${
                      expenseToDelete.status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : expenseToDelete.status === "PARTIAL"
                          ? "bg-yellow-100 text-yellow-800"
                          : expenseToDelete.status === "OVERDUE"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {expenseToDelete.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">Warning:</p>
                <p className="text-xs text-red-700 mt-1">
                  Deleting this expense will also delete all associated payments
                  and audit logs.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteExpense}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Expense
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
