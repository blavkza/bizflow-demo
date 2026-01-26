import { AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import Link from "next/link";

interface ProductDetailsGridProps {
  product: Product;
}

const TAX_RATE = 0.15;

export function ProductDetailsGrid({ product }: ProductDetailsGridProps) {
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
        return "bg-gray-100 text-gray-800";
      case "DISCONTINUED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: any): string => {
    if (price === null || price === undefined) return "0.00";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "0.00";
    return numPrice.toFixed(2);
  };

  const calculateProfitMargin = (price: any, costPrice: any): number => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    const numCostPrice = costPrice
      ? typeof costPrice === "string"
        ? parseFloat(costPrice)
        : costPrice
      : 0;

    if (!numPrice || !numCostPrice || numCostPrice === 0) return 0;
    return ((numPrice - numCostPrice) / numCostPrice) * 100;
  };

  // Helper to convert to number safely
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Get prices
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
  const profitMargin = calculateProfitMargin(priceAfterTax, costAfterTax);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status</span>
            <Badge className={getStatusColor(product.status)}>
              {product.status.toLowerCase()}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Category</span>
            <span>{product.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Brand</span>
            <span>{product.brand || "N/A"}</span>
          </div>
          {product.vender?.name && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Supplier</span>
              <Link
                href={`/dashboard/suppliers/${product.venderId}`}
                className="text-blue-500"
              >
                {product.vender.name}
              </Link>
            </div>
          )}
          {product.featured && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Featured</span>
              <Badge variant="secondary">Yes</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selling Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Selling Price</span>
              <span className="text-2xl font-bold text-green-600">
                R{formatPrice(priceAfterTax)}
              </span>
            </div>
            <div className="text-sm ">
              Before VAT: R{formatPrice(priceBeforeTax)}
              <span className="ml-2 text-xs bg-gray-100  dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                15% VAT
              </span>
            </div>
          </div>

          {/* Cost Price */}
          {costAfterTax && (
            <div className="space-y-2 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Cost Price</span>
                <span className="text-lg font-semibold ">
                  R{formatPrice(costAfterTax)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Before VAT: R{formatPrice(costBeforeTax)}
              </div>

              {/* Profit Margin */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-medium">Profit Margin</span>
                <Badge variant="outline" className="">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {profitMargin.toFixed(1)}%
                </Badge>
              </div>
            </div>
          )}

          {/* Tax Info */}
          <div className="pt-3 border-t">
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="mr-2">Tax mode:</span>
              <Badge variant="outline" className="text-xs">
                {product.priceInputMode === "BEFORE_TAX"
                  ? "Entered before tax"
                  : "Entered after tax"}
              </Badge>
            </div>
          </div>
          {/* warranty Info */}
          {product.warranty && (
            <div className="pt-3 border-t">
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="mr-2">Warranty:</span>
                <Badge variant="outline">{product.warranty}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Stock Status</span>
            <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Current Stock</span>
            <span className="font-bold">{product.stock} units</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Minimum Stock</span>
            <span>{product.minStock} units</span>
          </div>
          {product.maxStock && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Maximum Stock</span>
              <span>{product.maxStock} units</span>
            </div>
          )}
          {product.stock <= product.minStock && product.stock > 0 && (
            <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 p-2 rounded">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Stock below minimum threshold</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {product.weight && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Weight</span>
              <span>{product.weight} kg</span>
            </div>
          )}
          {product.dimensions && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Dimensions</span>
              <span className="text-sm">{product.dimensions}</span>
            </div>
          )}
          {product.color && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Color</span>
              <span>{product.color}</span>
            </div>
          )}
          {product.size && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Size</span>
              <span>{product.size}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm">Created</span>
            <span>{new Date(product.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Last Updated</span>
            <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
