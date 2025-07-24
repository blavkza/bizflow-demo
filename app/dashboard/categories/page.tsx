"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import CategoriesWrapper from "./_components/CategoriesWrapper";
import CategoryList from "./_components/Category-List";
import CategoryLoading from "./_components/loading";

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  transactions: {
    id: string;
    amount: number | { toNumber(): number };
  }[];
  transactionCount: number;
  totalAmount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/category/all-category");
        setCategories(response.data);
      } catch (err) {
        setError("Failed to fetch categories");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <CategoryLoading />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Categories</h1>
        </div>
      </header>
      <CategoriesWrapper categories={categories} />
      <CategoryList categories={categories} />
    </div>
  );
}
