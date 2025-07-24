"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

const data = [
  { month: "Jan", revenue: 45000, expenses: 32000 },
  { month: "Feb", revenue: 52000, expenses: 35000 },
  { month: "Mar", revenue: 48000, expenses: 33000 },
  { month: "Apr", revenue: 61000, expenses: 42000 },
  { month: "May", revenue: 55000, expenses: 38000 },
  { month: "Jun", revenue: 67000, expenses: 45000 },
  { month: "Jul", revenue: 72000, expenses: 48000 },
  { month: "Aug", revenue: 69000, expenses: 47000 },
  { month: "Sep", revenue: 78000, expenses: 52000 },
  { month: "Oct", revenue: 85000, expenses: 58000 },
  { month: "Nov", revenue: 82000, expenses: 55000 },
  { month: "Dec", revenue: 91000, expenses: 62000 },
]

export function FinancialChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} name="Revenue" />
        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} name="Expenses" />
      </LineChart>
    </ResponsiveContainer>
  )
}
