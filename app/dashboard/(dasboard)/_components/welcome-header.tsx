import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { getInitials } from "@/lib/formatters";
import { formatCurrency } from "@/lib/formatters";

interface WelcomeHeaderProps {
  isLoading: boolean;
  data: any;
}

const fallbackUser = {
  name: "User",
  avatar: null,
  createdAt: new Date().toISOString(),
};

export default function WelcomeHeader({ isLoading, data }: WelcomeHeaderProps) {
  const financialData = data?.financialSummary || {};

  const currentUser = data?.currentUser || fallbackUser;

  const financialMetrics = {
    netProfit: financialData.netProfit || 0, // All-time net profit from transactions
    totalRevenue: financialData.overallRevenue || 0, // All-time total revenue (renamed from monthlyRevenue)
    totalExpenses: financialData.allTimeTotalExpensesAmount || 0, // All-time total expenses
    outstandingInvoices: financialData.outstandingInvoicesAmount || 0, // Current outstanding
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={currentUser.avatar || "/placeholder-user.jpg"}
                alt={currentUser.name}
              />
              <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold">
                Welcome, {currentUser.name} 👋
              </h2>
              <p className="text-muted-foreground text-sm">
                {`Member since ${new Date(currentUser.createdAt).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Main Financial Metrics */}
        <div className="grid gap-4 md:grid-cols-4 pt-5">
          {/* Net Profit - ALL-TIME */}
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center rounded-lg p-3 ${
                financialMetrics.netProfit >= 0 ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <TrendingUp
                className={`h-6 w-6 ${
                  financialMetrics.netProfit >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium">Net Profit</p>
              {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p
                  className={`text-2xl font-bold ${
                    financialMetrics.netProfit >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(financialMetrics.netProfit)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                All-time profit
              </p>
            </div>
          </div>

          {/* Total Revenue - ALL-TIME */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-lg bg-blue-50 p-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Total Revenue</p>
              {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(financialMetrics.totalRevenue)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                All-time income
              </p>
            </div>
          </div>

          {/* Total Expenses - ALL-TIME */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-lg bg-orange-50 p-3">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Total Expenses</p>
              {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(financialMetrics.totalExpenses)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                All expenses to date
              </p>
            </div>
          </div>

          {/* Outstanding Invoices - CURRENT */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-lg bg-red-50 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Outstanding</p>
              {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(financialMetrics.outstandingInvoices)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {financialData.outstandingInvoicesCount || 0} unpaid invoices
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
