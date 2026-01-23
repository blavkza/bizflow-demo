import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  PieChart,
  TrendingUp,
  CalendarIcon,
} from "lucide-react";
import { Expense } from "../types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ExpensesDashboardProps {
  expenses: Expense[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  onDateRangeChange: (from: Date | null, to: Date | null) => void;
  onClearDateFilter: () => void;
}

export default function ExpensesDashboard({
  expenses,
  dateRange,
  onDateRangeChange,
  onClearDateFilter,
}: ExpensesDashboardProps) {
  // Ensure amounts are treated as numbers
  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + Number(exp.totalAmount),
    0
  );
  const totalPaid = expenses.reduce(
    (sum, exp) => sum + Number(exp.paidAmount),
    0
  );
  const totalRemaining = expenses.reduce(
    (sum, exp) => sum + Number(exp.remainingAmount),
    0
  );
  const overdueCount = expenses.filter(
    (exp) => exp.status === "OVERDUE"
  ).length;

  // Status counts
  const fullyPaidCount = expenses.filter((e) => e.status === "PAID").length;
  const partiallyPaidCount = expenses.filter(
    (e) => e.status === "PARTIAL"
  ).length;
  const pendingPaymentCount = expenses.filter(
    (e) => e.status === "PENDING" || e.status === "OVERDUE"
  ).length;

  // Status amounts
  const fullyPaidAmount = expenses
    .filter((e) => e.status === "PAID")
    .reduce((sum, e) => sum + Number(e.totalAmount), 0);

  const partiallyPaidRemaining = expenses
    .filter((e) => e.status === "PARTIAL")
    .reduce((sum, e) => sum + Number(e.remainingAmount), 0);

  const pendingPaymentAmount = expenses
    .filter((e) => e.status === "PENDING" || e.status === "OVERDUE")
    .reduce((sum, e) => sum + Number(e.totalAmount), 0);

  // Format numbers properly for display
  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handlePresetChange = (value: string) => {
    const today = new Date();

    switch (value) {
      case "thisWeek": {
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());
        onDateRangeChange(firstDayOfWeek, today);
        break;
      }
      case "thisMonth": {
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        onDateRangeChange(firstDayOfMonth, today);
        break;
      }
      case "lastMonth": {
        const firstDayOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastDayOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          0
        );
        onDateRangeChange(firstDayOfLastMonth, lastDayOfLastMonth);
        break;
      }
      case "thisYear": {
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        onDateRangeChange(firstDayOfYear, today);
        break;
      }
      case "all":
        onClearDateFilter();
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Filter Section - Top */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date Range:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>All dates</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from || new Date()}
                    selected={{
                      from: dateRange.from || undefined,
                      to: dateRange.to || undefined,
                    }}
                    onSelect={(range) =>
                      onDateRangeChange(range?.from || null, range?.to || null)
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Select onValueChange={handlePresetChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Quick filters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                <SelectItem value="thisWeek">This week</SelectItem>
                <SelectItem value="thisMonth">This month</SelectItem>
                <SelectItem value="lastMonth">Last month</SelectItem>
                <SelectItem value="thisYear">This year</SelectItem>
              </SelectContent>
            </Select>

            {(dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                onClick={onClearDateFilter}
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Clear dates
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              Showing{" "}
              {dateRange.from && dateRange.to
                ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                : "all dates"}
              <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                {expenses.length} expenses
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards - Top Row */}
      <div className="grid gap-4 md:grid-cols-5">
        {/* Total Expenses */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <div className="rounded-full bg-blue-100 p-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} expenses
            </p>
          </CardContent>
        </Card>

        {/* Total Paid */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <div className="rounded-full bg-green-100 p-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
            <div className="space-y-1">
              <Progress
                value={
                  totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0
                }
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {totalExpenses > 0
                  ? ((totalPaid / totalExpenses) * 100).toFixed(1)
                  : 0}
                % of total
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">Fully Paid</span>
              <span className="text-lg font-bold text-green-600">
                {fullyPaidCount}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Remaining Balance */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <div className="rounded-full bg-orange-100 p-2">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalRemaining)}
            </div>
            <div className="space-y-1">
              <Progress
                value={
                  totalExpenses > 0 ? (totalRemaining / totalExpenses) * 100 : 0
                }
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {totalExpenses > 0
                  ? ((totalRemaining / totalExpenses) * 100).toFixed(1)
                  : 0}
                % outstanding
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">Partial</span>
              <span className="text-lg font-bold text-orange-600">
                {partiallyPaidCount}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <div className="rounded-full bg-red-100 p-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdueCount > 0
                ? "Requires attention"
                : "All payments on track"}
            </p>
            {overdueCount > 0 && (
              <div className="mt-3 rounded-lg bg-red-50 px-2 py-1">
                <p className="text-xs font-medium text-red-700">
                  {overdueCount} urgent
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Payment */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="rounded-full bg-blue-100 p-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {pendingPaymentCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(pendingPaymentAmount)} due
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
