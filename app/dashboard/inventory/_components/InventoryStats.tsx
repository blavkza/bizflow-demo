import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/types/product";
import { Package, DollarSign, Grid3X3, TrendingUp } from "lucide-react";

interface InventoryStatsProps {
  products: Product[];
}

export function InventoryStats({ products }: InventoryStatsProps) {
  const totalProducts = products.length;
  // Ensure price is treated as number by using Number() or parseFloat()
  const totalValue = products.reduce(
    (sum, product) => sum + Number(product.price),
    0
  );
  const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;
  const categories = new Set(products.map((p) => p.category)).size;

  const stats = [
    {
      title: "Total Products",
      value: totalProducts.toString(),
      icon: Package,
      description: "Items in inventory",
    },
    {
      title: "Total Value",
      value: `R${totalValue.toFixed(2)}`,
      icon: DollarSign,
      description: "Combined product value",
    },
    {
      title: "Average Price",
      value: `R${avgPrice.toFixed(2)}`,
      icon: TrendingUp,
      description: "Average per product",
    },
    {
      title: "Categories",
      value: categories.toString(),
      icon: Grid3X3,
      description: "Product categories",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
