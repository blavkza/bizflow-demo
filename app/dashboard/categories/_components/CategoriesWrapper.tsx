"use client";

import { useState } from "react";
import CategoryCard from "./Category-Card";
import Header from "./Header";
import { CategoryType } from "@prisma/client";

export type CategoryWithTransactions = {
  id: string;
  name: string;
  description: string | null;
  type: CategoryType;

  transactions: {
    id: string;
    amount: number;
  }[];
  transactionCount: number;
  totalAmount: number;
};

export default function CategoriesWrapper({
  categories,
}: {
  categories: CategoryWithTransactions[];
}) {
  const [filteredCategories, setFilteredCategories] = useState(categories);

  const handleSearch = (term: string) => {
    const filtered = categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(term.toLowerCase()) ||
        (category.description &&
          category.description.toLowerCase().includes(term.toLowerCase()))
      );
    });
    setFilteredCategories(filtered);
  };

  const handleFilter = (type: "all" | "INCOME" | "EXPENSE") => {
    if (type === "all") {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((category) => category.type === type);
      setFilteredCategories(filtered);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4  pt-0 mb-4">
      <Header
        categories={categories}
        onSearch={handleSearch}
        onFilter={handleFilter}
      />
      <CategoryCard categories={filteredCategories} />
    </div>
  );
}
