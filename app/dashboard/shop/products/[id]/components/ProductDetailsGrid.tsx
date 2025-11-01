import { AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";

interface ProductDetailsGridProps {
  product: Product;
}

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
    return numPrice.toFixed(2);
  };

  const calculateProfitMargin = (price: any, costPrice: any): number => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    const numCostPrice = costPrice
      ? typeof costPrice === "string"
        ? parseFloat(costPrice)
        : costPrice
      : 0;

    if (!numPrice || !numCostPrice) return 0;
    return ((numPrice - numCostPrice) / numPrice) * 100;
  };

  const stockStatus = getStockStatus(product.stock, product.minStock);
  const profitMargin = calculateProfitMargin(product.price, product.costPrice);

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
          <div className="flex items-center justify-between">
            <span className="font-medium">Price</span>
            <span className="text-2xl font-bold text-green-600">
              R{formatPrice(product.price)}
            </span>
          </div>
          {product.costPrice && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">Cost Price</span>
                <span>R{formatPrice(product.costPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Profit Margin</span>
                <Badge variant="outline" className="bg-blue-50">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {profitMargin.toFixed(1)}%
                </Badge>
              </div>
            </>
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
