"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts"
import { TrendingUp, TrendingDown, AlertTriangle, Target, Plus } from "lucide-react"

const budgetData = [
  { category: "Salaries", budgeted: 150000, actual: 142000, variance: -8000, color: "#3b82f6" },
  { category: "Office Expenses", budgeted: 25000, actual: 28500, variance: 3500, color: "#ef4444" },
  { category: "Marketing", budgeted: 35000, actual: 32000, variance: -3000, color: "#8b5cf6" },
  { category: "Technology", budgeted: 20000, actual: 22500, variance: 2500, color: "#f59e0b" },
  { category: "Travel", budgeted: 15000, actual: 12000, variance: -3000, color: "#10b981" },
  { category: "Utilities", budgeted: 8000, actual: 8200, variance: 200, color: "#6b7280" },
]

const monthlyTrend = [
  { month: "Jan", budget: 253000, actual: 245200 },
  { month: "Feb", budget: 253000, actual: 251800 },
  { month: "Mar", budget: 253000, actual: 248900 },
  { month: "Apr", budget: 253000, actual: 255600 },
  { month: "May", budget: 253000, actual: 249300 },
  { month: "Jun", budget: 253000, actual: 252100 },
]

export default function BudgetPage() {
  const totalBudgeted = budgetData.reduce((sum, item) => sum + item.budgeted, 0)
  const totalActual = budgetData.reduce((sum, item) => sum + item.actual, 0)
  const totalVariance = totalActual - totalBudgeted

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Budget Management</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Select defaultValue="2024">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="june">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="june">June 2024</SelectItem>
                <SelectItem value="may">May 2024</SelectItem>
                <SelectItem value="april">April 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{totalBudgeted.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Monthly allocation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actual Spend</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{totalActual.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variance</CardTitle>
              {totalVariance > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalVariance > 0 ? "text-red-600" : "text-green-600"}`}>
                {totalVariance > 0 ? "+" : ""}R{totalVariance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {((totalVariance / totalBudgeted) * 100).toFixed(1)}% variance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{((totalActual / totalBudgeted) * 100).toFixed(1)}%</div>
              <Progress value={(totalActual / totalBudgeted) * 100} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual by Category</CardTitle>
              <CardDescription>Current month comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetData}>
                  <XAxis dataKey="category" fontSize={12} />
                  <YAxis tickFormatter={(value) => `R${value / 1000}K`} fontSize={12} />
                  <Tooltip formatter={(value) => [`R${value.toLocaleString()}`, ""]} />
                  <Bar dataKey="budgeted" fill="#94a3b8" name="Budgeted" />
                  <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
              <CardDescription>Actual spending breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={budgetData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="actual"
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  >
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Budget Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Details</CardTitle>
            <CardDescription>Detailed breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Budgeted</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">% Used</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetData.map((item) => (
                  <TableRow key={item.category}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-right">R{item.budgeted.toLocaleString()}</TableCell>
                    <TableCell className="text-right">R{item.actual.toLocaleString()}</TableCell>
                    <TableCell className={`text-right ${item.variance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {item.variance > 0 ? "+" : ""}R{item.variance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{((item.actual / item.budgeted) * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.actual > item.budgeted * 1.1
                            ? "destructive"
                            : item.actual > item.budgeted * 0.9
                              ? "default"
                              : "secondary"
                        }
                      >
                        {item.actual > item.budgeted * 1.1
                          ? "Over Budget"
                          : item.actual > item.budgeted * 0.9
                            ? "On Track"
                            : "Under Budget"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Budget Trend</CardTitle>
            <CardDescription>Budget vs actual spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R${value / 1000}K`} />
                <Tooltip formatter={(value) => [`R${value.toLocaleString()}`, ""]} />
                <Bar dataKey="budget" fill="#94a3b8" name="Budget" />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
