"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Globe, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { Vendor } from "../type";
import { cn } from "@/lib/utils";
import { ProductCategory, VendorStatus } from "@prisma/client";

interface VendorTableProps {
  vendors: Vendor[];
  loading: boolean;
}

export function VendorTable({ vendors, loading }: VendorTableProps) {
  const getCategoryNames = (categories: Vendor["categories"]): string[] => {
    if (!categories) return [];
    if (Array.isArray(categories)) {
      if (categories.length === 0) return [];
      if (typeof categories[0] === "string") {
        return categories as string[];
      } else {
        return (categories as ProductCategory[]).map((cat) => cat.name);
      }
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Vendor</TableHead>
            <TableHead className="w-[200px]">Contact</TableHead>
            <TableHead className="w-[150px]">Categories</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead className="w-[100px]">Expenses</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                {vendors.length === 0
                  ? "No vendors found. Create your first vendor!"
                  : "No vendors match your search."}
              </TableCell>
            </TableRow>
          ) : (
            vendors.map((vendor) => {
              const categoryNames = getCategoryNames(vendor.categories);

              return (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="font-medium">{vendor.name}</div>
                    {vendor.taxNumber && (
                      <div className="text-sm text-muted-foreground">
                        Tax: {vendor.taxNumber}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {vendor.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="text-sm truncate max-w-[180px]">
                            {vendor.email}
                          </span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="text-sm truncate max-w-[180px]">
                            {vendor.phone}
                          </span>
                        </div>
                      )}
                      {vendor.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3 flex-shrink-0" />
                          <span className="text-sm truncate max-w-[180px]">
                            {vendor.website}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {categoryNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {/* Show only first 2 categories */}
                        {categoryNames
                          .slice(0, 2)
                          .map((categoryName, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {categoryName}
                            </Badge>
                          ))}
                        {/* Show "+X more" badge if there are more than 2 categories */}
                        {categoryNames.length > 2 && (
                          <Badge
                            variant="secondary"
                            className="text-xs cursor-help"
                            title={`Also includes: ${categoryNames.slice(2).join(", ")}`}
                          >
                            +{categoryNames.length - 2} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        None
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="truncate max-w-[100px]">
                      {vendor.type || "SUPPLIER"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {vendor._count?.expenses || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        vendor.status === "ACTIVE" &&
                          "bg-green-500/10 text-green-700 border-green-200",
                        vendor.status === "INACTIVE" &&
                          "bg-gray-500/10 text-gray-700 border-gray-200",
                        vendor.status === VendorStatus.PROSPECT &&
                          "bg-yellow-500/10 text-yellow-700 border-yellow-200",
                        vendor.status === VendorStatus.PROSPECT &&
                          "bg-red-500/10 text-red-700 border-red-200"
                      )}
                    >
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" asChild className="h-8">
                        <Link href={`/dashboard/suppliers/${vendor.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
