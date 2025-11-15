import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "./stat-card";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FinancialSummaryProps {
  isLoading: boolean;
  data: any;
}

export default function FinancialSummary({
  isLoading,
  data,
}: FinancialSummaryProps) {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const financialData = data?.financialSummary || {};

  const handleCardClick = (type: string) => {
    setOpenDialog(type);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              isLoading={isLoading}
              title="All Invoices"
              value={financialData.totalInvoicesAmount}
              change={financialData.invoiceChange}
              icon="file-text"
              formatter={formatCurrency}
              description={`${financialData.paidInvoicesCount || 0} paid`}
              onClick={() => handleCardClick("invoices")}
            />
            <StatCard
              isLoading={isLoading}
              title="Paid Invoices"
              value={financialData.paidInvoicesAmount}
              change={financialData.paidInvoiceChange}
              icon="check-circle"
              formatter={formatCurrency}
              description={`${financialData.overdueInvoicesCount || 0} overdue`}
              onClick={() => handleCardClick("paid-invoices")}
            />
            <StatCard
              isLoading={isLoading}
              title="All Expenses"
              value={financialData.totalExpensesAmount}
              change={financialData.expenseChange}
              icon="credit-card"
              formatter={formatCurrency}
              description={`${financialData.pendingExpensesCount || 0} pending`}
              onClick={() => handleCardClick("expenses")}
            />
            <StatCard
              isLoading={isLoading}
              title="Paid Expenses"
              value={financialData.paidExpensesAmount}
              change={financialData.paidExpenseChange}
              icon="dollar"
              formatter={formatCurrency}
              description="Total paid amount"
              onClick={() => handleCardClick("paid-expenses")}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!openDialog} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {openDialog === "invoices" && "All Invoices"}
              {openDialog === "paid-invoices" && "Paid Invoices"}
              {openDialog === "expenses" && "All Expenses"}
              {openDialog === "paid-expenses" && "Paid Expenses"}
            </DialogTitle>
          </DialogHeader>
          {renderDialogContent(openDialog, data)}
        </DialogContent>
      </Dialog>
    </>
  );
}

const renderDialogContent = (type: string | null, data: any) => {
  switch (type) {
    case "invoices":
      return <InvoiceDetails data={data} />;
    case "paid-invoices":
      return <PaidInvoiceDetails data={data} />;
    case "expenses":
      return <ExpenseDetails data={data} />;
    case "paid-expenses":
      return <PaidExpenseDetails data={data} />;
    default:
      return null;
  }
};

const InvoiceDetails = ({ data }: { data: any }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">
          {formatCurrency(data?.financialSummary?.totalInvoicesAmount || 0)}
        </div>
        <div className="text-blue-800">Total Amount</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {data?.financialSummary?.paidInvoicesCount || 0}
        </div>
        <div className="text-green-800">Paid Invoices</div>
      </div>
      <div className="text-center p-4 bg-red-50 rounded-lg">
        <div className="text-2xl font-bold text-red-600">
          {data?.financialSummary?.overdueInvoicesCount || 0}
        </div>
        <div className="text-red-800">Overdue</div>
      </div>
    </div>

    <div className="border rounded-lg">
      <div className="p-4 font-semibold border-b">Recent Invoices</div>
      <div className="max-h-60 overflow-y-auto">
        {data?.recentInvoices?.map((invoice: any) => (
          <div
            key={invoice.id}
            className="p-4 border-b last:border-b-0 hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{invoice.invoiceNumber}</div>
                <div className="text-sm text-gray-500">
                  {invoice.clientName}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  {formatCurrency(invoice.amount)}
                </div>
                <div
                  className={`text-sm ${invoice.status === "PAID" ? "text-green-600" : invoice.status === "OVERDUE" ? "text-red-600" : "text-yellow-600"}`}
                >
                  {invoice.status}
                </div>
              </div>
            </div>
          </div>
        )) || (
          <div className="p-8 text-center text-gray-500">
            No invoice data available
          </div>
        )}
      </div>
    </div>
  </div>
);

