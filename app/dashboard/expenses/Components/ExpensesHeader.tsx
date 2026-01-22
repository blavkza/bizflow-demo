"use client";

import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import AddExpenseDialog from "./AddExpenseDialog";
import ExpensesExport from "./ExpensesExport";
import { ComboboxOption, Category, Vendor } from "../types";
import axios from "axios";
import { toast } from "sonner";

interface ExpensesHeaderProps {
  onExpenseAdded: () => void;
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
  vendorFilter: string;
}

export default function ExpensesHeader({
  onExpenseAdded,
  searchQuery,
  statusFilter,
  categoryFilter,
  vendorFilter,
}: ExpensesHeaderProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [categoriesOptions, setCategoriesOptions] = useState<ComboboxOption[]>(
    []
  );
  const [vendorsOptions, setVendorsOptions] = useState<ComboboxOption[]>([]);

  // Fetch categories and vendors for the dialog
  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/category");
      const categories: Category[] = response?.data || [];

      const expenseCategories = categories.filter(
        (category) =>
          category.id && category.name && category.type === "EXPENSE"
      );

      const options = expenseCategories.map((category) => ({
        label: category.name || "",
        value: category.id,
        type: category.type,
        color: category.color,
      }));

      setCategoriesOptions(options);
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories");
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get("/api/vendors");
      const vendors: Vendor[] = response?.data || [];

      const options = vendors
        .filter(
          (vendor) => vendor.id && vendor.name && vendor.status === "ACTIVE"
        )
        .map((vendor) => ({
          label: vendor.name || "",
          value: vendor.id,
          email: vendor.email,
          phone: vendor.phone,
        }));

      setVendorsOptions(options);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      toast.error("Failed to load vendors");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchVendors();
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Expense Management</h1>
      </div>

      <div className="flex gap-2">
        <ExpensesExport
          searchTerm={searchQuery}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          vendorFilter={vendorFilter}
        />

        <AddExpenseDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onExpenseAdded={onExpenseAdded}
          categoriesOptions={categoriesOptions}
          vendorsOptions={vendorsOptions}
          mode="add"
        />
      </div>
    </header>
  );
}
