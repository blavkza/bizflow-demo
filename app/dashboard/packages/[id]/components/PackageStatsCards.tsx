"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Package, Tag } from "lucide-react";
import { PackageData } from "../types";

interface PackageStatsCardsProps {
  packageData: PackageData;
}

export default function PackageStatsCards({
  packageData,
}: PackageStatsCardsProps) {
  const avgSubpackagePrice =
    packageData.subpackages.length > 0
      ? packageData.subpackages.reduce((sum, sp) => sum + sp.price, 0) /
        packageData.subpackages.length
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{packageData.salesCount}</div>
          <p className="text-xs text-muted-foreground">
            Across all subpackages
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R{packageData.totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Lifetime revenue</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subpackages</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {packageData.subpackages.length}
          </div>
          <p className="text-xs text-muted-foreground">Active pricing tiers</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg. Package Price
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R{avgSubpackagePrice.toFixed(0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Average subpackage price
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
