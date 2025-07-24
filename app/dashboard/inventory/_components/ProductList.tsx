"use client";

import { useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product, PRODUCT_CATEGORIES } from "@/types/product";
import { Search, Edit, Trash2, Package } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

interface ProductListProps {
  products: Product[];
  refreshData: () => void;
}

export function ProductList({ products, refreshData }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const router = useRouter();

  const filteredProducts = products.filter((product) => {
    const name = product.name?.toLowerCase() || "";
    const size = product.size?.toLowerCase() || "";
    const category = product.category?.toLowerCase() || "";

    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) ||
      size.includes(searchTerm.toLowerCase()) ||
      category.includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleDeleteConfirm = async () => {
    if (deleteProductId) {
      try {
        await axios.delete(`/api/products/${deleteProductId}`);
        toast.success("Product deleted successfully");
        refreshData();
      } catch (error) {
        toast.error("Failed to delete product");
      } finally {
        setDeleteProductId(null);
      }
    }
  };

  const handleProductUpdated = () => {
    setEditingProduct(null);
    refreshData();
    router.refresh();
    toast.success("Product updated successfully");
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      "Glass/Mirrors": "bg-blue-100 text-blue-800",
      "Garage Doors - Normal": "bg-green-100 text-green-800",
      "Garage Doors - Frameless": "bg-purple-100 text-purple-800",
      "Single Garage Doors - Normal": "bg-yellow-100 text-yellow-800",
      "Single Garage Doors - Frameless": "bg-indigo-100 text-indigo-800",
      "Kitchen Doors": "bg-emerald-100 text-emerald-800",
    };
    return colors[category || "Other"] || "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Inventory
              </CardTitle>
              <CardDescription>
                Manage your product catalog ({filteredProducts.length} of{" "}
                {products.length} products)
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {products.length === 0
                  ? "No products added yet"
                  : "No products match your search"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Panels</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{product.name || "Unnamed Product"}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(product.category)}>
                          {product.category || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.size || "-"}</TableCell>
                      <TableCell className="text-right font-mono">
                        R{Number(product.price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.panels || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteProductId(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      >
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update this product in your inventory"
                : "Add a new product to your inventory"}
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              type="update"
              data={editingProduct}
              onCancel={() => setEditingProduct(null)}
              onSubmitSuccess={handleProductUpdated}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteProductId}
        onOpenChange={(open) => !open && setDeleteProductId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
