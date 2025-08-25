"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import CategoriesWrapper from "./_components/CategoriesWrapper";
import CategoryList from "./_components/Category-List";
import CategoryLoading from "./_components/loading";
import { UserPermission, UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@/types/category";

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { userId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];

  const hasFullAccess = data?.role
    ? hasRole(data?.role, fullAccessRoles)
    : false;

  const canViewCategory = data?.permissions?.includes(
    UserPermission.CATEGORY_VIEW
  );

  const canManageCategory = data?.permissions?.includes(
    UserPermission.CATEGORY_MANAGE
  );

  useEffect(() => {
    if (!isLoading && canViewCategory === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewCategory, hasFullAccess]);

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

  useEffect(() => {
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
      <CategoriesWrapper
        categories={categories}
        fetchCategories={fetchCategories}
        canManageCategory={canManageCategory}
        hasFullAccess={hasFullAccess}
      />
      <CategoryList
        categories={categories}
        fetchCategories={fetchCategories}
        canManageCategory={canManageCategory}
        hasFullAccess={hasFullAccess}
      />
    </div>
  );
}
