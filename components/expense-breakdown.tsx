"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { name: "Payroll", value: 85000, color: "#3b82f6" },
  { name: "Office", value: 12500, color: "#ef4444" },
  { name: "Technology", value: 8900, color: "#8b5cf6" },
  { name: "Marketing", value: 6500, color: "#f59e0b" },
  { name: "Utilities", value: 3200, color: "#10b981" },
  { name: "Other", value: 4900, color: "#6b7280" },
]

export function ExpenseBreakdown() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
      </PieChart>
    </ResponsiveContainer>
  )
}