const PaidInvoiceDetails = ({ data }: { data: any }) => (
  <div className="space-y-4">
    <div className="text-center p-6 bg-green-50 rounded-lg">
      <div className="text-3xl font-bold text-green-600">
        {formatCurrency(data?.financialSummary?.paidInvoicesAmount || 0)}
      </div>
      <div className="text-green-800 font-medium">Total Paid Amount</div>
      <div className="text-sm text-green-600 mt-2">
        From {data?.financialSummary?.paidInvoicesCount || 0} invoices
      </div>
    </div>

    <div className="border rounded-lg">
      <div className="p-4 font-semibold border-b">Recently Paid Invoices</div>
      <div className="max-h-60 overflow-y-auto">
        {data?.recentInvoices
          ?.filter((inv: any) => inv.status === "PAID")
          .map((invoice: any) => (
            <div
              key={invoice.id}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{invoice.invoiceNumber}</div>
                  <div className="text-sm text-gray-500">
                    {invoice.clientName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {formatCurrency(invoice.amount)}
                  </div>
                  <div className="text-sm text-gray-500">Paid</div>
                </div>
              </div>
            </div>
          )) || (
          <div className="p-8 text-center text-gray-500">
            No paid invoices data available
          </div>
        )}
      </div>
    </div>
  </div>
);

const ExpenseDetails = ({ data }: { data: any }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">
          {formatCurrency(data?.financialSummary?.totalExpensesAmount || 0)}
        </div>
        <div className="text-orange-800">Total Expenses</div>
      </div>
      <div className="text-center p-4 bg-yellow-50 rounded-lg">
        <div className="text-2xl font-bold text-yellow-600">
          {data?.financialSummary?.pendingExpensesCount || 0}
        </div>
        <div className="text-yellow-800">Pending</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {data?.financialSummary?.paidExpensesCount || 0}
        </div>
        <div className="text-green-800">Paid</div>
      </div>
    </div>

    <div className="border rounded-lg">
      <div className="p-4 font-semibold border-b">Recent Expenses</div>
      <div className="max-h-60 overflow-y-auto">
        {data?.recentExpenses?.map((expense: any) => (
          <div
            key={expense.id}
            className="p-4 border-b last:border-b-0 hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{expense.description}</div>
                <div className="text-sm text-gray-500">{expense.category}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  {formatCurrency(expense.totalAmount)}
                </div>
                <div
                  className={`text-sm ${expense.status === "PAID" ? "text-green-600" : expense.status === "PENDING" ? "text-yellow-600" : "text-gray-600"}`}
                >
                  {expense.status}
                </div>
              </div>
            </div>
          </div>
        )) || (
          <div className="p-8 text-center text-gray-500">
            No expense data available
          </div>
        )}
      </div>
    </div>
  </div>
);

const PaidExpenseDetails = ({ data }: { data: any }) => (
  <div className="space-y-4">
    <div className="text-center p-6 bg-green-50 rounded-lg">
      <div className="text-3xl font-bold text-green-600">
        {formatCurrency(data?.financialSummary?.paidExpensesAmount || 0)}
      </div>
      <div className="text-green-800 font-medium">Total Paid Expenses</div>
      <div className="text-sm text-green-600 mt-2">
        From {data?.financialSummary?.paidExpensesCount || 0} expenses
      </div>
    </div>

    <div className="border rounded-lg">
      <div className="p-4 font-semibold border-b">Recently Paid Expenses</div>
      <div className="max-h-60 overflow-y-auto">
        {data?.recentExpenses
          ?.filter((exp: any) => exp.status === "PAID")
          .map((expense: any) => (
            <div
              key={expense.id}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{expense.description}</div>
                  <div className="text-sm text-gray-500">
                    {expense.category}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {formatCurrency(expense.totalAmount)}
                  </div>
                  <div className="text-sm text-gray-500">Paid</div>
                </div>
              </div>
            </div>
          )) || (
          <div className="p-8 text-center text-gray-500">
            No paid expenses data available
          </div>
        )}
      </div>
    </div>
  </div>
);
