"use client";

import { useState, useEffect } from "react";
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

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/shop/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/shop/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleCreateProduct = async (formData: ProductFormData) => {
    setSaveLoading(true);
    try {
      const response = await fetch("/api/shop/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadProducts();
        setIsCreateDialogOpen(false);
      } else {
        const error = await response.json();
        alert(`Failed to create product: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to create product");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUpdateProduct = async (formData: ProductFormData) => {
    if (!editingProduct) return;
    setSaveLoading(true);

    try {
      const response = await fetch(`/api/shop/products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadProducts();
        setEditingProduct(null);
      } else {
        const error = await response.json();
        alert(`Failed to update product: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to update product");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/shop/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadProducts();
      } else {
        const error = await response.json();
        alert(`Failed to delete product: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to delete product");
    }
  };

  const handleAddCategory = async (categoryData: {
    name: string;
    description: string;
    parentId?: string;
  }) => {
    try {
      const response = await fetch("/api/shop/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        await loadCategories();
      } else {
        const error = await response.json();
        alert(`Failed to create category: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to create category");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.brand &&
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All Categories" ||
      product.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === "Active")
      matchesStatus = product.status === "ACTIVE";
    else if (selectedStatus === "Inactive")
      matchesStatus = product.status === "INACTIVE";
    else if (selectedStatus === "Out of Stock")
      matchesStatus = product.stock === 0;
    else if (selectedStatus === "Low Stock")
      matchesStatus = product.stock > 0 && product.stock <= product.minStock;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return <ShopPageSkeleton />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">E-commerce Shop</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsCategoryDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>

          <Button variant="outline" asChild>
            <Link href="/dashboard/shop/sales">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Sales
            </Link>
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <SummaryCards products={products} />

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
      />
    </div>
  );
}
