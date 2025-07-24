"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const data = [
  { name: "Product Sales", value: 325390, color: "#3b82f6", percentage: 60.0 },
  { name: "Service Revenue", value: 162695, color: "#22c55e", percentage: 30.0 },
  { name: "Subscriptions", value: 54233, color: "#8b5cf6", percentage: 10.0 },
]

export function RevenueSourceChart() {
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
