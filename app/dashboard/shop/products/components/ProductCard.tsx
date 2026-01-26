"use client";

import { MoreHorizontal, Eye, Edit, Trash2, Package } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Product } from "@/types/product";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const TAX_RATE = 0.15; // 15% VAT for South Africa

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const router = useRouter();
  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0)
      return { status: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (stock <= minStock)
      return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { status: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-zinc-800 text-white";
      case "DISCONTINUED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderFormattedText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\n/g, "<br>");
  };

  const hasHTMLTags = (text: string): boolean => {
    return /<[a-z][\s\S]*>/i.test(text);
  };

  const getDescriptionHTML = (description: string): string => {
    if (!description) return "";

    if (hasHTMLTags(description)) {
      return renderFormattedText(description);
    }

    return description.replace(/\n/g, "<br>");
  };

  // Helper function to safely convert to number
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Get prices - use stored values or calculate if not available
  const priceAfterTax = toNumber(product.price);
  const priceBeforeTax = product.priceBeforeTax
    ? toNumber(product.priceBeforeTax)
    : priceAfterTax / (1 + TAX_RATE);

  const costAfterTax = product.costPrice ? toNumber(product.costPrice) : null;
  const costBeforeTax = product.costPriceBeforeTax
    ? toNumber(product.costPriceBeforeTax)
    : costAfterTax
      ? costAfterTax / (1 + TAX_RATE)
      : null;

  const stockStatus = getStockStatus(product.stock, product.minStock);

  // Calculate profit margin (using after-tax values as before)
  const profitMargin = costAfterTax
    ? ((priceAfterTax - costAfterTax) / costAfterTax) * 100
    : 0;

  return (
    <Card
      onClick={() => router.push(`/dashboard/shop/products/${product.id}`)}
      key={product.id}
      className="hover:shadow-md transition-shadow cursor-pointer"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(product.status)}>
              {product.status.toLowerCase()}
            </Badge>
            {product.featured && (
              <Badge variant="secondary">Avalable Online</Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/shop/products/${product.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-red-600"
                disabled={true}
                onClick={() => onDelete(product.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Image */}
        <div className="aspect-video bg-transparent rounded-lg flex items-center justify-center">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name || "product image"}
              width={800}
              height={450}
              className="w-full h-full object-contain"
            />
          ) : (
            <Package className="h-12 w-12 text-gray-400" />
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              SKU: {product.sku}
            </span>
            <Badge variant="outline">{product.category}</Badge>
          </div>
        </div>

        {/* Pricing - Simple and clear like before */}
        <div className="space-y-2">
          {/* Selling Price */}
          <div className="space-y-1">
            <div className="text-lg font-bold">R{priceAfterTax.toFixed(2)}</div>
            <div className="text-xs text-gray-500">
              Before VAT: R{priceBeforeTax.toFixed(2)}
              <span className="ml-2 text-xs bg-gray-100 px-1 rounded">
                15% VAT
              </span>
            </div>
          </div>

          {/* Cost Price (if available) */}
          {costAfterTax && (
            <div className="space-y-1 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    Cost: R{costAfterTax.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Before VAT: R{costBeforeTax?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">
                    {profitMargin.toFixed(1)}% margin
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Simple tax info badge */}
          <div className="flex items-center text-xs text-gray-500">
            <span className="mr-2">Tax mode:</span>
            <Badge variant="outline" className="text-xs">
              {product.priceInputMode === "BEFORE_TAX"
                ? "Entered before tax"
                : "Entered after tax"}
            </Badge>
          </div>
        </div>

        {/* Stock Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
            <span className="text-sm font-medium">{product.stock} units</span>
          </div>
          {product.stock <= product.minStock && product.stock > 0 && (
            <p className="text-xs text-orange-600">
              ⚠️ Stock below threshold ({product.minStock} units)
            </p>
          )}
        </div>

        {/* Product Details */}
        <div className="text-xs text-muted-foreground space-y-1">
          {product.brand && (
            <div className="flex justify-between">
              <span>Brand:</span>
              <span>{product.brand}</span>
            </div>
          )}
          {product.weight && (
            <div className="flex justify-between">
              <span>Weight:</span>
              <span>{toNumber(product.weight)}kg</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Added:</span>
            <span>{new Date(product.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
