"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import { JSX } from "react";

interface OverviewChartProps {
  labels?: string[];
  incomeData?: number[];
  expensesData?: number[];
  type?: "line" | "bar" | "area" | "pie";
  isLoading?: boolean;
  data?: any;
}

const COLORS = [
  "#2fad6c",
  "#ff002b",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
];

export function OverviewChart({
  labels = [],
  incomeData = [],
  expensesData = [],
  type = "line",
  isLoading = false,
  data,
}: OverviewChartProps) {
  const [chartType, setChartType] = useState<"line" | "bar" | "area" | "pie">(
    type
  );
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">(
    "month"
  );

  // Use provided data or fallback to individual arrays
  const chartData = data?.labels
    ? data.labels.map((label: string, index: number) => ({
        label,
        income: data.incomeData?.[index] || 0,
        expenses: data.expensesData?.[index] || 0,
        net:
          (data.incomeData?.[index] || 0) - (data.expensesData?.[index] || 0),
      }))
    : labels.map((label, index) => ({
        label,
        income: incomeData[index] || 0,
        expenses: expensesData[index] || 0,
        net: (incomeData[index] || 0) - (expensesData[index] || 0),
      }));

  const pieData = [
    {
      name: "Income",
      value: chartData.reduce((sum: number, item: any) => sum + item.income, 0),
    },
    {
      name: "Expenses",
      value: chartData.reduce(
        (sum: number, item: any) => sum + item.expenses,
        0
      ),
    },
  ];

  const renderChart = (): JSX.Element => {
    if (isLoading) {
      return (
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading chart...
            </p>
          </div>
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No data available</p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case "line":
        return (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                }).format(Number(value))
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#2fad6c"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ff002b"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Expenses"
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#0088FE"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Net Profit"
            />
          </LineChart>
        );
      case "bar":
        return (
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                }).format(Number(value))
              }
            />
            <Legend />
            <Bar dataKey="income" fill="#2fad6c" name="Income" />
            <Bar dataKey="expenses" fill="#ff002b" name="Expenses" />
            <Bar dataKey="net" fill="#0088FE" name="Net Profit" />
          </BarChart>
        );
      case "area":
        return (
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                }).format(Number(value))
              }
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="income"
              stackId="1"
              stroke="#2fad6c"
              fill="#2fad6c"
              fillOpacity={0.3}
              name="Income"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stackId="1"
              stroke="#ff002b"
              fill="#ff002b"
              fillOpacity={0.3}
              name="Expenses"
            />
            <Area
              type="monotone"
              dataKey="net"
              stackId="1"
              stroke="#0088FE"
              fill="#0088FE"
              fillOpacity={0.3}
              name="Net Profit"
            />
          </AreaChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                }).format(Number(value))
              }
            />
            <Legend />
          </PieChart>
        );
      default:
        return (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                }).format(Number(value))
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#2fad6c"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ff002b"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Expenses"
            />
          </LineChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Financial Overview
        </CardTitle>
        <div className="flex items-center gap-2">
          <Tabs
            value={chartType}
            onValueChange={(value) =>
              setChartType(value as "line" | "bar" | "area" | "pie")
            }
          >
            <TabsList className="h-8">
              <TabsTrigger value="line" className="h-6 text-xs">
                <LineChartIcon className="h-3 w-3 mr-1" />
                Line
              </TabsTrigger>
              <TabsTrigger value="bar" className="h-6 text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                Bar
              </TabsTrigger>
              <TabsTrigger value="area" className="h-6 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Area
              </TabsTrigger>
              <TabsTrigger value="pie" className="h-6 text-xs">
                <PieChartIcon className="h-3 w-3 mr-1" />
                Pie
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
