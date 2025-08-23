import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentTransactions } from "@/components/recent-transactions";
import { formatCurrency } from "../../../../lib/formatters";

interface RecentTransactionsCardProps {
  isLoading: boolean;
  data: any;
}

export default function RecentTransactionsCard({
  isLoading,
  data,
}: RecentTransactionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest financial activity</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <RecentTransactions
            transactions={data?.recentTransactions || []}
            formatter={formatCurrency}
          />
        )}
      </CardContent>
    </Card>
  );
}
