"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, ShoppingCart, ArrowUpRight, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Subpackage } from "../../../types";

interface SubpackageStatsCardsProps {
  subpackage: Subpackage;
}

export default function SubpackageStatsCards({
  subpackage,
}: SubpackageStatsCardsProps) {
  const totalProducts = subpackage.products?.length || 0;
  const totalServices = subpackage.services?.length || 0;
  const totalItems = totalProducts + totalServices;
  const hasDiscount = subpackage.discount && subpackage.discountType;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">
                  R{Number(subpackage.price).toLocaleString()}
                </span>
                {subpackage.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    R{Number(subpackage.originalPrice).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
          {hasDiscount && (
            <Badge className="mt-2 bg-green-100 text-green-800">
              Save {subpackage.discount}%
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sales</p>
              <p className="text-2xl font-bold">{subpackage.salesCount}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold">
                R{Number(subpackage.revenue).toLocaleString()}
              </p>
            </div>
            <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalProducts} products • {totalServices} services
              </p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
