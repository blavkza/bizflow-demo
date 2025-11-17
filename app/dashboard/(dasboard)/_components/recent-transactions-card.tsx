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
  const transformedTransactions = (data?.recentTransactions || []).map(
    (transaction: any) => ({
      id: transaction.id,
      amount: Number(transaction.amount) || 0,
      type: String(transaction.type || "EXPENSE").toUpperCase(),
      description: transaction.description || `Transaction ${transaction.id}`,
      date:
        transaction.date || transaction.createdAt || new Date().toISOString(),
      client: transaction.client
        ? { name: transaction.client.name || transaction.client }
        : undefined,
      category: transaction.category
        ? { name: transaction.category.name || transaction.category }
        : undefined,
    })
  );

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
            transactions={transformedTransactions}
            formatter={formatCurrency}
          />
        )}
      </CardContent>
    </Card>
  );
}
