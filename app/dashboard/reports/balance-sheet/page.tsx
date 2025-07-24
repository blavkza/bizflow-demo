"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"

const balanceSheetData = {
  date: "January 31, 2024",
  assets: {
    current: {
      cash: 125000,
      accountsReceivable: 45000,
      inventory: 25000,
      prepaidExpenses: 8000,
      total: 203000,
    },
    fixed: {
      equipment: 85000,
      furniture: 15000,
      vehicles: 35000,
      accumulatedDepreciation: -25000,
      total: 110000,
    },
    totalAssets: 313000,
  },
  liabilities: {
    current: {
      accountsPayable: 25000,
      accrualExpenses: 12000,
      shortTermDebt: 15000,
      total: 52000,
    },
    longTerm: {
      longTermDebt: 75000,
      total: 75000,
    },
    totalLiabilities: 127000,
  },
  equity: {
    retainedEarnings: 150000,
    currentEarnings: 36000,
    total: 186000,
  },
}

export default function BalanceSheetPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Balance Sheet</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <Select defaultValue="january-2024">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="january-2024">January 31, 2024</SelectItem>
                <SelectItem value="december-2023">December 31, 2023</SelectItem>
                <SelectItem value="november-2023">November 30, 2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Balance Sheet */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
              <CardDescription>As of {balanceSheetData.date}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Current Assets */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold">CURRENT ASSETS</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Cash & Cash Equivalents</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.assets.current.cash.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Accounts Receivable</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.assets.current.accountsReceivable.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Inventory</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.assets.current.inventory.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Prepaid Expenses</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.assets.current.prepaidExpenses.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="font-semibold">Total Current Assets</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${balanceSheetData.assets.current.total.toLocaleString()}
                    </TableCell>
                  </TableRow>

                  {/* Fixed Assets */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold">FIXED ASSETS</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Equipment</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.assets.fixed.equipment.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Furniture & Fixtures</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.assets.fixed.furniture.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Vehicles</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.assets.fixed.vehicles.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Accumulated Depreciation</TableCell>
                    <TableCell className="text-right text-red-600">
                      ${balanceSheetData.assets.fixed.accumulatedDepreciation.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b-2">
                    <TableCell className="font-semibold">Total Fixed Assets</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${balanceSheetData.assets.fixed.total.toLocaleString()}
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-green-50">
                    <TableCell className="font-bold text-lg">TOTAL ASSETS</TableCell>
                    <TableCell className="text-right font-bold text-lg text-green-600">
                      ${balanceSheetData.assets.totalAssets.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Liabilities & Equity */}
          <Card>
            <CardHeader>
              <CardTitle>Liabilities & Equity</CardTitle>
              <CardDescription>As of {balanceSheetData.date}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Current Liabilities */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold">CURRENT LIABILITIES</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Accounts Payable</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.liabilities.current.accountsPayable.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Accrued Expenses</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.liabilities.current.accrualExpenses.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Short-term Debt</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.liabilities.current.shortTermDebt.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="font-semibold">Total Current Liabilities</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${balanceSheetData.liabilities.current.total.toLocaleString()}
                    </TableCell>
                  </TableRow>

                  {/* Long-term Liabilities */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold">LONG-TERM LIABILITIES</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Long-term Debt</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.liabilities.longTerm.longTermDebt.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="font-semibold">Total Long-term Liabilities</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${balanceSheetData.liabilities.longTerm.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b-2">
                    <TableCell className="font-bold">TOTAL LIABILITIES</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      ${balanceSheetData.liabilities.totalLiabilities.toLocaleString()}
                    </TableCell>
                  </TableRow>

                  {/* Equity */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-semibold">EQUITY</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Retained Earnings</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.equity.retainedEarnings.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">Current Year Earnings</TableCell>
                    <TableCell className="text-right">
                      ${balanceSheetData.equity.currentEarnings.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b-2">
                    <TableCell className="font-bold">TOTAL EQUITY</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">
                      ${balanceSheetData.equity.total.toLocaleString()}
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-green-50">
                    <TableCell className="font-bold text-lg">TOTAL LIABILITIES & EQUITY</TableCell>
                    <TableCell className="text-right font-bold text-lg text-green-600">
                      $
                      {(balanceSheetData.liabilities.totalLiabilities + balanceSheetData.equity.total).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Financial Ratios */}
        <Card>
          <CardHeader>
            <CardTitle>Key Financial Ratios</CardTitle>
            <CardDescription>Important financial health indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(balanceSheetData.assets.current.total / balanceSheetData.liabilities.current.total).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">Current Ratio</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {((balanceSheetData.equity.total / balanceSheetData.assets.totalAssets) * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Equity Ratio</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(
                    (balanceSheetData.liabilities.totalLiabilities / balanceSheetData.assets.totalAssets) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <p className="text-sm text-muted-foreground">Debt Ratio</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(balanceSheetData.liabilities.totalLiabilities / balanceSheetData.equity.total).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">Debt-to-Equity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
