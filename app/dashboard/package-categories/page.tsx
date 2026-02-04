"use client";

import { useState, useEffect } from "react";
import {
  FolderIcon,
  PackageIcon,
  FolderTree,
  Filter,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  PackageCategoryWithStats,
  CategoryStats,
} from "@/types/PackageCategory";
import { CategoryCard } from "./components/category-card";
import { CategoryDialog } from "./components/category-dialog";
import { CategoriesSkeleton, StatsCardsSkeleton } from "./components/skeletons";
import { FiltersSection } from "./components/filters-section";
import { StatsCards } from "./components/stats-cards";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// API functions
async function fetchCategories() {
  const response = await fetch("/api/package-category?includePackages=true");

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  return response.json();
}

async function deleteCategory(id: string) {
  const response = await fetch(`/api/package-category/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete category");
  }

  return response.json();
}

export default function CategoriesPage() {
  const [allCategories, setAllCategories] = useState<
    PackageCategoryWithStats[]
  >([]);
  const [filteredCategories, setFilteredCategories] = useState<
    PackageCategoryWithStats[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<PackageCategoryWithStats | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [parentFilter, setParentFilter] = useState<string>("all");
  const [viewType, setViewType] = useState<"list" | "tree">("list");

  // Statistics state
  const [stats, setStats] = useState<CategoryStats>({
    totalCategories: 0,
    activeCategories: 0,
    categoriesWithPackages: 0,
    nestedCategories: 0,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [allCategories, searchQuery, statusFilter, parentFilter]);

  // Calculate stats when categories change
  useEffect(() => {
    if (allCategories.length > 0) {
      calculateStats();
    }
  }, [allCategories]);

  async function loadCategories() {
    setLoading(true);
    try {
      const categoriesData = await fetchCategories();
      console.log("Loaded categories data:", categoriesData);

      // Transform data to include hierarchical structure
      const categoriesWithHierarchy = buildCategoryTree(categoriesData);
      setAllCategories(categoriesWithHierarchy);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Build hierarchical category tree
  const buildCategoryTree = (
    categories: PackageCategoryWithStats[]
  ): PackageCategoryWithStats[] => {
    const categoryMap = new Map<string, PackageCategoryWithStats>();
    const rootCategories: PackageCategoryWithStats[] = [];

    // Create map of all categories
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Build tree structure
    categories.forEach((category) => {
      const node = categoryMap.get(category.id)!;

      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        rootCategories.push(node);
      }
    });

    // Flatten for list view (include all categories)
    const flattenCategories = (
      nodes: PackageCategoryWithStats[]
    ): PackageCategoryWithStats[] => {
      let result: PackageCategoryWithStats[] = [];
      nodes.forEach((node) => {
        result.push(node);
        if (node.children && node.children.length > 0) {
          result = result.concat(flattenCategories(node.children));
        }
      });
      return result;
    };

    return flattenCategories(rootCategories);
  };

  const calculateStats = () => {
    const totalCategories = allCategories.length;
    const activeCategories = allCategories.filter(
      (cat) => cat.status === "ACTIVE"
    ).length;
    const categoriesWithPackages = allCategories.filter(
      (cat) => cat.packages && cat.packages.length > 0
    ).length;
    const nestedCategories = allCategories.filter(
      (cat) => cat.parentId !== null
    ).length;

    setStats({
      totalCategories,
      activeCategories,
      categoriesWithPackages,
      nestedCategories,
    });
  };

  const applyFilters = () => {
    if (!allCategories.length) {
      setFilteredCategories([]);
      return;
    }

    const filtered = allCategories.filter((category) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" || category.status === statusFilter;

      // Parent filter
      const matchesParent =
        parentFilter === "all" ||
        (parentFilter === "root" && category.parentId === null) ||
        (parentFilter === "nested" && category.parentId !== null) ||
        category.parentId === parentFilter;

      return matchesSearch && matchesStatus && matchesParent;
    });

    setFilteredCategories(filtered);
  };

  const handleDeleteClick = (category: PackageCategoryWithStats) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setDeletingId(categoryToDelete.id);
    try {
      await deleteCategory(categoryToDelete.id);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      loadCategories(); // Refresh data
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (category: PackageCategoryWithStats) => {
    try {
      const response = await fetch(
        `/api/package-category/${category.id}/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: `${category.name} (Copy)` }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to duplicate category");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: result.message || "Category duplicated successfully",
      });

      loadCategories();
    } catch (error: any) {
      console.error("Error duplicating category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate category",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = () => {
    loadCategories();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setParentFilter("all");
  };

  // Get unique parent categories for filter
  const parentCategories = allCategories.filter((cat) => cat.parentId === null);

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div>
            <h1 className="text-lg font-semibold">Package Categories</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Organize packages into categories for better management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick action buttons in header */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewType(viewType === "list" ? "tree" : "list")}
            className="hidden sm:flex"
          >
            {viewType === "list" ? (
              <>
                <FolderTree className="mr-2 h-4 w-4" />
                Tree View
              </>
            ) : (
              <>
                <Filter className="mr-2 h-4 w-4" />
                List View
              </>
            )}
          </Button>

          {/* CategoryDialog in header */}
          <CategoryDialog
            onSuccess={loadCategories}
            trigger={
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Category</span>
                <span className="sm:hidden">New</span>
              </Button>
            }
          />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Updated description section without the duplicate button */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Create and manage categories to organize your packages effectively
          </p>
          {/* Mobile-only view toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewType(viewType === "list" ? "tree" : "list")}
            className="sm:hidden"
          >
            {viewType === "list" ? (
              <FolderTree className="h-4 w-4" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        {loading ? <StatsCardsSkeleton /> : <StatsCards stats={stats} />}

        {/* Filters Section */}
        <FiltersSection
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          parentFilter={parentFilter}
          filteredCount={filteredCategories.length}
          totalCount={allCategories.length}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
          onParentChange={setParentFilter}
          onClearFilters={clearFilters}
          parentCategories={parentCategories}
          viewType={viewType}
          onViewTypeChange={setViewType}
        />

        {/* Categories List/Tree */}
        {loading ? (
          <CategoriesSkeleton />
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
            <div className="text-center space-y-4">
              {searchQuery ||
              statusFilter !== "all" ||
              parentFilter !== "all" ? (
                <>
                  <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">
                    No categories match your filters
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                </>
              ) : (
                <>
                  <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">No categories found</h3>
                  <p className="text-sm text-muted-foreground">
                    Get started by creating your first category
                  </p>
                  <CategoryDialog
                    onSuccess={loadCategories}
                    trigger={<Button>Create Your First Category</Button>}
                  />
                </>
              )}
            </div>
          </div>
        ) : viewType === "tree" ? (
          <div className="space-y-2">
            {filteredCategories
              .filter((cat) => cat.parentId === null)
              .map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  level={0}
                  onDelete={handleDeleteClick}
                  onDuplicate={handleDuplicate}
                  deletingId={deletingId}
                  onUpdate={handleUpdate}
                  allCategories={allCategories}
                  viewType="tree"
                />
              ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                level={0}
                onDelete={handleDeleteClick}
                onDuplicate={handleDuplicate}
                deletingId={deletingId}
                onUpdate={handleUpdate}
                allCategories={allCategories}
                viewType="list"
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "
              {categoryToDelete?.name}"?
              {categoryToDelete?.packages &&
                categoryToDelete.packages.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ This category has {categoryToDelete.packages.length}{" "}
                      package(s) assigned to it. Deleting it will remove these
                      packages from this category.
                    </p>
                  </div>
                )}
              {categoryToDelete?.children &&
                categoryToDelete.children.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800 font-medium">
                      ❗ This category has {categoryToDelete.children.length}{" "}
                      sub-category(ies). You must delete or reassign them first
                      before deleting this category.
                    </p>
                  </div>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setCategoryToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={
                deletingId === categoryToDelete?.id ||
                (categoryToDelete?.children &&
                  categoryToDelete.children.length > 0)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId === categoryToDelete?.id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  );
}
