// components/CategoryStats.tsx

import { Category } from "@/types/category";
import {
  Layers,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useTheme } from "next-themes";

interface CategoryStatsProps {
  categories: Category[];
}

export default function CategoryStats({ categories }: CategoryStatsProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Calculate statistics
  const totalCategories = categories.length;

  const activeCategories = categories.filter(
    (category) => category.status === "ACTIVE"
  ).length;

  // Separate income and expense categories
  const incomeCategories = categories.filter(
    (category) => category.type === "INCOME"
  );

  const expenseCategories = categories.filter(
    (category) => category.type === "EXPENSE"
  );

  // Calculate total amounts
  const totalIncomeAmount = incomeCategories.reduce(
    (sum, category) => sum + category.totalAmount,
    0
  );

  const totalExpenseAmount = expenseCategories.reduce(
    (sum, category) => sum + category.totalAmount,
    0
  );

  // Calculate total transactions
  const totalTransactions = categories.reduce(
    (sum, category) => sum + category.transactionCount,
    0
  );

  // Net balance (income - expense)
  const netBalance = totalIncomeAmount - totalExpenseAmount;

  const stats = [
    {
      title: "Total Categories",
      value: totalCategories.toString(),
      description: "All categories in the system",
      icon: <Layers className="w-5 h-5" />,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-100 dark:border-blue-800",
    },
    {
      title: "Active Categories",
      value: activeCategories.toString(),
      description: "Currently active categories",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-100 dark:border-green-800",
    },
    {
      title: "Total Transactions",
      value: totalTransactions.toString(),
      description: "Transactions across all categories",
      icon: <CreditCard className="w-5 h-5" />,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-100 dark:border-purple-800",
    },
    {
      title: "Net Balance",
      value: `$${netBalance.toLocaleString()}`,
      description: "Income minus Expense",
      icon: <LineChart className="w-5 h-5" />,
      color:
        netBalance >= 0
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400",
      bgColor:
        netBalance >= 0
          ? "bg-green-50 dark:bg-green-900/20"
          : "bg-red-50 dark:bg-red-900/20",
      borderColor:
        netBalance >= 0
          ? "border-green-100 dark:border-green-800"
          : "border-red-100 dark:border-red-800",
    },
    {
      title: "Total Income",
      value: `$${totalIncomeAmount.toLocaleString()}`,
      description: "Amount from income categories",
      icon: <ArrowUpRight className="w-5 h-5" />,
      color: isDarkMode ? "text-zinc-300" : "text-green-600",
      bgColor: isDarkMode ? "bg-zinc-800/50" : "bg-green-50",
      borderColor: isDarkMode ? "border-zinc-700" : "border-green-100",
    },
    {
      title: "Total Expense",
      value: `$${totalExpenseAmount.toLocaleString()}`,
      description: "Amount from expense categories",
      icon: <ArrowDownRight className="w-5 h-5" />,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-100 dark:border-red-800",
    },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} ${stat.borderColor} rounded-xl p-4 border shadow-sm transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={stat.color}>{stat.icon}</div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${stat.bgColor} ${stat.color}`}
              >
                {stat.title.includes("Income") ||
                stat.title.includes("Expense") ||
                stat.title.includes("Balance")
                  ? "Finance"
                  : "Category"}
              </span>
            </div>
            <p className={` font-bold ${stat.color} mb-1`}>{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {stat.description}
            </p>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.title.includes("Income") &&
                  `${incomeCategories.length} categories`}
                {stat.title.includes("Expense") &&
                  `${expenseCategories.length} categories`}
                {stat.title.includes("Balance") &&
                  (netBalance >= 0 ? "Positive" : "Negative")}
                {stat.title.includes("Categories") &&
                  `${totalCategories} total`}
                {stat.title.includes("Transactions") && "All transactions"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
