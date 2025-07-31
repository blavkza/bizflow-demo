import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Tag,
} from "lucide-react";
import TransactionManager from "./TransactionManager";
import CategoryManager from "./CategoryManager";
import { toast } from "sonner";
import { TransactionCeo, CategoryCeo } from "@prisma/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface DashboardProps {
  onLogout: () => void;
}

type TransactionWithCategory = TransactionCeo & {
  categoryCeo?: {
    id: string;
    name: string;
    color: string;
    type: string;
  } | null;
};

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(
    []
  );
  const [categories, setCategories] = useState<CategoryCeo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [transactionsRes, categoriesRes] = await Promise.all([
        axios.get("/api/transactionsCeo"),
        axios.get("/api/categoryCeo/all-category"),
      ]);

      const transactionsData = Array.isArray(transactionsRes.data?.data)
        ? transactionsRes.data.data
        : Array.isArray(transactionsRes.data)
          ? transactionsRes.data
          : [];

      setTransactions(transactionsData);
      setCategories(categoriesRes.data?.data || categoriesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalIncome =
    transactions
      ?.filter?.((t) => t?.type === "INCOME")
      ?.reduce?.((sum, t) => sum + Number(t?.amount || 0), 0) || 0;

  const totalExpenses =
    transactions
      ?.filter?.((t) => t?.type === "EXPENSE")
      ?.reduce?.((sum, t) => sum + Math.abs(Number(t?.amount || 0)), 0) || 0;

  const netProfit = totalIncome - totalExpenses;

  const handleLogout = () => {
    toast.success("Logged out successfully");
    onLogout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <header className=" ">
        <div className=" px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {" "}
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  CEO Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Financial Management System
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 ml-auto" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Income"
            value={totalIncome}
            icon={<TrendingUp className="w-6 h-6 text-success" />}
            variant="success"
          />
          <StatCard
            title="Total Expenses"
            value={totalExpenses}
            icon={<TrendingDown className="w-6 h-6 text-destructive" />}
            variant="destructive"
          />
          <StatCard
            title="Net Profit"
            value={netProfit}
            icon={<DollarSign className="w-6 h-6 text-primary" />}
            variant={netProfit >= 0 ? "success" : "destructive"}
          />
        </div>

        <Card className="shadow-executive">
          <Tabs defaultValue="transactions" className="w-full">
            <div className="border-b px-6 py-4">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger
                  value="transactions"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  className="flex items-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  Categories
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="transactions" className="mt-0">
                <TransactionManager
                  transactions={transactions}
                  categories={categories}
                  fetchData={fetchData}
                />
              </TabsContent>
              <TabsContent value="categories" className="mt-0">
                <CategoryManager
                  categories={categories}
                  transactions={transactions}
                />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  variant,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: "success" | "destructive" | "primary";
}) => (
  <Card className="p-6  shadow-card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-muted-foreground text-sm font-medium">{title}</p>
        <p
          className={`text-2xl font-bold ${
            variant === "success"
              ? "text-green-500"
              : variant === "destructive"
                ? "text-red-500"
                : "text-gree-500"
          }`}
        >
          R{value.toLocaleString()}
        </p>
      </div>
      <div
        className={`w-12 h-12 ${
          variant === "success"
            ? "bg-green-500"
            : variant === "destructive"
              ? "bg-red-500"
              : "bg-green-500"
        } rounded-lg flex items-center justify-center text-white`}
      >
        {icon}
      </div>
    </div>
  </Card>
);

export default Dashboard;
