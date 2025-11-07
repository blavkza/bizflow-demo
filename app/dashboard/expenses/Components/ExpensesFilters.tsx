"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { ComboboxOption, Category, Vendor } from "../types";
import axios from "axios";
import { toast } from "sonner";

interface ExpensesFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  vendorFilter: string;
  setVendorFilter: (filter: string) => void;
}

export default function ExpensesFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  vendorFilter,
  setVendorFilter,
}: ExpensesFiltersProps) {
  const [categoriesOptions, setCategoriesOptions] = useState<ComboboxOption[]>(
    []
  );
  const [vendorsOptions, setVendorsOptions] = useState<ComboboxOption[]>([]);

  // Fetch categories for filter dropdown
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
      }));

      setCategoriesOptions(options);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Fetch vendors for filter dropdown
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
        }));

      setVendorsOptions(options);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchVendors();
  }, []);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex flex-1 gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoriesOptions.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendorsOptions.map((vendor) => (
              <SelectItem key={vendor.value} value={vendor.value}>
                {vendor.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
