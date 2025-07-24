"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, TrendingUp, TrendingDown } from "lucide-react"

const profitLossData = {
  period: "January 2024",
  revenue: {
    sales: 125000,
    services: 45000,
    other: 5000,
    total: 175000,
  },
  expenses: {
    payroll: 85000,
    office: 12500,
    technology: 8900,
    marketing: 6500,
    utilities: 3200,
    other: 4900,
    total: 121000,
  },
  netIncome: 54000,
}

export default function ProfitLossPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Profit & Loss Statement</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <Select defaultValue="january-2024">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="january-2024">January 2024</SelectItem>
                <SelectItem value="december-2023">December 2023</SelectItem>
                <SelectItem value="november-2023">November 2023</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="monthly">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${profitLossData.revenue.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${profitLossData.expenses.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+4.2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${profitLossData.netIncome.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Profit margin: {((profitLossData.netIncome / profitLossData.revenue.total) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Profit & Loss Statement */}
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>Financial performance for {profitLossData.period}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">% of Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Revenue Section */}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold">REVENUE</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Sales Revenue</TableCell>
                  <TableCell className="text-right">${profitLossData.revenue.sales.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {((profitLossData.revenue.sales / profitLossData.revenue.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Service Revenue</TableCell>
                  <TableCell className="text-right">${profitLossData.revenue.services.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {((profitLossData.revenue.services / profitLossData.revenue.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Other Revenue</TableCell>
                  <TableCell className="text-right">${profitLossData.revenue.other.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {((profitLossData.revenue.other / profitLossData.revenue.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
                <TableRow className="border-b-2">
                  <TableCell className="font-semibold">Total Revenue</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    ${profitLossData.revenue.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">100.0%</TableCell>
                </TableRow>

                {/* Expenses Section */}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold">EXPENSES</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Payroll Expenses</TableCell>
                  <TableCell className="text-right">${profitLossData.expenses.payroll.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {((profitLossData.expenses.payroll / profitLossData.revenue.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Office Expenses</TableCell>
                  <TableCell className="text-right">${profitLossData.expenses.office.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {((profitLossData.expenses.office / profitLossData.revenue.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Technology Expenses</TableCell>
                  <TableCell className="text-right">${profitLossData.expenses.technology.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {((profitLossData.expenses.technology / profitLossData.revenue.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Marketing Expenses</TableCell>
                  <TableCell className="text-right">${profitLossData.expenses.marketing.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {((profitLossData.expenses.marketing / profitLossData.revenue.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Utilities</TableCell>
                  <TableCell className="text-right">${profitLossData.expenses.utilities.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {((profitLossData.expenses.utilities / profitLossData.revenue.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Other Expenses</TableCell>
                  <TableCell className="text-right">${profitLossData.expenses.other.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {((profitLossData.expenses.other / profitLossData.revenue.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
                <TableRow className="border-b-2">
                  <TableCell className="font-semibold">Total Expenses</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    ${profitLossData.expenses.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {((profitLossData.expenses.total / profitLossData.revenue.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>

                {/* Net Income */}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold text-lg">NET INCOME</TableCell>
                  <TableCell className="text-right font-bold text-lg text-green-600">
                    ${profitLossData.netIncome.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {((profitLossData.netIncome / profitLossData.revenue.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
