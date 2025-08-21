import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Users,
  Loader2,
} from "lucide-react";

interface StatCardProps {
  isLoading: boolean;
  title: string;
  value?: number;
  change?: number;
  icon: "dollar" | "credit-card" | "trending-up" | "users";
  formatter?: (value: number) => string;
}

const iconMap = {
  dollar: DollarSign,
  "credit-card": CreditCard,
  "trending-up": TrendingUp,
  users: Users,
};

export function StatCard({
  isLoading,
  title,
  value,
  change,
  icon,
  formatter,
}: StatCardProps) {
  const IconComponent = iconMap[icon];
  const formattedValue = formatter ? formatter(value || 0) : value;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <IconComponent className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mt-1" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{formattedValue}</div>
            <p className="text-xs text-muted-foreground">
              <span
                className={
                  change && change >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {change && change >= 0 ? "+" : ""}
                {change?.toFixed(1)}%
              </span>{" "}
              from last month
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
