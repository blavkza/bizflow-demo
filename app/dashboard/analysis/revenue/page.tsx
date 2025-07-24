"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, DollarSign } from "lucide-react"
import { RevenueChart } from "@/components/revenue-chart"
import { RevenueSourceChart } from "@/components/revenue-source-chart"

export default function RevenueAnalysisPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Revenue Analysis</h1>
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
            <Select defaultValue="all-sources">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Revenue source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-sources">All Sources</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="subscriptions">Subscriptions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Generate Report</Button>
        </div>

        {/* Revenue Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">$542,318</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+23.5%</span> from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">$45,193</div>
              <p className="text-xs text-muted-foreground">Consistent growth pattern</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+23.5%</div>
              <p className="text-xs text-muted-foreground">Year-over-year growth</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Progress</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">77.5%</div>
              <p className="text-xs text-muted-foreground">Of $700K annual goal</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Sources</CardTitle>
              <CardDescription>Breakdown by revenue stream</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueSourceChart />
            </CardContent>
          </Card>
        </div>

        {/* Revenue Stream Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Stream Performance</CardTitle>
            <CardDescription>Detailed analysis of each revenue source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="font-medium">Product Sales</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">$325,390</div>
                    <Badge variant="secondary">60.0%</Badge>
                  </div>
                </div>
                <Progress value={60} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Primary revenue source. Growth rate: +28.2% (exceeding targets)
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="font-medium">Service Revenue</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">$162,695</div>
                    <Badge variant="secondary">30.0%</Badge>
                  </div>
                </div>
                <Progress value={30} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Consulting and professional services. Growth rate: +18.7%
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="font-medium">Subscription Revenue</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">$54,233</div>
                    <Badge variant="secondary">10.0%</Badge>
                  </div>
                </div>
                <Progress value={10} className="h-2" />
                <p className="text-sm text-muted-foreground">Recurring monthly subscriptions. Growth rate: +15.3%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Goals and Forecasting */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Revenue Goals Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Annual Target ($700K)</span>
                  <span>77.5% achieved</span>
                </div>
                <Progress value={77.5} className="h-3" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Q4 Target ($180K)</span>
                  <span>75.2% achieved</span>
                </div>
                <Progress value={75.2} className="h-3" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Target ($58K)</span>
                  <span>156.8% achieved</span>
                </div>
                <Progress value={100} className="h-3" />
              </div>
              <div className="pt-2 text-sm text-muted-foreground">
                <p>🎯 On track to exceed annual target by 15-20%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Revenue Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Best Performing Month</span>
                <Badge variant="secondary">December ($91K)</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Monthly Growth</span>
                <Badge variant="secondary">+8.2%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Revenue per Customer</span>
                <Badge variant="secondary">$2,847</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Customer Retention Rate</span>
                <Badge variant="secondary">94.2%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Optimization Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Optimization Recommendations</CardTitle>
            <CardDescription>Strategic insights for revenue growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-600">Product Sales Momentum</h4>
                  <p className="text-sm text-muted-foreground">
                    Product sales are performing exceptionally well (+28.2%). Consider expanding product lines or
                    increasing marketing investment to capitalize on this momentum.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-600">Subscription Growth Opportunity</h4>
                  <p className="text-sm text-muted-foreground">
                    Subscription revenue has strong growth potential. Focus on converting one-time customers to
                    recurring subscriptions to improve predictable revenue.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-purple-600">Service Revenue Expansion</h4>
                  <p className="text-sm text-muted-foreground">
                    Service revenue is growing steadily. Consider premium service tiers or specialized consulting
                    packages to increase average revenue per client.
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
