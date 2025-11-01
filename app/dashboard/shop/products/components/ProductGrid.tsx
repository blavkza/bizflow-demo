"use client";

import { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductGridProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddProduct: () => void;
}

export function ProductGrid({
  products,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground text-center mb-4">
            {products.length === 0
              ? "You haven't added any products yet. Create your first product to get started."
              : "No products match your current filters. Try adjusting your search criteria."}
          </p>
          <Button onClick={onAddProduct}>Add Your First Product</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEditProduct}
          onDelete={onDeleteProduct}
        />
      ))}
    </div>
  );
}
