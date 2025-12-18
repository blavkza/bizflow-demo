"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { ProductModal } from "../components/ProductModal";
import { ProductFormData } from "@/types/product";
import { ProductHeader } from "./components/ProductHeader";
import { ProductImages } from "./components/ProductImages";
import { ProductDetailsGrid } from "./components/ProductDetailsGrid";
import { ProductHistoryTabs } from "./components/ProductHistoryTabs";
import { ProductDescription } from "./components/ProductDescription";
import { ProductDocuments } from "./components/ProductDocuments";
import { ProductDetailSkeleton } from "./components/ProductDetailSkeleton";
import { StockManagement } from "./components/StockManagement";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadProduct(params.id as string);
    }
  }, [params.id]);

  const loadProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/shop/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        console.error("Failed to load product");
      }
    } catch (error) {
      console.error("Failed to load product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (formData: ProductFormData) => {
    if (!product) return;
    setSaveLoading(true);

    try {
      const response = await fetch(`/api/shop/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadProduct(product.id);
        setIsEditModalOpen(false);
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

  const handleStockUpdate = () => {
    if (product) {
      loadProduct(product.id);
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Product not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <ProductHeader
        product={product}
        onBack={() => router.back()}
        onEdit={() => setIsEditModalOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <ProductImages images={product.images} name={product.name} />
          {/* Stock Management Component */}
          <StockManagement
            product={{
              id: product.id,
              name: product.name,
              sku: product.sku,
              stock: product.stock,
              minStock: product.minStock,
            }}
            onStockUpdate={handleStockUpdate}
          />
        </div>

        {/* Right Column */}
        <ProductDetailsGrid product={product} />
      </div>

      {/* History Tabs */}
      <ProductHistoryTabs productId={product.id} />

      {/* Description */}
      {product.description && (
        <ProductDescription description={product.description} />
      )}

      {/* Documents */}
      {product.productDocuments && product.productDocuments.length > 0 && (
        <ProductDocuments documents={product.productDocuments} />
      )}

      {/* Edit Modal */}
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={product}
        onSave={handleUpdateProduct}
        loading={saveLoading}
      />
    </div>
  );
}
