"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Landmark, CreditCard, Percent, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface LenderStatsProps {
  lenders: any[];
}

export default function LenderStats({ lenders }: LenderStatsProps) {
  const totalLenders = lenders.length;
  
  let totalBorrowed = 0;
  let totalPayable = 0;
  let totalPaid = 0;
  let activeLoansCount = 0;
  let totalRates = 0;
  let lendersWithRates = 0;

  lenders.forEach((lender) => {
    if (lender.interestRate) {
        totalRates += lender.interestRate;
        lendersWithRates++;
    }
    
    (lender.loans || []).forEach((loan: any) => {
        totalBorrowed += loan.amount || 0;
        totalPayable += loan.totalPayable || loan.amount || 0;
        
        const loanPaid = (loan.payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        totalPaid += loanPaid;
        
        if (loan.status === "ACTIVE") {
            activeLoansCount++;
        }
    });
  });

  const avgRate = lendersWithRates > 0 ? totalRates / lendersWithRates : 0;
  const outstanding = Math.max(0, totalPayable - totalPaid);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Lenders</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLenders}</div>
          <p className="text-xs text-muted-foreground mt-1"> Registered partners </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeLoansCount}</div>
          <p className="text-xs text-muted-foreground mt-1"> Currently servicing </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalBorrowed)}</div>
          <p className="text-xs text-muted-foreground mt-1"> Principal amount </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(outstanding)}</div>
          <p className="text-xs text-muted-foreground mt-1"> Incl. interest </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Interest Rate</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgRate.toFixed(2)}%</div>
          <p className="text-xs text-muted-foreground mt-1"> Across all lenders </p>
        </CardContent>
      </Card>
    </div>
  );
}
