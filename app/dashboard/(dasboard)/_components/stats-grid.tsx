import { formatCurrency } from "@/lib/formatters";
import { StatCard } from "./stat-card";

interface StatsGridProps {
  isLoading: boolean;
  data: any;
}

export default function StatsGrid({ isLoading, data }: StatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        isLoading={isLoading}
        title="Total Revenue"
        value={data?.stats?.totalRevenue?.amount}
        change={data?.stats?.totalRevenue?.change}
        icon="dollar"
        formatter={formatCurrency}
      />
      <StatCard
        isLoading={isLoading}
        title="Expenses"
        value={data?.stats?.expenses?.amount}
        change={data?.stats?.expenses?.change}
        icon="credit-card"
        formatter={formatCurrency}
      />
      <StatCard
        isLoading={isLoading}
        title="Net Profit"
        value={data?.stats?.netProfit?.amount}
        change={data?.stats?.netProfit?.change}
        icon="trending-up"
        formatter={formatCurrency}
      />
      <StatCard
        isLoading={isLoading}
        title="Active Employees"
        value={data?.stats?.activeEmployees?.count}
        change={data?.stats?.activeEmployees?.change}
        icon="users"
      />
    </div>
  );
}
