"use client";

import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

const statusOptions = ["All Status", "Active", "Draft", "Inactive"];
const classifications = [
  "All Classes",
  "Class 1 A",
  "Class 1 B",
  "Class 2 A",
  "Class 2 B",
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FiltersSectionProps {
  searchQuery: string;
  statusFilter: string;
  classificationFilter: string;
  categoryFilter: string;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClassificationChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
  packages?: Array<{
    category?: {
      id: string;
      name: string;
    } | null;
  }> | null;
}

export function FiltersSection({
  searchQuery,
  statusFilter,
  classificationFilter,
  categoryFilter,
  filteredCount,
  totalCount,
  onSearchChange,
  onStatusChange,
  onClassificationChange,
  onCategoryChange,
  onClearFilters,
  packages = [],
}: FiltersSectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Extract unique categories from packages
  useEffect(() => {
    if (packages && packages.length > 0) {
      const uniqueCategoriesMap = new Map<string, Category>();

      packages.forEach((pkg) => {
        if (pkg.category) {
          // Use category id as key to ensure uniqueness
          if (!uniqueCategoriesMap.has(pkg.category.id)) {
            uniqueCategoriesMap.set(pkg.category.id, {
              id: pkg.category.id,
              name: pkg.category.name,
              slug: pkg.category.name.toLowerCase().replace(/\s+/g, "-"),
            });
          }
        }
      });

      // Convert map to array and sort by name
      const sortedCategories = Array.from(uniqueCategoriesMap.values()).sort(
        (a, b) => a.name.localeCompare(b.name)
      );

      setCategories(sortedCategories);
    }
  }, [packages]);

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    classificationFilter !== "all" ||
    categoryFilter !== "all";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h3 className="text-sm font-medium">Filters</h3>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {filteredCount} of {totalCount}
                </Badge>
              )}
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search packages..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem
                      key={status}
                      value={
                        status === "All Status" ? "all" : status.toLowerCase()
                      }
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Classification</label>
              <Select
                value={classificationFilter}
                onValueChange={onClassificationChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  {classifications.map((classification) => (
                    <SelectItem
                      key={classification}
                      value={
                        classification === "All Classes"
                          ? "all"
                          : classification
                      }
                    >
                      {classification}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={onCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading categories...
                    </SelectItem>
                  ) : categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No categories found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
