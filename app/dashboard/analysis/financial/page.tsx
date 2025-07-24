"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Activity } from "lucide-react"
import { FinancialChart } from "@/components/financial-chart"
import { ExpenseBreakdown } from "@/components/expense-breakdown"

export default function FinancialAnalysisPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Financial Analysis Dashboard</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <Select defaultValue="last-12-months">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-12-months">Last 12 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="current-year">Current Year</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="monthly">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Granularity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Generate Report</Button>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+23.5%</div>
              <p className="text-xs text-muted-foreground">Compared to last period</p>
              <Progress value={75} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <PieChart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">31.2%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2.1%</span> from last month
              </p>
              <Progress value={62} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expense Ratio</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">68.8%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">+1.2%</span> from last month
              </p>
              <Progress value={69} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">$54.2K</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+15.3%</span> from last month
              </p>
              <Progress value={85} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Revenue vs Expenses Trend</CardTitle>
              <CardDescription>Monthly comparison over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialChart />
            </CardContent>
          </Card>
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Distribution of expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseBreakdown />
            </CardContent>
          </Card>
        </div>

        {/* Financial Health Indicators */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Profitability Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Gross Profit Margin</span>
                <Badge variant="secondary">65.2%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Operating Profit Margin</span>
                <Badge variant="secondary">31.2%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Net Profit Margin</span>
                <Badge variant="secondary">28.5%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Return on Assets</span>
                <Badge variant="secondary">18.7%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Liquidity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Current Ratio</span>
                <Badge variant="secondary">3.9</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Quick Ratio</span>
                <Badge variant="secondary">3.4</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cash Ratio</span>
                <Badge variant="secondary">2.4</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Working Capital</span>
                <Badge variant="secondary">$151K</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                Efficiency Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Revenue per Employee</span>
                <Badge variant="secondary">$7.3K</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Asset Turnover</span>
                <Badge variant="secondary">0.66</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Expense Growth Rate</span>
                <Badge variant="secondary">4.2%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Break-even Point</span>
                <Badge variant="secondary">$121K</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Recommendations</CardTitle>
            <CardDescription>AI-powered insights and suggestions for financial optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-600">Revenue Optimization</h4>
                  <p className="text-sm text-muted-foreground">
                    Your revenue growth is strong at 23.5%. Consider expanding your most profitable service lines to
                    maintain this momentum.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-600">Cost Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Technology expenses have increased by 15% this quarter. Review software subscriptions and consider
                    consolidating tools.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-600">Cash Flow Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Excellent cash position with $125K in liquid assets. Consider investing excess cash in short-term
                    instruments.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
