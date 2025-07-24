"use client"

import { Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Bar, ComposedChart } from "recharts"

const data = [
  { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
  { month: "Feb", revenue: 52000, expenses: 35000, profit: 17000 },
  { month: "Mar", revenue: 48000, expenses: 33000, profit: 15000 },
  { month: "Apr", revenue: 61000, expenses: 42000, profit: 19000 },
  { month: "May", revenue: 55000, expenses: 38000, profit: 17000 },
  { month: "Jun", revenue: 67000, expenses: 45000, profit: 22000 },
  { month: "Jul", revenue: 72000, expenses: 48000, profit: 24000 },
  { month: "Aug", revenue: 69000, expenses: 47000, profit: 22000 },
  { month: "Sep", revenue: 78000, expenses: 52000, profit: 26000 },
  { month: "Oct", revenue: 85000, expenses: 58000, profit: 27000 },
  { month: "Nov", revenue: 82000, expenses: 55000, profit: 27000 },
  { month: "Dec", revenue: 91000, expenses: 62000, profit: 29000 },
]

export function SummaryChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value / 1000}K`}
        />
        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
        <Legend />
        <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue" />
        <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
        <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Profit" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
