"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tag, Calendar, Box, Wrench } from "lucide-react";
import Link from "next/link";
import { Subpackage } from "../../../types";

interface SubpackageOverviewTabProps {
  subpackage: Subpackage;
}

export default function SubpackageOverviewTab({
  subpackage,
}: SubpackageOverviewTabProps) {
  const totalProducts = subpackage.products?.length || 0;
  const totalServices = subpackage.services?.length || 0;
  const hasDiscount = subpackage.discount && subpackage.discountType;

  return (
    <>
      {/* Pricing & Duration */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Pricing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-lg font-semibold">
                  R{Number(subpackage.price).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Original Price</p>
                <p className="text-lg font-semibold">
                  {subpackage.originalPrice
                    ? `R${Number(subpackage.originalPrice).toLocaleString()}`
                    : "-"}
                </p>
              </div>
            </div>

            {hasDiscount && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Discount</p>
                    <p className="text-lg font-semibold">
                      {subpackage.discount}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Discount Type
                    </p>
                    <p className="text-lg font-semibold capitalize">
                      {subpackage.discountType}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  You save R
                  {subpackage.originalPrice
                    ? (
                        Number(subpackage.originalPrice) -
                        Number(subpackage.price)
                      ).toLocaleString()
                    : "0"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Duration & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">
                {subpackage.duration || "No duration specified"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Sort Order</p>
              <p className="text-lg font-semibold">{subpackage.sortOrder}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(subpackage.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {new Date(subpackage.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Products Summary
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {totalProducts} products included
            </p>
          </CardHeader>
          <CardContent>
            {totalProducts === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No products added yet
              </p>
            ) : (
              <div className="space-y-3">
                {subpackage.products?.slice(0, 3).map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Box className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {product.quantity || 1} • R
                          {(
                            product.price ||
                            product.unitPrice ||
                            0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                ))}
                {totalProducts > 3 && (
                  <Button variant="ghost" className="w-full">
                    View all {totalProducts} products
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Services Summary
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {totalServices} services included
            </p>
          </CardHeader>
          <CardContent>
            {totalServices === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No services added yet
              </p>
            ) : (
              <div className="space-y-3">
                {subpackage.services?.slice(0, 3).map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Duration: {service.duration || "N/A"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{service.category}</Badge>
                  </div>
                ))}
                {totalServices > 3 && (
                  <Button variant="ghost" className="w-full">
                    View all {totalServices} services
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
