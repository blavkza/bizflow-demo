import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { Sale } from "@/types/sales";

interface SalesStatsProps {
  sales: Sale[];
}

export default function SalesStats({ sales }: SalesStatsProps) {
  const totalSales = sales.length;
  const totalRevenue = sales
    .filter((s) => s.status === "COMPLETED")
    .reduce((sum, sale) => sum + sale.total, 0);

  const todaySales = sales.filter((s) => {
    const saleDate = new Date(s.saleDate);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  }).length;

  const completedSales = sales.filter((s) => s.status === "COMPLETED");
  const avgSaleValue =
    completedSales.length > 0 ? totalRevenue / completedSales.length : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSales}</div>
          <p className="text-xs text-muted-foreground">All time sales</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R{totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">From completed sales</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todaySales}</div>
          <p className="text-xs text-muted-foreground">Sales today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Sale Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R{avgSaleValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Per transaction</p>
        </CardContent>
      </Card>
    </div>
  );
}
