// app/dashboard/shop/categories/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  Image as ImageIcon,
  RefreshCw,
  Package,
  Layers,
  Box,
  TrendingUp,
  BarChart3,
  MoreVertical,
} from "lucide-react";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

// Local components
import CategoryForm from "./CategoryForm";
import CategoryDetailModal from "./CategoryDetailModal";
import { PaginationControls } from "@/components/PaginationControls";
import CategoriesLoading from "./loading";

interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  images: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<
    ProductCategory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [viewingCategory, setViewingCategory] =
    useState<ProductCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ProductCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // Filter categories based on search term
    const filtered = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description?.toLowerCase() || "").includes(
          searchTerm.toLowerCase(),
        ),
    );
    setFilteredCategories(filtered);

    // Reset to page 1 when search changes
    setCurrentPage(1);

    // Calculate total pages
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  }, [searchTerm, categories, itemsPerPage]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/shop/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData: {
    name: string;
    description: string;
    images?: string;
  }) => {
    try {
      const response = await fetch("/api/shop/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        await loadCategories();
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(`Failed to create category: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to create category");
    }
  };

  const handleUpdateCategory = async (categoryData: {
    name: string;
    description: string;
    images?: string;
  }) => {
    if (!editingCategory) return;

    try {
      const response = await fetch(
        `/api/shop/categories/${editingCategory.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryData),
        },
      );

      if (response.ok) {
        await loadCategories();
        setEditingCategory(null);
      } else {
        const error = await response.json();
        alert(`Failed to update category: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to update category");
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(
        `/api/shop/categories/${categoryToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        await loadCategories();
      } else {
        const error = await response.json();
        alert(`Failed to delete category: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to delete category");
    } finally {
      setDeleteLoading(false);
      setCategoryToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const toggleCategoryExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const openDeleteDialog = (category: ProductCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const getProductCount = (category: ProductCategory) => {
    return category._count?.products || 0;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (perPage: string) => {
    setItemsPerPage(Number(perPage));
    setCurrentPage(1);
  };

  const totalCategories = filteredCategories.length;
  const totalProducts = filteredCategories.reduce(
    (sum, cat) => sum + getProductCount(cat),
    0,
  );
  const categoriesWithProducts = filteredCategories.filter(
    (cat) => getProductCount(cat) > 0,
  ).length;
  const avgProductsPerCategory =
    totalCategories > 0 ? (totalProducts / totalCategories).toFixed(1) : "0";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CategoriesLoading />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Product Categories
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your product categories and organize your inventory
            </p>
          </div>
        </div>

        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Categories
                </p>
                <h3 className="text-3xl font-bold mt-2">{totalCategories}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredCategories.length === categories.length
                    ? "All active"
                    : `${filteredCategories.length} filtered`}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Products
                </p>
                <h3 className="text-3xl font-bold mt-2">{totalProducts}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Across all categories
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Box className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Categories
                </p>
                <h3 className="text-3xl font-bold mt-2">
                  {categoriesWithProducts}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {totalCategories > 0
                      ? `${Math.round((categoriesWithProducts / totalCategories) * 100)}%`
                      : "0%"}
                  </Badge>
                  <p className="text-sm text-muted-foreground">with products</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg. Products
                </p>
                <h3 className="text-3xl font-bold mt-2">
                  {avgProductsPerCategory}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Per category
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-auto md:flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSearchTerm("")}>
                    All Categories
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSearchTerm("")}>
                    With Products ({categoriesWithProducts})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSearchTerm("")}>
                    Without Products ({totalCategories - categoriesWithProducts}
                    )
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="icon"
                onClick={loadCategories}
                title="Refresh categories"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentCategories.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No categories found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchTerm
                    ? "Try adjusting your search term"
                    : "Get started by creating your first category"}
                </p>
              </div>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead className="w-[300px]">Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[120px]">Products</TableHead>
                      <TableHead className="w-[120px]">Created</TableHead>
                      <TableHead className="w-[150px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentCategories.map((category) => {
                      const productCount = getProductCount(category);
                      return (
                        <TableRow
                          key={category.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() =>
                            router.push(
                              `/dashboard/shop/products?category=${encodeURIComponent(category.name)}`,
                            )
                          }
                        >
                          {/* Image Column */}
                          <TableCell>
                            {category.images ? (
                              <div className="relative w-12 h-12 rounded-md overflow-hidden border">
                                <Image
                                  src={category.images}
                                  alt={category.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>

                          {/* Category Name */}
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategoryExpand(category.id);
                                }}
                                className="h-6 w-6"
                              ></Button>
                              <span className="font-semibold">
                                {category.name}
                              </span>
                            </div>
                          </TableCell>

                          {/* Description */}
                          <TableCell>
                            <p className="text-muted-foreground line-clamp-2 max-w-md">
                              {category.description || "No description"}
                            </p>
                          </TableCell>

                          {/* Products Count */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  productCount > 0 ? "default" : "secondary"
                                }
                                className="gap-1"
                              >
                                <Box className="h-3 w-3" />
                                {productCount}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                product{productCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </TableCell>

                          {/* Created Date */}
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(
                                category.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingCategory(category);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCategory(category);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (productCount === 0) {
                                      openDeleteDialog(category);
                                    }
                                  }}
                                  disabled={productCount > 0}
                                  className={
                                    productCount > 0
                                      ? "text-muted-foreground"
                                      : "text-destructive"
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <PaginationControls
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                totalPages={totalPages}
                onItemsPerPageChange={handleItemsPerPageChange}
                onPageChange={handlePageChange}
              />

              {/* Page Info */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, filteredCategories.length)} of{" "}
                  {filteredCategories.length} categories
                </p>
                <div className="text-sm text-muted-foreground">
                  Sorted by: <span className="font-medium">Name (A-Z)</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateCategory}
          title="Create New Category"
        />
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <CategoryForm
          isOpen={true}
          onClose={() => setEditingCategory(null)}
          onSubmit={handleUpdateCategory}
          title="Edit Category"
          initialData={{
            name: editingCategory.name,
            description: editingCategory.description || "",
            images: editingCategory.images || "",
          }}
        />
      )}

      {/* View Category Modal */}
      {viewingCategory && (
        <CategoryDetailModal
          isOpen={true}
          onClose={() => setViewingCategory(null)}
          category={viewingCategory}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete &&
              (categoryToDelete._count?.products || 0) > 0 ? (
                <>
                  This category contains{" "}
                  {categoryToDelete._count?.products || 0} product
                  {(categoryToDelete._count?.products || 0) !== 1
                    ? "s"
                    : ""}.{" "}
                  <span className="font-semibold text-destructive">
                    You cannot delete a category that has products.
                  </span>{" "}
                  Please remove or reassign all products before deleting this
                  category.
                </>
              ) : (
                <>
                  Are you sure you want to delete the category{" "}
                  <span className="font-semibold">
                    "{categoryToDelete?.name}"
                  </span>
                  ? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCategoryToDelete(null);
                setDeleteDialogOpen(false);
              }}
              disabled={deleteLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={
                (categoryToDelete &&
                  (categoryToDelete._count?.products || 0) > 0) ||
                deleteLoading
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <span className="mr-2">Deleting...</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                "Delete Category"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
