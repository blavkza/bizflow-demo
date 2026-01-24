"use client";

import { useState } from "react";
import CategoryCard from "./Category-Card";
import Header from "./Header";
import { CategoryStatus, CategoryType } from "@prisma/client";
import { Category } from "@/types/category";
import CategoryStats from "./CategoryStats";

interface CategoriesWrapperProps {
  fetchCategories: () => void;
  categories: Category[];
  canManageCategory: boolean;
  hasFullAccess: boolean;
}

export default function CategoriesWrapper({
  categories,
  fetchCategories,
  canManageCategory,
  hasFullAccess,
}: CategoriesWrapperProps) {
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
      <CategoryStats categories={categories} />

      <Header
        categories={categories}
        onSearch={handleSearch}
        onFilter={handleFilter}
        fetchCategories={fetchCategories}
        canManageCategory={canManageCategory}
        hasFullAccess={hasFullAccess}
      />
    </div>
  );
}
