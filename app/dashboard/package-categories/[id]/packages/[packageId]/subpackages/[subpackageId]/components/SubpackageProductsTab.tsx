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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Box } from "lucide-react";
import Link from "next/link";
import { Subpackage } from "../../../types";
import ProductImage from "./ProductImage";

interface SubpackageProductsTabProps {
  subpackage: Subpackage;
  packageId: string;
  subpackageId: string;
}

export default function SubpackageProductsTab({
  subpackage,
  packageId,
  subpackageId,
}: SubpackageProductsTabProps) {
  const totalProducts = subpackage.products?.length || 0;

  if (totalProducts === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Box className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            This subpackage doesn't contain any products yet.
          </p>
          <Button asChild>
            <Link
              href={`/packages/${packageId}/subpackages/${subpackageId}/edit`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Subpackage
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>
          {totalProducts} products included in this subpackage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subpackage.products?.map((product, index) => {
              const unitPrice = product.price || product.unitPrice || 0;
              const quantity = product.quantity || 1;
              const total = unitPrice * quantity;

              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <ProductImage product={product} size="lg" />
                      <div className="">
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <div
                            className="text-xs text-muted-foreground line-clamp-4 mt-1"
                            dangerouslySetInnerHTML={{
                              __html: product.description,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category || "Uncategorized"}</TableCell>
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
                  <TableCell>R{unitPrice.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{quantity}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    R{total.toLocaleString()}
                  </TableCell>
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
  );
}
