import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Barcode, Package, Loader2 } from "lucide-react";
import Image from "next/image";
import { Product } from "@/types/pos";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  barcodeInput: string;
  setBarcodeInput: (input: string) => void;
  handleBarcodeSearch: () => void;
  addToCart: (product: Product) => void;
}

export function ProductGrid({
  products,
  loading,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  barcodeInput,
  setBarcodeInput,
  handleBarcodeSearch,
  addToCart,
}: ProductGridProps) {
  return (
    <div className="lg:col-span-2 space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Barcode Scanner */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Scan or enter barcode/SKU..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleBarcodeSearch();
                    }
                  }}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleBarcodeSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={100}
                      height={100}
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {product.sku}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    R{Number(product.price).toFixed(2)}
                  </span>
                  <Badge
                    variant={product.stock > 10 ? "secondary" : "destructive"}
                  >
                    {product.stock}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
