"use client";

import { useState, useEffect } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import ExpensesHeader from "./Components/ExpensesHeader";
import ExpensesSummary from "./Components/ExpensesSummary";
import ExpensesTable from "./Components/ExpensesTable";
import ExpensesOverview from "./Components/ExpensesOverview";
import { Expense } from "./types";
import axios from "axios";
import { toast } from "sonner";
import ExpensesFilters from "./Components/ExpensesFilters";
import ExpenseDetailLoading from "./loading";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/expenses");
      const allExpenses: Expense[] = response.data;
      setExpenses(allExpenses);
      setFilteredExpenses(allExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters whenever filters or expenses change
  useEffect(() => {
    let filtered = expenses;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (expense) =>
          expense.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          expense.Vendor?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          expense.expenseNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((expense) => expense.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (expense) => expense.categoryId === categoryFilter
      );
    }

    // Apply vendor filter
    if (vendorFilter !== "all") {
      filtered = filtered.filter(
        (expense) => expense.vendorId === vendorFilter
      );
    }

    setFilteredExpenses(filtered);
  }, [expenses, searchQuery, statusFilter, categoryFilter, vendorFilter]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  if (isLoading) {
    return (
      <div className="m-6">
        <ExpenseDetailLoading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <ExpensesHeader
        onExpenseAdded={fetchExpenses}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        vendorFilter={vendorFilter}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <ExpensesOverview expenses={filteredExpenses} />
        <ExpensesFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          vendorFilter={vendorFilter}
          setVendorFilter={setVendorFilter}
        />
        <ExpensesTable expenses={filteredExpenses} />
      </div>
    </div>
  );
}
