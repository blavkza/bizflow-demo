"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OverviewChartProps {
  labels?: string[];
  incomeData?: number[];
  expensesData?: number[];
}

export function OverviewChart({
  labels = [],
  incomeData = [],
  expensesData = [],
}: OverviewChartProps) {
  const data = labels.map((label, index) => ({
    label,
    income: incomeData[index] || 0,
    expenses: expensesData[index] || 0,
  }));

  return (
    <div className="h-[410px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
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
      </ResponsiveContainer>
    </div>
  );
}
