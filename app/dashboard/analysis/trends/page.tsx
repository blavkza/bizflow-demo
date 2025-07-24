"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function TrendAnalysisPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Trend Analysis</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <Select defaultValue="24-months">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6-months">Last 6 Months</SelectItem>
                <SelectItem value="12-months">Last 12 Months</SelectItem>
                <SelectItem value="24-months">Last 24 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="revenue">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expenses">Expenses</SelectItem>
                <SelectItem value="profit">Net Profit</SelectItem>
                <SelectItem value="all">All Metrics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Trend Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+15.2%</div>
              <p className="text-xs text-muted-foreground">Average monthly growth</p>
              <Badge variant="secondary" className="mt-2">
                Positive Trend
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expense Trend</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">+8.7%</div>
              <p className="text-xs text-muted-foreground">Average monthly growth</p>
              <Badge variant="destructive" className="mt-2">
                Increasing
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">72.9%</div>
              <p className="text-xs text-muted-foreground">Current profit margin</p>
              <Badge variant="secondary" className="mt-2">
                Healthy
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecast</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">$52K</div>
              <p className="text-xs text-muted-foreground">Next month projection</p>
              <Badge variant="outline" className="mt-2">
                Predicted
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Expense Trends</CardTitle>
              <CardDescription>24-month historical analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Trend Analysis Chart
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Patterns</CardTitle>
              <CardDescription>Monthly performance patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Seasonality Chart</div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Strong Revenue Growth</h4>
                <p className="text-sm text-muted-foreground">
                  Revenue has shown consistent growth over the past 6 months, with Q4 showing exceptional performance.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingDown className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Rising Operational Costs</h4>
                <p className="text-sm text-muted-foreground">
                  Operational expenses have increased by 12% this quarter. Consider reviewing vendor contracts and
                  operational efficiency.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Seasonal Opportunities</h4>
                <p className="text-sm text-muted-foreground">
                  Historical data shows 25% higher revenue in Q4. Plan inventory and marketing campaigns accordingly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
