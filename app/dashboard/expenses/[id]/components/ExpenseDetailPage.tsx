"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Components
import ExpenseStats from "./ExpenseStats";
import ExpenseHeader from "./ExpenseHeader";
import PaymentProgress from "./PaymentProgress";
import ExpenseInfoCards from "./ExpenseInfoCards";
import AttachmentsSection from "./AttachmentsSection";
import PaymentHistory from "./PaymentHistory";
import AuditLog from "./AuditLog";

// Types
import { Expense, Payment } from "../types";
import { Button } from "@/components/ui/button";
import ExpenseDetailSkeleton from "./ExpenseDetailSkeleton";

interface ExpenseDetailPageProps {
  params: {
    id: string;
  };
}

export default function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      /*   await axios.delete(`/api/expenses/${params.id}`); */
      toast.success("Expense deleted successfully");
      router.push("/expenses");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  useEffect(() => {
    fetchExpense();
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
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <Button variant={"ghost"} onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <h1 className="text-lg font-semibold">{expense.expenseNumber}</h1>
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
              onDelete={handleDeleteExpense}
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
    </SidebarInset>
  );
}
