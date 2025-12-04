"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { ProductForm } from "./_components/ProductForm";
import { InventoryStats } from "./_components/InventoryStats";
import { ProductList } from "./_components/ProductList";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductCreated = () => {
    setIsDialogOpen(false);
    fetchProducts();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Inventory Management
            </h1>
            <p className="text-muted-foreground">
              Manage your products, track inventory, and monitor business
              metrics.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add product to your inventory.
                </DialogDescription>
              </DialogHeader>
              <ProductForm
                type="create"
                onCancel={() => setIsDialogOpen(false)}
                onSubmitSuccess={handleProductCreated}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {!isLoading && <InventoryStats products={products} />}

        {/* Product List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading products...</p>
          </div>
        ) : (
          <ProductList products={products} refreshData={fetchProducts} />
        )}
      </div>
    </div>
  );
}
