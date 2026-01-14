"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Product, ProductFormData, Category } from "@/types/product";
import { ProductModal } from "./components/ProductModal";
import { CategoryModal } from "./components/CategoryModal";
import { SummaryCards } from "./components/SummaryCards";
import { Filters } from "./components/Filters";
import { ProductGrid } from "./components/ProductGrid";
import ShopPageSkeleton from "./components/ShopPageSkeleton";
import { ExportProductsButton } from "./components/ExportProductsButton";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Define response types
interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
    },
  },
});

export default function ShopPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <ShopPage />
    </QueryClientProvider>
  );
}

function ShopPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  // Single handlePageChange function
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      // Immediate scroll
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Fetch products with pagination and filters
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery<ProductsResponse, Error>({
    queryKey: [
      "products",
      page,
      pageSize,
      searchTerm,
      selectedCategory,
      selectedStatus,
    ],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory !== "All Categories")
        params.append("category", selectedCategory);
      if (selectedStatus !== "All Status")
        params.append("status", selectedStatus);

      const response = await fetch(`/api/shop/products?${params}`);
      if (!response.ok) {
        throw new Error("Failed to load products");
      }
      return response.json();
    },
    placeholderData: (previousData) => previousData,
  });

  // Remove client-side filtering since it's now done on the server
  const filteredProducts = productsData?.products || [];

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/shop/categories");
      if (!response.ok) {
        throw new Error("Failed to load categories");
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create product mutation
  const createProductMutation = useMutation<Product, Error, ProductFormData>({
    mutationFn: async (formData: ProductFormData) => {
      const response = await fetch("/api/shop/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create product");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      alert(`Failed to create product: ${error.message}`);
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation<
    Product,
    Error,
    { id: string; formData: ProductFormData }
  >({
    mutationFn: async ({ id, formData }) => {
      const response = await fetch(`/api/shop/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditingProduct(null);
    },
    onError: (error: Error) => {
      alert(`Failed to update product: ${error.message}`);
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation<void, Error, string>({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/shop/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete product");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      alert(`Failed to delete product: ${error.message}`);
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation<
    Category,
    Error,
    { name: string; description: string; parentId?: string }
  >({
    mutationFn: async (categoryData) => {
      const response = await fetch("/api/shop/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      alert(`Failed to create category: ${error.message}`);
    },
  });

  const handleCreateProduct = async (formData: ProductFormData) => {
    await createProductMutation.mutateAsync(formData);
  };

  const handleUpdateProduct = async (formData: ProductFormData) => {
    if (!editingProduct) return;
    await updateProductMutation.mutateAsync({
      id: editingProduct.id,
      formData,
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await deleteProductMutation.mutateAsync(productId);
  };

  const handleAddCategory = async (categoryData: {
    name: string;
    description: string;
    parentId?: string;
  }) => {
    await addCategoryMutation.mutateAsync(categoryData);
  };

  const saveLoading =
    createProductMutation.isPending || updateProductMutation.isPending;

  if (productsLoading && !productsData) {
    return <ShopPageSkeleton />;
  }

  if (productsError) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="text-center text-red-600">
          Failed to load products. Please try again.
        </div>
      </div>
    );
  }

  // Pagination controls
  const totalPages = Math.ceil((productsData?.total || 0) / pageSize);

  return (
    <div ref={containerRef} className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsCategoryDialogOpen(true)}
            disabled={addCategoryMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={createProductMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/shop/sales">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Sales
            </Link>
          </Button>
          <ExportProductsButton
            searchTerm={searchTerm}
            categoryFilter={selectedCategory}
            statusFilter={selectedStatus}
          />
        </div>
      </div>

      <SummaryCards />

      <Filters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        categories={categories}
      />

      <ProductGrid
        products={filteredProducts}
        onEditProduct={setEditingProduct}
        onDeleteProduct={handleDeleteProduct}
        onAddProduct={() => setIsCreateDialogOpen(true)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold">
              {(page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, productsData?.total || 0)}
            </span>{" "}
            of <span className="font-semibold">{productsData?.total || 0}</span>{" "}
            products
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(page - 1)}
                  className={
                    page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1;

                // Show limited pages around current page
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNum)}
                        isActive={pageNum === page}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }

                // Show ellipsis for skipped pages
                if (
                  (pageNum === 2 && page > 3) ||
                  (pageNum === totalPages - 1 && page < totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={`ellipsis-${pageNum}`}>
                      <span className="px-2">...</span>
                    </PaginationItem>
                  );
                }

                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(page + 1)}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSave={handleCreateProduct}
        loading={saveLoading}
      />

      <ProductModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct || undefined}
        onSave={handleUpdateProduct}
        loading={saveLoading}
      />

      <CategoryModal
        isOpen={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
        onAddCategory={handleAddCategory}
        loading={addCategoryMutation.isPending}
      />
    </div>
  );
}
