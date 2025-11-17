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
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          isLoading={isLoading}
          title="All Invoices"
          value={financialData.totalInvoicesAmount}
          change={financialData.invoiceChange}
          icon="file-text"
          formatter={formatCurrency}
          description={`${financialData.paidInvoicesCount || 0} paid, ${financialData.partiallyPaidInvoicesCount || 0} partial`}
          onClick={() => handleCardClick("invoices")}
        />
        <StatCard
          isLoading={isLoading}
          title="Paid & Partial Invoices"
          value={financialData.paidInvoicesAmount || 0}
          change={financialData.paidInvoiceChange}
          icon="check-circle"
          formatter={formatCurrency}
          description={`${financialData.paidInvoicesCount || 0} paid, ${financialData.partiallyPaidInvoicesCount || 0} partial`}
          onClick={() => handleCardClick("paid-partial-invoices")}
        />
        <StatCard
          isLoading={isLoading}
          title="All Expenses"
          value={financialData.totalExpensesAmount}
          change={financialData.expenseChange}
          icon="credit-card"
          formatter={formatCurrency}
          description={`${financialData.pendingExpensesCount || 0} pending, ${financialData.partiallyPaidExpensesCount || 0} partial`}
          onClick={() => handleCardClick("expenses")}
        />
        <StatCard
          isLoading={isLoading}
          title="Paid & Partial Expenses"
          value={financialData.paidExpensesAmount || 0}
          change={financialData.paidExpenseChange}
          icon="dollar"
          formatter={formatCurrency}
          description={`${financialData.paidExpensesCount || 0} paid, ${financialData.partiallyPaidExpensesCount || 0} partial`}
          onClick={() => handleCardClick("paid-partial-expenses")}
        />
      </div>

      <Dialog open={!!openDialog} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {openDialog === "invoices" && "All Invoices"}
              {openDialog === "paid-partial-invoices" &&
                "Paid & Partially Paid Invoices"}
              {openDialog === "expenses" && "All Expenses"}
              {openDialog === "paid-partial-expenses" &&
                "Paid & Partially Paid Expenses"}
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
    case "paid-partial-invoices":
      return <PaidPartialInvoiceDetails data={data} />;
    case "expenses":
      return <ExpenseDetails data={data} />;
    case "paid-partial-expenses":
      return <PaidPartialExpenseDetails data={data} />;
    default:
      return null;
  }
};

