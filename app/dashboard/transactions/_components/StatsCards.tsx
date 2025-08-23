import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Filter } from "lucide-react";
import { Transaction, TimeRange } from "../_components/types";
import { formatCurrency } from "@/lib/formatters";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  transactions: Transaction[];
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

export function StatsCards({
  transactions,
  timeRange,
  onTimeRangeChange,
}: StatsCardsProps) {
  const stats = calculateStats(transactions, timeRange);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {formatCurrency(stats.income)}
          </div>
          <p className="text-xs text-muted-foreground">{timeRange}ly income</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {formatCurrency(stats.expenses)}
          </div>
          <p className="text-xs text-muted-foreground">
            {timeRange}ly expenses
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net</CardTitle>
          <div
            className={`h-4 w-4 ${stats.net >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {stats.net >= 0 ? <TrendingUp /> : <TrendingDown />}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${stats.net >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {stats.net >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(stats.net))}
          </div>
          <p className="text-xs text-muted-foreground">{timeRange}ly net</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="space-y-1">
                <h4 className="font-medium text-sm px-2 py-1">Time Range</h4>
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors",
                      timeRange === option.value
                        ? "bg-accent font-medium"
                        : "hover:bg-accent"
                    )}
                    onClick={() => onTimeRangeChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.count}</div>
          <p className="text-xs text-muted-foreground">
            {timeRange}ly transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateStats(transactions: Transaction[], timeRange: TimeRange) {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "day":
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const filteredByTime = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= startDate && transactionDate <= now;
  });

  const income =
    Number(
      filteredByTime
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    ) || 0;

  const expenses =
    Number(
      filteredByTime
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    ) || 0;

  const net = income - expenses;

  return {
    income,
    expenses,
    net,
    count: filteredByTime.length || 0,
  };
}
