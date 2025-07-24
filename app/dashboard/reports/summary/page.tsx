"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Download, TrendingUp, DollarSign, Users, Building2, Calendar } from "lucide-react"
import { SummaryChart } from "@/components/summary-chart"

export default function FinancialSummaryPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Financial Summary</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <Select defaultValue="2024">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="annual">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual Summary</SelectItem>
                <SelectItem value="quarterly">Quarterly Summary</SelectItem>
                <SelectItem value="monthly">Monthly Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">$542,318</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+23.5%</span> from last year
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">$169,239</div>
              <p className="text-xs text-muted-foreground">31.2% profit margin</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">24</div>
              <p className="text-xs text-muted-foreground">+4 new hires this year</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operating Efficiency</CardTitle>
              <Building2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">92%</div>
              <p className="text-xs text-muted-foreground">Above industry average</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Performance Overview</CardTitle>
            <CardDescription>Monthly revenue, expenses, and profit trends</CardDescription>
          </CardHeader>
          <CardContent>
            <SummaryChart />
          </CardContent>
        </Card>

        {/* Key Metrics and Goals */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Key Performance Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Revenue Growth Target</span>
                  <span>78% of $700K goal</span>
                </div>
                <Progress value={78} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Profit Margin Target</span>
                  <span>104% of 30% goal</span>
                </div>
                <Progress value={100} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Customer Satisfaction</span>
                  <span>95% satisfaction rate</span>
                </div>
                <Progress value={95} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Cost Control</span>
                  <span>68.8% expense ratio</span>
                </div>
                <Progress value={69} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Quarterly Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">Q1 2024</div>
                    <div className="text-sm text-muted-foreground">Jan - Mar</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">$128,450</div>
                    <Badge variant="secondary">+18.2%</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">Q2 2024</div>
                    <div className="text-sm text-muted-foreground">Apr - Jun</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">$142,890</div>
                    <Badge variant="secondary">+25.1%</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">Q3 2024</div>
                    <div className="text-sm text-muted-foreground">Jul - Sep</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">$135,670</div>
                    <Badge variant="secondary">+22.8%</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">Q4 2024</div>
                    <div className="text-sm text-muted-foreground">Oct - Dec</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">$135,308</div>
                    <Badge variant="secondary">+28.5%</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Health Score */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Health Score</CardTitle>
            <CardDescription>Overall assessment of financial performance and stability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">A+</div>
                <div className="text-lg font-semibold mb-1">Excellent</div>
                <div className="text-sm text-muted-foreground">Overall Financial Health</div>
                <Progress value={92} className="mt-3" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Profitability</span>
                  <Badge variant="secondary">95/100</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Liquidity</span>
                  <Badge variant="secondary">88/100</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Efficiency</span>
                  <Badge variant="secondary">92/100</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Growth</span>
                  <Badge variant="secondary">89/100</Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Strong revenue growth</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Healthy profit margins</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Good cash flow management</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Monitor expense growth</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
