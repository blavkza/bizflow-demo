import React from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "./TransactionRow";

interface DashboardHeaderProps {
  transactions: Transaction[];
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  transactions,
}) => {
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  const uncategorized = transactions.filter((t) => !t.category).length;
  const categorized = transactions.length - uncategorized;

  const stats = [
    {
      title: "Total Income",
      value: `$${totalIncome.toFixed(2)}`,
      icon: TrendingUp,
      trend: "+12%",
      color: "text-income",
      bgColor: "bg-green-500",
    },
    {
      title: "Total Expenses",
      value: `$${totalExpenses.toFixed(2)}`,
      icon: TrendingDown,
      trend: "-8%",
      color: "text-red-600",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Net Balance",
      value: `${netBalance >= 0 ? "+" : "-"}$${Math.abs(netBalance).toFixed(2)}`,
      icon: DollarSign,
      trend: netBalance >= 0 ? "+5%" : "-3%",
      color: netBalance >= 0 ? "text-income" : "text-expense",
      bgColor: netBalance >= 0 ? "bg-green-500" : "bg-destructive/10",
    },
    {
      title: "Categorized",
      value: `${categorized}/${transactions.length}`,
      icon: Activity,
      trend: `${Math.round((categorized / transactions.length) * 100)}%`,
      color: "text-accent-strong",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Bank Statement Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Use AI to Track and categorize your financial transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-card">
            {transactions.length} transactions
          </Badge>
          {uncategorized > 0 && (
            <Badge variant="destructive">{uncategorized} uncategorized</Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.trend}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
