"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from "lucide-react"
import { ExpenseAnalysisChart } from "@/components/expense-analysis-chart"
import { ExpenseTrendChart } from "@/components/expense-trend-chart"

export default function ExpenseAnalysisPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Expense Analysis</h1>
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
                <SelectItem value="current-year">Current Year</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-categories">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">All Categories</SelectItem>
                <SelectItem value="payroll">Payroll</SelectItem>
                <SelectItem value="office">Office Expenses</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Generate Report</Button>
        </div>

        {/* Expense Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">$373,079</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">+4.2%</span> from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Largest Category</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">Payroll</div>
              <p className="text-xs text-muted-foreground">68.8% of total expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fastest Growing</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">Technology</div>
              <p className="text-xs text-muted-foreground">+15.3% growth rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">+2.8%</div>
              <p className="text-xs text-muted-foreground">Over budget this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
              <CardDescription>Breakdown by category for current period</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseAnalysisChart />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Expense Trends</CardTitle>
              <CardDescription>Monthly expense trends by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseTrendChart />
            </CardContent>
          </Card>
        </div>

        {/* Category Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance Analysis</CardTitle>
            <CardDescription>Detailed breakdown of expense categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="font-medium">Payroll Expenses</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">$256,800</div>
                    <Badge variant="secondary">68.8%</Badge>
                  </div>
                </div>
                <Progress value={69} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Largest expense category. Growth rate: +3.2% (within normal range)
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="font-medium">Office Expenses</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">$45,200</div>
                    <Badge variant="secondary">12.1%</Badge>
                  </div>
                </div>
                <Progress value={12} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Includes utilities, supplies, and maintenance. Growth rate: +1.8%
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="font-medium">Technology</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">$38,900</div>
                    <Badge variant="destructive">10.4%</Badge>
                  </div>
                </div>
                <Progress value={10} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Software licenses and IT services. Growth rate: +15.3% (⚠️ Above target)
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="font-medium">Marketing</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">$32,179</div>
                    <Badge variant="secondary">8.6%</Badge>
                  </div>
                </div>
                <Progress value={9} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Advertising and promotional activities. Growth rate: +8.7%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Optimization Recommendations</CardTitle>
            <CardDescription>AI-powered suggestions for expense management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-600">Technology Expenses Alert</h4>
                  <p className="text-sm text-muted-foreground">
                    Technology expenses have grown 15.3% this quarter. Review software subscriptions and consider
                    consolidating redundant tools to reduce costs.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <TrendingDown className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-600">Office Efficiency Opportunity</h4>
                  <p className="text-sm text-muted-foreground">
                    Office expenses are well-controlled. Consider negotiating better rates with utility providers for
                    additional savings.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-600">Budget Reallocation</h4>
                  <p className="text-sm text-muted-foreground">
                    Marketing ROI is strong. Consider reallocating some technology budget to marketing for better
                    overall returns.
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
