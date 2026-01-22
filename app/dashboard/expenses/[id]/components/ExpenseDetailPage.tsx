"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ExpenseStats from "./ExpenseStats";
import ExpenseHeader from "./ExpenseHeader";
import PaymentProgress from "./PaymentProgress";
import ExpenseInfoCards from "./ExpenseInfoCards";
import AttachmentsSection from "./AttachmentsSection";
import PaymentHistory from "./PaymentHistory";
import AuditLog from "./AuditLog";
import { Expense, Payment, ComboboxOption } from "../types";
import { Button } from "@/components/ui/button";
import ExpenseDetailSkeleton from "./ExpenseDetailSkeleton";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddExpenseDialog from "../../Components/AddExpenseDialog";

interface ExpenseDetailPageProps {
  params: {
    id: string;
  };
}

export default function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoriesOptions, setCategoriesOptions] = useState<ComboboxOption[]>(
    []
  );
  const [vendorsOptions, setVendorsOptions] = useState<ComboboxOption[]>([]);
  const [vendorsData, setVendorsData] = useState<any[]>([]);

  // State for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for invoices and projects (to prevent reloading)
  const [invoicesOptions, setInvoicesOptions] = useState<ComboboxOption[]>([]);
  const [projectsOptions, setProjectsOptions] = useState<ComboboxOption[]>([]);

  const fetchExpense = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/expenses/${params.id}`);
      setExpense(response.data);
    } catch (error) {
      console.error("Error fetching expense:", error);
      toast.error("Failed to load expense details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/expenses/${params.id}`);
      toast.success("Expense deleted successfully");
      router.push("/expenses");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Fetch categories, vendors, invoices, and projects
  const fetchAllData = async () => {
    try {
      const [categoriesRes, vendorsRes, invoicesRes, projectsRes] =
        await Promise.all([
          axios.get("/api/category/all-category"),
          axios.get("/api/vendors"),
          axios.get("/api/invoices"),
          axios.get("/api/projects"),
        ]);

      setCategoriesOptions(
        categoriesRes.data.map((cat: any) => ({
          label: cat.name,
          value: cat.id,
        }))
      );

      setVendorsOptions(
        vendorsRes.data.map((vendor: any) => ({
          label: vendor.name,
          value: vendor.id,
        }))
      );

      setVendorsData(vendorsRes.data);

      setInvoicesOptions(
        invoicesRes.data.map((invoice: any) => ({
          label: invoice.invoiceNumber,
          value: invoice.id,
        }))
      );

      setProjectsOptions(
        projectsRes.data.map((project: any) => ({
          label: project.title,
          value: project.id,
        }))
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchExpense();
    fetchAllData();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="m-6">
        <ExpenseDetailSkeleton />
      </div>
    );
  }

  if (!expense) {
    return (
      <SidebarInset>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Expense not found</p>
        </div>
      </SidebarInset>
    );
  }

  const upcomingPayments =
    expense.remainingAmount > 0
      ? [
          {
            id: "UP001",
            dueDate: expense.dueDate,
            amount: expense.remainingAmount,
            description: "Outstanding balance",
            status: "PENDING" as const,
          },
        ]
      : [];

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center justify-between px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <Button variant={"ghost"} onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">{expense.expenseNumber}</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>

          {/* Delete Button */}
          <Button
            variant="destructive"
            disabled={expense.paidAmount > 0}
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        {/* Stats Section */}
        <ExpenseStats expense={expense} />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-80 grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Expense Header */}
            <ExpenseHeader
              expense={expense}
              onDelete={() => setIsDeleteDialogOpen(true)} // Use the dialog instead
              onRefresh={fetchExpense}
            />

            {/* Payment Progress */}
            {/*   <PaymentProgress expense={expense} /> */}

            {/* Attachments */}
            <AttachmentsSection expense={expense} onRefresh={fetchExpense} />

            {/* Info Cards */}
            <ExpenseInfoCards expense={expense} />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentHistory
              expense={expense}
              upcomingPayments={upcomingPayments}
              onRefresh={fetchExpense}
            />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditLog expense={expense} />
          </TabsContent>
        </Tabs>
      </div>

      <AddExpenseDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onExpenseAdded={() => {
          fetchExpense();
          setIsEditDialogOpen(false);
        }}
        categoriesOptions={categoriesOptions}
        vendorsOptions={vendorsOptions}
        vendorsData={vendorsData}
        mode="edit"
        expenseData={expense}
        initialInvoicesOptions={invoicesOptions}
        initialProjectsOptions={projectsOptions}
      />

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

          <div className="py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expense Number:</span>
                <span className="text-sm">{expense.expenseNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Description:</span>
                <span className="text-sm truncate max-w-[200px]">
                  {expense.description}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm font-medium">
                  R{expense.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <span
                  className={`text-sm px-2 py-1 rounded-full ${
                    expense.status === "PAID"
                      ? "bg-green-100 text-green-800"
                      : expense.status === "PARTIAL"
                        ? "bg-yellow-100 text-yellow-800"
                        : expense.status === "OVERDUE"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {expense.status}
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
    </SidebarInset>
  );
}
