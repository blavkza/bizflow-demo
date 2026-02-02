"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Product, ProductFormData, Category } from "@/types/product";
import { ProductModal } from "./components/ProductModal";
import { CategoryModal } from "./components/CategoryModal";
import { SummaryCards } from "./components/SummaryCards";
import { Filters } from "./components/Filters";
import { ProductGrid } from "./components/ProductGrid";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      retryDelay: 1000,
    },
  },
});

export default function ShopPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <ShopPage />
      </Suspense>
    </QueryClientProvider>
  );
}

function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All Categories";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state with URL params
  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  // Reset page to 1 when filters change
  const handleFilterChange = () => {
    setPage(1);
  };

  // Update search term and reset page
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    handleFilterChange();
  };

  // Update category and reset page
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    handleFilterChange();
  };

  // Update status and reset page
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    handleFilterChange();
  };

  // Single handlePageChange function
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (productsData?.totalPages || 1)) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Fetch products with pagination and filters
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    isFetching,
    refetch,
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

      const url = `/api/shop/products?${params}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load products: ${response.status}`);
      }

      return response.json();
    },
    placeholderData: (previousData) => previousData,
  });

  // Use the products from API response
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
    staleTime: 10 * 60 * 1000,
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
      setIsCategoryDialogOpen(false);
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

  const isFiltered = selectedCategory !== "All Categories";

  return (
    <div ref={containerRef} className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {isFiltered ? selectedCategory : "Inventory"}
        </h2>
        <div className="flex items-center space-x-2">
          {!isFiltered && (
            <Button
              variant="outline"
              onClick={() => setIsCategoryDialogOpen(true)}
              disabled={addCategoryMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          )}
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={createProductMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          {!isFiltered && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/shop/sales">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Sales
              </Link>
            </Button>
          )}
          <ExportProductsButton
            searchTerm={searchTerm}
            categoryFilter={selectedCategory}
            statusFilter={selectedStatus}
          />
        </div>
      </div>

      <SummaryCards selectedCategory={selectedCategory} />

      <Filters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        categories={categories}
        onFilterChange={handleFilterChange}
        hideCategoryFilter={!!searchParams.get("category")}
      />

      {/* Error message */}
      {productsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load products. Please try again.
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Show loading state */}
      {productsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-lg"></div>
              <div className="mt-2 space-y-2">
                <div className="bg-gray-200 h-4 rounded"></div>
                <div className="bg-gray-200 h-4 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Grid with actual data */}
      {!productsLoading && !productsError && filteredProducts.length > 0 && (
        <ProductGrid
          products={filteredProducts}
          onEditProduct={setEditingProduct}
          onDeleteProduct={handleDeleteProduct}
          onAddProduct={() => setIsCreateDialogOpen(true)}
        />
      )}

      {/* Show message when no products found */}
      {!productsLoading && !productsError && filteredProducts.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <div className="text-muted-foreground mb-4">
            <ShoppingCart className="h-12 w-12 mx-auto opacity-20" />
          </div>
          <p className="text-lg font-semibold text-muted-foreground">
            No products found
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {searchTerm ||
            selectedCategory !== "All Categories" ||
            selectedStatus !== "All Status"
              ? "Try adjusting your search or filters"
              : "Add your first product to get started"}
          </p>
          <div className="mt-4 space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All Categories");
                setSelectedStatus("All Status");
                setPage(1);
                router.push("/dashboard/shop/products");
              }}
            >
              Clear Filters
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>
      )}

      {/* Pagination - only show if we have products */}
      {!productsLoading &&
        !productsError &&
        filteredProducts.length > 0 &&
        productsData &&
        productsData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-semibold">
                {(productsData.page - 1) * pageSize + 1}-
                {Math.min(productsData.page * pageSize, productsData.total)}
              </span>{" "}
              of <span className="font-semibold">{productsData.total}</span>{" "}
              products
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(productsData.page - 1)}
                    className={
                      productsData.page <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {Array.from({ length: productsData.totalPages }, (_, i) => {
                  const pageNum = i + 1;

                  // Show limited pages around current page
                  if (
                    pageNum === 1 ||
                    pageNum === productsData.totalPages ||
                    (pageNum >= productsData.page - 1 &&
                      pageNum <= productsData.page + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={pageNum === productsData.page}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  // Show ellipsis for skipped pages
                  if (
                    (pageNum === 2 && productsData.page > 3) ||
                    (pageNum === productsData.totalPages - 1 &&
                      productsData.page < productsData.totalPages - 2)
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
                    onClick={() => handlePageChange(productsData.page + 1)}
                    className={
                      productsData.page >= productsData.totalPages
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
