"use client";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
  client?: {
    name: string;
  };
  category?: {
    name: string;
  };
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
  formatter?: (value: number) => string;
}

export function RecentTransactions({
  transactions = [],
  formatter,
}: RecentTransactionsProps) {
  if (!transactions.length) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No recent transactions
      </div>
    );
  }

  // Safe transaction processing
  const safeTransactions = transactions.map((tx) => ({
    ...tx,
    amount: typeof tx.amount === "number" ? tx.amount : 0,
    type: String(tx.type || "EXPENSE").toUpperCase(),
    description: tx.description || `Transaction ${tx.id}`,
  }));

  return (
    <div className="space-y-4">
      {safeTransactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{tx.description}</div>
            <div className="text-sm text-muted-foreground truncate">
              {[tx.client?.name, tx.category?.name]
                .filter(Boolean)
                .join(" • ") || "Uncategorized"}
            </div>
          </div>

          <div
            className={`font-medium ml-4 whitespace-nowrap ${
              tx.type === "INCOME" ? "text-green-600" : "text-red-600"
            }`}
          >
            {tx.type === "INCOME" ? "+" : "-"}
            {formatter
              ? formatter(Math.abs(tx.amount))
              : Math.abs(tx.amount).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
