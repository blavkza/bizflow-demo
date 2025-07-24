"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const data = [
  { name: "Payroll", value: 256800, color: "#3b82f6", percentage: 68.8 },
  { name: "Office", value: 45200, color: "#f97316", percentage: 12.1 },
  { name: "Technology", value: 38900, color: "#8b5cf6", percentage: 10.4 },
  { name: "Marketing", value: 32179, color: "#22c55e", percentage: 8.6 },
]

export function ExpenseAnalysisChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percentage }) => `${name} ${percentage}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
