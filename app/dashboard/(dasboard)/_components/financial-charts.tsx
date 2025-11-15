// app/dashboard/(dashboard)/_components/financial-charts.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  Download,
  Filter,
} from "lucide-react";
import { OverviewChart } from "@/components/overview-chart";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";

interface FinancialChartsProps {
  isLoading: boolean;
  data: any;
}

type ChartType = "line" | "bar" | "area" | "pie";
type TimeRange = "7d" | "30d" | "90d" | "1y";

export default function FinancialCharts({
  isLoading,
  data,
}: FinancialChartsProps) {
  const [activeChartType, setActiveChartType] = useState<ChartType>("bar");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const chartData = {
    overview: data?.overviewChartData || {
      labels: [],
      incomeData: [],
      expensesData: [],
    },
    invoice: data?.invoiceChartData || {
      labels: [],
      incomeData: [],
      expensesData: [],
    },
    expense: data?.expenseChartData || {
      labels: [],
      incomeData: [],
      expensesData: [],
    },
    revenue: data?.revenueChartData || {
      labels: [],
      incomeData: [],
      expensesData: [],
    },
  };

  const ChartControls = () => (
    <div className="flex items-center gap-4">
      <Select
        value={activeChartType}
        onValueChange={(value: ChartType) => setActiveChartType(value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bar">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Bar
            </div>
          </SelectItem>
          <SelectItem value="line">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Line
            </div>
          </SelectItem>
          <SelectItem value="area">
            <div className="flex items-center gap-2">
              <AreaChart className="h-4 w-4" />
              Area
            </div>
          </SelectItem>
          <SelectItem value="pie">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Pie
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </div>
  );

  const FinancialOverviewCards = () => {
    const financialData = data?.financialSummary || {};

    if (isLoading) {
      return (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(financialData.monthlyRevenue || 0)}
          </div>
          <div className="text-green-800 font-medium">Monthly Revenue</div>
          <div
            className={`text-xs ${financialData.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {financialData.revenueChange >= 0 ? "↑" : "↓"}{" "}
            {Math.abs(financialData.revenueChange || 0).toFixed(1)}%
          </div>
        </div>

        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(financialData.netProfit || 0)}
          </div>
          <div className="text-blue-800 font-medium">Net Profit</div>
          <div
            className={`text-xs ${financialData.profitChange >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {financialData.profitChange >= 0 ? "↑" : "↓"}{" "}
            {Math.abs(financialData.profitChange || 0).toFixed(1)}%
          </div>
        </div>

        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(financialData.totalExpensesAmount || 0)}
          </div>
          <div className="text-orange-800 font-medium">Total Expenses</div>
          <div
            className={`text-xs ${financialData.expenseChange <= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {financialData.expenseChange <= 0 ? "↓" : "↑"}{" "}
            {Math.abs(financialData.expenseChange || 0).toFixed(1)}%
          </div>
        </div>

        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {(financialData.profitMargin || 0).toFixed(1)}%
          </div>
          <div className="text-purple-800 font-medium">Profit Margin</div>
          <div className="text-xs text-muted-foreground">This month</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Financial Overview
          </h2>
          <p className="text-muted-foreground">
            Comprehensive financial performance and trends
          </p>
        </div>
        <ChartControls />
      </div>

      <FinancialOverviewCards />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Revenue vs Expenses</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Performance</TabsTrigger>
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses Trend</CardTitle>
              <CardDescription>
                Monthly comparison of income and expenditures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OverviewChart
                type={activeChartType}
                isLoading={isLoading}
                data={chartData.overview}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Performance</CardTitle>
              <CardDescription>
                Track invoice amounts and collection rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OverviewChart
                type={activeChartType}
                isLoading={isLoading}
                data={chartData.invoice}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Analysis</CardTitle>
              <CardDescription>
                Monitor expense categories and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OverviewChart
                type={activeChartType}
                isLoading={isLoading}
                data={chartData.expense}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
