"use client"

import { ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Area, AreaChart } from "recharts"

const data = [
  { month: "Jan", revenue: 45000, target: 42000 },
  { month: "Feb", revenue: 52000, target: 44000 },
  { month: "Mar", revenue: 48000, target: 46000 },
  { month: "Apr", revenue: 61000, target: 48000 },
  { month: "May", revenue: 55000, target: 50000 },
  { month: "Jun", revenue: 67000, target: 52000 },
  { month: "Jul", revenue: 72000, target: 54000 },
  { month: "Aug", revenue: 69000, target: 56000 },
  { month: "Sep", revenue: 78000, target: 58000 },
  { month: "Oct", revenue: 85000, target: 60000 },
  { month: "Nov", revenue: 82000, target: 62000 },
  { month: "Dec", revenue: 91000, target: 64000 },
]

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
        <Legend />
        <Area type="monotone" dataKey="target" stackId="1" stroke="#94a3b8" fill="#e2e8f0" name="Target" />
        <Area
          type="monotone"
          dataKey="revenue"
          stackId="2"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.6}
          name="Actual Revenue"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
