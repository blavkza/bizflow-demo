"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Box, Eye, Image as ImageIcon } from "lucide-react";
import { PackageData, PackageProduct } from "../types";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

interface ProductsTabProps {
  packageData: PackageData;
}

export default function ProductsTab({ packageData }: ProductsTabProps) {
  // Get all products across all subpackages and deduplicate
  const allProducts = packageData.subpackages.flatMap(
    (subpackage) =>
      subpackage.products?.map((product) => ({
        ...product,
        subpackageName: subpackage.name,
        subpackageId: subpackage.id,
      })) || []
  );

  // Create a map to deduplicate products by product ID
  const productMap = new Map<
    string,
    (typeof allProducts)[0] & {
      subpackages: string[];
      totalQuantity: number;
    }
  >();

  allProducts.forEach((product) => {
    if (productMap.has(product.id)) {
      const existing = productMap.get(product.id)!;
      existing.subpackages.push(product.subpackageName);
      existing.totalQuantity += product.quantity || 1;
    } else {
      productMap.set(product.id, {
        ...product,
        subpackages: [product.subpackageName],
        totalQuantity: product.quantity || 1,
      });
    }
  });

  // Convert map to array of deduplicated products
  const deduplicatedProducts = Array.from(productMap.values());

  // For table view, we can show all entries including duplicates
  // or use deduplicated version. Let's use deduplicated for stats
  const getTotalProductValue = () => {
    return deduplicatedProducts.reduce((total, product) => {
      const price = product.price || product.unitPrice || 0;
      return total + price * product.totalQuantity;
    }, 0);
  };

  // Calculate total unique products
  const uniqueProductCount = deduplicatedProducts.length;

  // Calculate total quantity across all subpackages
  const totalQuantity = deduplicatedProducts.reduce(
    (total, product) => total + product.totalQuantity,
    0
  );

  if (deduplicatedProducts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Box className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-sm text-muted-foreground text-center">
            This package doesn't contain any products yet. Add products to
            subpackages to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Helper function to get product image
  const getProductImage = (product: PackageProduct) => {
    try {
      if (product.images) {
        const images =
          typeof product.images === "string"
            ? JSON.parse(product.images)
            : product.images;

        if (Array.isArray(images) && images.length > 0) {
          return images[0];
        }
      }
    } catch (error) {
      console.error("Error parsing product images:", error);
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Unique Products</p>
              <p className="text-2xl font-bold">{uniqueProductCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Quantity</p>
              <p className="text-2xl font-bold">{totalQuantity}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">
                R{getTotalProductValue().toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products in Package</CardTitle>
          <CardDescription>
            {uniqueProductCount} unique products across{" "}
            {packageData.subpackages.length} subpackages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Subpackages</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total Quantity</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deduplicatedProducts.map((product, index) => {
                const imageUrl = getProductImage(product);
                const unitPrice = product.price || product.unitPrice || 0;
                const totalValue = unitPrice * product.totalQuantity;

                return (
                  <TableRow key={`${product.id}-${index}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {imageUrl ? (
                          <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden border">
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                            <Box className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>

                          {product.description && (
                            <div
                              className="text-xs text-muted-foreground  line-clamp-1"
                              dangerouslySetInnerHTML={{
                                __html: product.description,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {product.subpackages.map((subpackage, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {subpackage}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.sku ? (
                        <code className="text-xs bg-muted px-1 rounded">
                          {product.sku}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No SKU
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{product.category || "Uncategorized"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={product.stock > 0 ? "outline" : "destructive"}
                        className={
                          product.stock > 0 ? "bg-green-50 text-green-700" : ""
                        }
                      >
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>R{unitPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.totalQuantity}</Badge>
                    </TableCell>
                    <TableCell>R{totalValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800"
                      >
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/shop/products/${product.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed view showing all entries (including duplicates) */}
      {allProducts.length > deduplicatedProducts.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Detailed Product Distribution
            </CardTitle>
            <CardDescription>
              Showing {allProducts.length} product entries across all
              subpackages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deduplicatedProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getProductImage(product) ? (
                        <div className="relative h-8 w-8 flex-shrink-0 rounded-md overflow-hidden border">
                          <Image
                            src={getProductImage(product)!}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        <Box className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {product.sku || "No SKU"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        R
                        {(
                          product.price ||
                          product.unitPrice ||
                          0
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {product.subpackages.map((subpackage, idx) => {
                      // Find the original product entry for this subpackage to get quantity
                      const originalEntry = allProducts.find(
                        (p) =>
                          p.id === product.id && p.subpackageName === subpackage
                      );
                      const quantity = originalEntry?.quantity || 1;

                      return (
                        <div key={idx} className="text-xs bg-muted p-2 rounded">
                          <p className="font-medium">{subpackage}</p>
                          <p className="text-muted-foreground">
                            Quantity: {quantity}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
