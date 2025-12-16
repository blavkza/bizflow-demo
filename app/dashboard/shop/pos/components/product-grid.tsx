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
import { useEffect, useRef, useState, useCallback } from "react";

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

interface ProductWithTax extends Product {
  priceBeforeTax?: number | null;
  costPriceBeforeTax?: number | null;
  priceInputMode?: "BEFORE_TAX" | "AFTER_TAX";
}

const TAX_RATE = 0.15; // 15% VAT for South Africa

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
  const [scannedBarcode, setScannedBarcode] = useState("");
  const scannerTimeoutRef = useRef<NodeJS.Timeout>();
  const lastKeyTimeRef = useRef<number>(0);
  const isTypingRef = useRef<boolean>(false);

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

  // Get prices for display
  const getPriceDisplay = (product: ProductWithTax) => {
    const priceAfterTax = toNumber(product.price);
    const priceBeforeTax = product.priceBeforeTax
      ? toNumber(product.priceBeforeTax)
      : priceAfterTax / (1 + TAX_RATE);

    return {
      afterTax: priceAfterTax,
      beforeTax: priceBeforeTax,
      vatAmount: priceAfterTax - priceBeforeTax,
    };
  };

  // Global keydown listener for barcode scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        isTypingRef.current = true;
        return;
      }

      // Reset typing flag if user hasn't typed for 500ms
      const now = Date.now();
      if (now - lastKeyTimeRef.current > 500) {
        isTypingRef.current = false;
      }
      lastKeyTimeRef.current = now;

      // If user is manually typing, don't process as scanner input
      if (isTypingRef.current) return;

      // Check if it's a printable character (not control keys)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Append character to barcode buffer
        setScannedBarcode((prev) => prev + e.key);

        // Reset timer on each key press
        if (scannerTimeoutRef.current) {
          clearTimeout(scannerTimeoutRef.current);
        }

        // Set timeout to detect end of barcode (scanners send quickly)
        scannerTimeoutRef.current = setTimeout(() => {
          if (scannedBarcode.length > 3) {
            // Min barcode length
            processScannedBarcode(scannedBarcode);
          }
          setScannedBarcode(""); // Reset for next scan
        }, 50); // Scanners typically send characters very quickly (20-50ms)
      }

      // Handle Enter key (some scanners send Enter at the end)
      if (e.key === "Enter" && scannedBarcode.length > 3) {
        e.preventDefault(); // Prevent default form submission
        processScannedBarcode(scannedBarcode);
        setScannedBarcode("");
      }
    };

    const processScannedBarcode = (barcode: string) => {
      // Clean up barcode (remove any trailing newline/enter)
      const cleanBarcode = barcode.trim().replace(/\r?\n|\r/g, "");

      // Find product by barcode/SKU
      const productToAdd = products.find(
        (product) => product.sku === cleanBarcode
      );

      if (productToAdd) {
        // Add product to cart
        addToCart(productToAdd);

        // Optional: Provide visual feedback
        flashProductCard(productToAdd.id);

        // Update barcode input field (optional)
        setBarcodeInput(cleanBarcode);
      } else {
        // If product not found in current view, search for it
        setBarcodeInput(cleanBarcode);
        setTimeout(() => handleBarcodeSearch(), 100);
      }
    };

    // Add global event listener
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
    };
  }, [
    products,
    addToCart,
    handleBarcodeSearch,
    setBarcodeInput,
    scannedBarcode,
  ]);

  // Function to provide visual feedback when product is scanned
  const flashProductCard = useCallback((productId: string) => {
    const element = document.querySelector(`[data-product-id="${productId}"]`);
    if (element) {
      element.classList.add("bg-primary/10", "border-primary");
      setTimeout(() => {
        element.classList.remove("bg-primary/10", "border-primary");
      }, 500);
    }
  }, []);

  // Handle manual barcode input (from the input field)
  const handleManualBarcodeSearch = () => {
    if (barcodeInput.trim()) {
      const productToAdd = products.find(
        (product) => product.sku === barcodeInput.trim()
      );

      if (productToAdd) {
        addToCart(productToAdd);
        flashProductCard(productToAdd.id);
        setBarcodeInput("");
      } else {
        handleBarcodeSearch();
      }
    }
  };

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
                  onChange={(e) => {
                    setBarcodeInput(e.target.value);
                    isTypingRef.current = true; // Mark as manual typing
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleManualBarcodeSearch();
                    }
                  }}
                  onFocus={() => {
                    isTypingRef.current = true; // Mark as manual typing when focused
                  }}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleManualBarcodeSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Point barcode scanner anywhere on this page to add products
            </p>
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
          {products.map((product) => {
            const prices = getPriceDisplay(product);

            return (
              <Card
                key={product.id}
                data-product-id={product.id}
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="aspect-video bg-transparent rounded-lg mb-3 flex items-center justify-center">
                    {product.images?.[0] ? (
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
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    SKU: {product.sku}
                  </p>

                  {/* Price Display */}
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        R{prices.afterTax.toFixed(2)}
                      </span>
                      <Badge
                        variant={
                          product.stock > 10 ? "secondary" : "destructive"
                        }
                      >
                        {product.stock} in stock
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Before VAT: R{prices.beforeTax.toFixed(2)}
                    </div>
                  </div>

                  {/* Stock Status */}
                  {product.stock <= (product.minStock || 5) &&
                    product.stock > 0 && (
                      <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        ⚠️ Low stock
                      </div>
                    )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
