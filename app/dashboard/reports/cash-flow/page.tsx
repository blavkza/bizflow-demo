"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

const cashFlowData = {
  period: "January 2024",
  operatingActivities: {
    netIncome: 54000,
    depreciation: 5000,
    accountsReceivableChange: -8000,
    accountsPayableChange: 3000,
    inventoryChange: -2000,
    total: 52000,
  },
  investingActivities: {
    equipmentPurchase: -15000,
    softwarePurchase: -3000,
    total: -18000,
  },
  financingActivities: {
    loanRepayment: -5000,
    ownerWithdrawal: -10000,
    total: -15000,
  },
  netCashFlow: 19000,
  beginningCash: 106000,
  endingCash: 125000,
}

export default function CashFlowPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Cash Flow Statement</h1>
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operating Cash Flow</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${cashFlowData.operatingActivities.total.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">+8.5% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investing Cash Flow</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${Math.abs(cashFlowData.investingActivities.total).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Equipment purchases</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Financing Cash Flow</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${Math.abs(cashFlowData.financingActivities.total).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Loan payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${cashFlowData.netCashFlow.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Positive cash generation</p>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Statement */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Statement</CardTitle>
            <CardDescription>Cash movements for {cashFlowData.period}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Cash Flow Item</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Operating Activities */}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold">CASH FLOWS FROM OPERATING ACTIVITIES</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Net Income</TableCell>
                  <TableCell className="text-right">
                    ${cashFlowData.operatingActivities.netIncome.toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Adjustments to reconcile net income:</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-12">Depreciation and Amortization</TableCell>
                  <TableCell className="text-right">
                    ${cashFlowData.operatingActivities.depreciation.toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Changes in operating assets and liabilities:</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-12">Accounts Receivable</TableCell>
                  <TableCell className="text-right text-red-600">
                    (${Math.abs(cashFlowData.operatingActivities.accountsReceivableChange).toLocaleString()})
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-12">Inventory</TableCell>
                  <TableCell className="text-right text-red-600">
                    (${Math.abs(cashFlowData.operatingActivities.inventoryChange).toLocaleString()})
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-12">Accounts Payable</TableCell>
                  <TableCell className="text-right text-green-600">
                    ${cashFlowData.operatingActivities.accountsPayableChange.toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow className="border-b-2">
                  <TableCell className="font-semibold">Net Cash from Operating Activities</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    ${cashFlowData.operatingActivities.total.toLocaleString()}
                  </TableCell>
                </TableRow>

                {/* Investing Activities */}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold">CASH FLOWS FROM INVESTING ACTIVITIES</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Purchase of Equipment</TableCell>
                  <TableCell className="text-right text-red-600">
                    (${Math.abs(cashFlowData.investingActivities.equipmentPurchase).toLocaleString()})
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Purchase of Software</TableCell>
                  <TableCell className="text-right text-red-600">
                    (${Math.abs(cashFlowData.investingActivities.softwarePurchase).toLocaleString()})
                  </TableCell>
                </TableRow>
                <TableRow className="border-b-2">
                  <TableCell className="font-semibold">Net Cash from Investing Activities</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    (${Math.abs(cashFlowData.investingActivities.total).toLocaleString()})
                  </TableCell>
                </TableRow>

                {/* Financing Activities */}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold">CASH FLOWS FROM FINANCING ACTIVITIES</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Loan Repayment</TableCell>
                  <TableCell className="text-right text-red-600">
                    (${Math.abs(cashFlowData.financingActivities.loanRepayment).toLocaleString()})
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">Owner Withdrawal</TableCell>
                  <TableCell className="text-right text-red-600">
                    (${Math.abs(cashFlowData.financingActivities.ownerWithdrawal).toLocaleString()})
                  </TableCell>
                </TableRow>
                <TableRow className="border-b-2">
                  <TableCell className="font-semibold">Net Cash from Financing Activities</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    (${Math.abs(cashFlowData.financingActivities.total).toLocaleString()})
                  </TableCell>
                </TableRow>

                {/* Net Change in Cash */}
                <TableRow>
                  <TableCell className="font-bold">Net Increase in Cash</TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    ${cashFlowData.netCashFlow.toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Cash at Beginning of Period</TableCell>
                  <TableCell className="text-right font-semibold">
                    ${cashFlowData.beginningCash.toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-green-50">
                  <TableCell className="font-bold text-lg">Cash at End of Period</TableCell>
                  <TableCell className="text-right font-bold text-lg text-green-600">
                    ${cashFlowData.endingCash.toLocaleString()}
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
