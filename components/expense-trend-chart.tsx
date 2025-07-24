"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

const data = [
  { month: "Jan", payroll: 21000, office: 3500, technology: 2800, marketing: 2200 },
  { month: "Feb", payroll: 21500, office: 3600, technology: 2900, marketing: 2400 },
  { month: "Mar", payroll: 21200, office: 3400, technology: 3100, marketing: 2300 },
  { month: "Apr", payroll: 22000, office: 3800, technology: 3200, marketing: 2600 },
  { month: "May", payroll: 21800, office: 3700, technology: 3300, marketing: 2500 },
  { month: "Jun", payroll: 22500, office: 3900, technology: 3400, marketing: 2800 },
  { month: "Jul", payroll: 22200, office: 3800, technology: 3500, marketing: 2700 },
  { month: "Aug", payroll: 22800, office: 4000, technology: 3600, marketing: 2900 },
  { month: "Sep", payroll: 23000, office: 4100, technology: 3700, marketing: 3000 },
  { month: "Oct", payroll: 23500, office: 4200, technology: 3800, marketing: 3100 },
  { month: "Nov", payroll: 23200, office: 4000, technology: 3900, marketing: 2800 },
  { month: "Dec", payroll: 24000, office: 4300, technology: 4000, marketing: 3200 },
]

export function ExpenseTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
        <Legend />
        <Line type="monotone" dataKey="payroll" stroke="#3b82f6" strokeWidth={2} name="Payroll" />
        <Line type="monotone" dataKey="office" stroke="#f97316" strokeWidth={2} name="Office" />
        <Line type="monotone" dataKey="technology" stroke="#8b5cf6" strokeWidth={2} name="Technology" />
        <Line type="monotone" dataKey="marketing" stroke="#22c55e" strokeWidth={2} name="Marketing" />
      </LineChart>
    </ResponsiveContainer>
  )
}
