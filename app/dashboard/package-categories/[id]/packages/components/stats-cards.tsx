"use client";

import { PackageWithStats } from "@/types/package";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PackageIcon,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Star,
  BarChart3,
} from "lucide-react";

interface StatsCardsProps {
  packages: PackageWithStats[];
}

export function StatsCards({ packages }: StatsCardsProps) {
  const calculateStats = () => {
    if (!packages.length)
      return {
        totalPackages: 0,
        activePackages: 0,
        totalSales: 0,
        totalRevenue: 0,
        averageRevenuePerPackage: 0,
        featuredPackages: 0,
        draftPackages: 0,
        packagesByCategory: {},
      };

    const totalPackages = packages.length;
    const activePackages = packages.filter((p) => p.status === "ACTIVE").length;
    const draftPackages = packages.filter((p) => p.status === "DRAFT").length;
    const featuredPackages = packages.filter((p) => p.featured).length;

    const totalSales = packages.reduce((sum, pkg) => sum + pkg.salesCount, 0);

    // SAFELY convert Prisma Decimal, string, number, null → number
    const totalRevenue = packages.reduce((sum, pkg) => {
      let value = 0;

      if (
        typeof pkg.totalRevenue === "object" &&
        pkg.totalRevenue !== null &&
        "toNumber" in pkg.totalRevenue
      ) {
        value = pkg.totalRevenue.toNumber();
      } else {
        value = Number(pkg.totalRevenue) || 0;
      }

      return sum + value;
    }, 0);

    const averageRevenuePerPackage =
      totalPackages > 0 ? totalRevenue / totalPackages : 0;

    const packagesByCategory = packages.reduce(
      (acc, pkg) => {
        const categoryName = pkg.category?.name || "Uncategorized";
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalPackages,
      activePackages,
      draftPackages,
      featuredPackages,
      totalSales,
      totalRevenue: Number(totalRevenue),
      averageRevenuePerPackage: Number(averageRevenuePerPackage),
      packagesByCategory,
    };
  };

  const stats = calculateStats();

  const statCards = [
    {
      title: "Total Packages",
      value: stats.totalPackages,
      description: `${stats.activePackages} active`,
      icon: <PackageIcon className="h-4 w-4 text-muted-foreground" />,
      color: "bg-blue-500",
    },
    {
      title: "Total Sales",
      value: stats.totalSales,
      description: "Across all packages",
      icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" />,
      color: "bg-green-500",
    },
    {
      title: "Total Revenue",
      value: `R${Number(stats.totalRevenue).toFixed(2)}`,
      description: "From all packages",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      color: "bg-purple-500",
    },
    {
      title: "Avg Revenue",
      value: `R${Number(stats.averageRevenuePerPackage).toFixed(2)}`,
      description: "Per package",
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      color: "bg-orange-500",
    },
    {
      title: "Featured",
      value: stats.featuredPackages,
      description: "Highlighted packages",
      icon: <Star className="h-4 w-4 text-muted-foreground" />,
      color: "bg-yellow-500",
    },
    {
      title: "In Draft",
      value: stats.draftPackages,
      description: "Pending review",
      icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
      color: "bg-gray-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