const InvoiceDetails = ({ data }: { data: any }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-4 text-sm">
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
      <div className="text-center p-4 bg-yellow-50 rounded-lg">
        <div className="text-2xl font-bold text-yellow-600">
          {data?.financialSummary?.partiallyPaidInvoicesCount || 0}
        </div>
        <div className="text-yellow-800">Partially Paid</div>
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
              <div className="flex-1">
                <div className="font-medium">{invoice.invoiceNumber}</div>
                <div className="text-sm text-gray-500">
                  {invoice.clientName}
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-sm text-gray-600">
                  Paid: {formatCurrency(invoice.paidAmount || 0)}
                </div>
                <div className="text-sm text-gray-600">
                  Due: {formatCurrency(invoice.outstandingAmount || 0)}
                </div>
              </div>
              <div className="flex-1 text-right">
                <div className="font-bold">
                  {formatCurrency(invoice.amount)}
                </div>
                <div
                  className={`text-sm font-medium ${
                    invoice.paymentStatus === "FULLY_PAID"
                      ? "text-green-600"
                      : invoice.paymentStatus === "PARTIALLY_PAID"
                        ? "text-yellow-600"
                        : invoice.status === "OVERDUE"
                          ? "text-red-600"
                          : "text-blue-600"
                  }`}
                >
                  {invoice.paymentStatus === "FULLY_PAID"
                    ? "PAID"
                    : invoice.paymentStatus === "PARTIALLY_PAID"
                      ? "PARTIAL"
                      : invoice.status}
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

const PaidPartialInvoiceDetails = ({ data }: { data: any }) => {
  const paidInvoices =
    data?.recentInvoices?.filter(
      (inv: any) =>
        inv.paymentStatus === "FULLY_PAID" ||
        inv.paymentStatus === "PARTIALLY_PAID"
    ) || [];

  const totalPaidAmount = data?.financialSummary?.paidInvoicesAmount || 0;
  const totalPartialAmount = data?.financialSummary?.partiallyPaidAmount || 0;
  const totalPaidInvoice = totalPaidAmount - totalPartialAmount;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPaidAmount)}
          </div>
          <div className="text-green-800">Total Collected</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {data?.financialSummary?.paidInvoicesCount || 0}
          </div>
          <div className="text-green-800">Fully Paid</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {data?.financialSummary?.partiallyPaidInvoicesCount || 0}
          </div>
          <div className="text-yellow-800">Partially Paid</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center p-4 bg-green-100 rounded-lg">
          <div className="text-xl font-bold text-green-700">
            {formatCurrency(totalPaidInvoice)}
          </div>
          <div className="text-green-800">From Paid Invoices</div>
        </div>
        <div className="text-center p-4 bg-yellow-100 rounded-lg">
          <div className="text-xl font-bold text-yellow-700">
            {formatCurrency(totalPartialAmount)}
          </div>
          <div className="text-yellow-800">From Partial Payments</div>
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="p-4 font-semibold border-b">
          Paid & Partially Paid Invoices
        </div>
        <div className="max-h-60 overflow-y-auto">
          {paidInvoices.map((invoice: any) => (
            <div
              key={invoice.id}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-medium">{invoice.invoiceNumber}</div>
                  <div className="text-sm text-gray-500">
                    {invoice.clientName}
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">
                      Paid: {formatCurrency(invoice.paidAmount || 0)}
                    </span>
                    {invoice.outstandingAmount > 0 && (
                      <span className="text-yellow-600 ml-2">
                        Due: {formatCurrency(invoice.outstandingAmount)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <div className="font-bold">
                    {formatCurrency(invoice.amount)}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      invoice.paymentStatus === "FULLY_PAID"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {invoice.paymentStatus === "FULLY_PAID"
                      ? "FULLY PAID"
                      : "PARTIALLY PAID"}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {paidInvoices.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No paid or partially paid invoices available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ExpenseDetails = ({ data }: { data: any }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-4 text-sm">
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">
          {formatCurrency(data?.financialSummary?.totalExpensesAmount || 0)}
        </div>
        <div className="text-orange-800">Total Expenses</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {data?.financialSummary?.paidExpensesCount || 0}
        </div>
        <div className="text-green-800">Paid</div>
      </div>
      <div className="text-center p-4 bg-yellow-50 rounded-lg">
        <div className="text-2xl font-bold text-yellow-600">
          {data?.financialSummary?.partiallyPaidExpensesCount || 0}
        </div>
        <div className="text-yellow-800">Partially Paid</div>
      </div>
      <div className="text-center p-4 bg-red-50 rounded-lg">
        <div className="text-2xl font-bold text-red-600">
          {data?.financialSummary?.pendingExpensesCount || 0}
        </div>
        <div className="text-red-800">Pending</div>
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
              <div className="flex-1">
                <div className="font-medium">{expense.description}</div>
                <div className="text-sm text-gray-500">{expense.category}</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-sm text-gray-600">
                  Paid: {formatCurrency(expense.paidAmount || 0)}
                </div>
                <div className="text-sm text-gray-600">
                  Due: {formatCurrency(expense.outstandingAmount || 0)}
                </div>
              </div>
              <div className="flex-1 text-right">
                <div className="font-bold">
                  {formatCurrency(expense.totalAmount)}
                </div>
                <div
                  className={`text-sm font-medium ${
                    expense.paymentStatus === "PAID"
                      ? "text-green-600"
                      : expense.paymentStatus === "PARTIALLY_PAID"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {expense.paymentStatus}
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

const PaidPartialExpenseDetails = ({ data }: { data: any }) => {
  const paidExpenses =
    data?.recentExpenses?.filter(
      (exp: any) =>
        exp.paymentStatus === "PAID" || exp.paymentStatus === "PARTIALLY_PAID"
    ) || [];

  const totalPaidAmount = data?.financialSummary?.paidExpensesAmount || 0;
  const totalPartialAmount =
    data?.financialSummary?.partiallyPaidExpensesAmount || 0;
  const totalPaidExpansesAmount = totalPaidAmount - totalPartialAmount;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPaidAmount)}
          </div>
          <div className="text-green-800">Total Paid Amount</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {data?.financialSummary?.paidExpensesCount || 0}
          </div>
          <div className="text-green-800">Fully Paid</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {data?.financialSummary?.partiallyPaidExpensesCount || 0}
          </div>
          <div className="text-yellow-800">Partially Paid</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center p-4 bg-green-100 rounded-lg">
          <div className="text-xl font-bold text-green-700">
            {formatCurrency(totalPaidExpansesAmount)}
          </div>
          <div className="text-green-800">From Paid Expenses</div>
        </div>
        <div className="text-center p-4 bg-yellow-100 rounded-lg">
          <div className="text-xl font-bold text-yellow-700">
            {formatCurrency(totalPartialAmount)}
          </div>
          <div className="text-yellow-800">From Partial Payments</div>
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="p-4 font-semibold border-b">
          Paid & Partially Paid Expenses
        </div>
        <div className="max-h-60 overflow-y-auto">
          {paidExpenses.map((expense: any) => (
            <div
              key={expense.id}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-medium">{expense.description}</div>
                  <div className="text-sm text-gray-500">
                    {expense.category}
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">
                      Paid: {formatCurrency(expense.paidAmount || 0)}
                    </span>
                    {expense.outstandingAmount > 0 && (
                      <span className="text-yellow-600 ml-2">
                        Due: {formatCurrency(expense.outstandingAmount)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <div className="font-bold">
                    {formatCurrency(expense.totalAmount)}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      expense.paymentStatus === "PAID"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {expense.paymentStatus === "PAID"
                      ? "FULLY PAID"
                      : "PARTIALLY PAID"}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {paidExpenses.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No paid or partially paid expenses available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
