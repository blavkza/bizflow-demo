"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Package,
  CreditCard,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import Image from "next/image";

// Mock shareable shop data
const shopData = {
  id: "shop-123",
  name: "TechStore Pro",
  description: "Your one-stop shop for premium electronics and gadgets",
  logo: "/placeholder.svg?height=80&width=80",
  banner: "/placeholder.svg?height=300&width=1200",
  contact: {
    phone: "+27 11 123 4567",
    email: "info@techstore.com",
    address: "123 Tech Street, Johannesburg, 2000",
  },
  products: [
    {
      id: "1",
      name: "Wireless Bluetooth Headphones",
      description:
        "Premium quality wireless headphones with noise cancellation",
      price: 1299.99,
      originalPrice: 1599.99,
      discount: 19,
      stock: 45,
      rating: 4.5,
      reviewCount: 127,
      image: "/placeholder.svg?height=300&width=300",
      category: "Audio",
    },
    {
      id: "2",
      name: "Smart Fitness Watch",
      description: "Advanced fitness tracking with heart rate monitor",
      price: 2499.99,
      originalPrice: 2999.99,
      discount: 17,
      stock: 23,
      rating: 4.3,
      reviewCount: 89,
      image: "/placeholder.svg?height=300&width=300",
      category: "Wearables",
    },
    {
      id: "3",
      name: "Portable Power Bank",
      description: "20000mAh fast charging power bank",
      price: 599.99,
      originalPrice: 799.99,
      discount: 25,
      stock: 67,
      rating: 4.7,
      reviewCount: 203,
      image: "/placeholder.svg?height=300&width=300",
      category: "Accessories",
    },
    {
      id: "4",
      name: "Wireless Gaming Mouse",
      description: "High-precision gaming mouse with RGB lighting",
      price: 899.99,
      stock: 34,
      rating: 4.4,
      reviewCount: 156,
      image: "/placeholder.svg?height=300&width=300",
      category: "Gaming",
    },
  ],
};

export default function ShareableShopPage() {
  const params = useParams();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    ...Array.from(new Set(shopData.products.map((p) => p.category))),
  ];

  const filteredProducts = shopData.products.filter(
    (product) =>
      selectedCategory === "All" || product.category === selectedCategory
  );

  const addToCart = (productId: string) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      const newCart = { ...cart };
      delete newCart[productId];
      setCart(newCart);
    } else {
      setCart((prev) => ({
        ...prev,
        [productId]: quantity,
      }));
    }
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = shopData.products.find((p) => p.id === productId);
      return total + (product?.price || 0) * quantity;
    }, 0);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src={shopData.logo || "/placeholder.svg"}
                alt={shopData.name}
                width={80}
                height={80}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-3xl font-bold">{shopData.name}</h1>
                <p className="text-muted-foreground">{shopData.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Phone className="h-4 w-4 mr-1" />
                  {shopData.contact.phone}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4 mr-1" />
                  {shopData.contact.email}
                </div>
              </div>
              {getTotalItems() > 0 && (
                <div className="relative">
                  <Button variant="outline" className="relative bg-transparent">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Cart ({getTotalItems()})
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {getTotalItems()}
                    </Badge>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
        <Image
          src={shopData.banner || "/placeholder.svg"}
          alt="Shop Banner"
          fill
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-2">
              Welcome to {shopData.name}
            </h2>
            <p className="text-xl">Discover amazing products at great prices</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="flex items-center space-x-4 mb-8">
          <Label className="font-medium">Categories:</Label>
          <div className="flex space-x-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-0">
                <div className="relative">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  {product.discount && (
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      {product.discount}% OFF
                    </Badge>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1">
                    {renderStars(product.rating)}
                    <span className="text-sm text-muted-foreground">
                      ({product.reviewCount})
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">
                        R{product.price.toFixed(2)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          R{product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      {product.stock > 0 ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">
                            In Stock ({product.stock})
                          </span>
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">Out of Stock</span>
                        </>
                      )}
                    </div>
                  </div>

                  {cart[product.id] ? (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(product.id, cart[product.id] - 1)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-3 py-1 border rounded text-center min-w-[3rem]">
                        {cart[product.id]}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(product.id, cart[product.id] + 1)
                        }
                        disabled={cart[product.id] >= product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => addToCart(product.id)}
                      className="w-full"
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cart Summary */}
        {getTotalItems() > 0 && (
          <Card className="sticky bottom-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cart Summary</span>
                <Badge variant="secondary">{getTotalItems()} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(cart).map(([productId, quantity]) => {
                  const product = shopData.products.find(
                    (p) => p.id === productId
                  );
                  if (!product) return null;
                  return (
                    <div
                      key={productId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            R{product.price.toFixed(2)} x {quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold">
                        R{(product.price * quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>R{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex space-x-2">
                  <Button className="flex-1">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Checkout
                  </Button>
                  <Button variant="outline" onClick={() => setCart({})}>
                    Clear Cart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shop Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">
                    {shopData.contact.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">
                    {shopData.contact.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">
                    {shopData.contact.address}
                  </p>
                </div>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Free Shipping</p>
                  <p className="text-sm text-muted-foreground">
                    On orders over R500
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Easy Returns</p>
                  <p className="text-sm text-muted-foreground">
                    30-day return policy
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Secure Payment</p>
                  <p className="text-sm text-muted-foreground">
                    SSL encrypted checkout
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
