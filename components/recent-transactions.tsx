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

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between">
          <div>
            <div className="font-medium">{tx.description}</div>
            <div className="text-sm text-muted-foreground">
              {tx.client?.name || "No client"} •{" "}
              {tx.category?.name || "Uncategorized"}
            </div>
          </div>
          <div
            className={`font-medium ${tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}
          >
            {tx.type === "INCOME" ? "+" : "-"}
            {formatter ? formatter(tx.amount) : tx.amount.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
