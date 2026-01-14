"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FolderIcon,
  PackageIcon,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  ImageIcon,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryDialog } from "./category-dialog";
import { PackageCategoryWithStats } from "@/types/PackageCategory";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: PackageCategoryWithStats;
  level: number;
  onDelete: (category: PackageCategoryWithStats) => void;
  onDuplicate: (category: PackageCategoryWithStats) => void;
  deletingId: string | null;
  onUpdate: () => void;
  allCategories: PackageCategoryWithStats[];
  viewType: "list" | "tree";
}

export function CategoryCard({
  category,
  level,
  onDelete,
  onDuplicate,
  deletingId,
  onUpdate,
  allCategories,
  viewType,
}: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const hasChildren = category.children && category.children.length > 0;
  const hasPackages = category.packages && category.packages.length > 0;
  const isDeleting = deletingId === category.id;
  const hasThumbnail = !!category.thumbnail;

  // Calculate category stats from packages
  const categoryStats = {
    packageCount: category.packages?.length || 0,
    totalSales:
      category.packages?.reduce((sum, pkg) => sum + (pkg.salesCount || 0), 0) ||
      0,
    totalRevenue:
      category.packages?.reduce(
        (sum, pkg) => sum + Number(pkg.totalRevenue || 0),
        0
      ) || 0,
  };

  const statusColor = {
    ACTIVE: "bg-green-100 text-green-800 border-green-200",
    INACTIVE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ARCHIVED: "bg-gray-100 text-gray-800 border-gray-200",
  }[category.status];

  const parentCategory = allCategories.find(
    (cat) => cat.id === category.parentId
  );

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden",
          level > 0 && viewType === "tree" && "ml-8 border-l-2 border-l-muted"
        )}
        style={viewType === "tree" ? { marginLeft: `${level * 2}rem` } : {}}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {viewType === "tree" && hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              <div className="flex items-center gap-2">
                {/* Thumbnail or Folder Icon */}
                {hasThumbnail ? (
                  <div className="relative h-10 w-10 rounded-md overflow-hidden border">
                    <Image
                      src={category.thumbnail!}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <FolderIcon
                    className={cn(
                      "h-5 w-5",
                      category.status === "ACTIVE"
                        ? "text-blue-500"
                        : category.status === "INACTIVE"
                          ? "text-yellow-500"
                          : "text-gray-500"
                    )}
                  />
                )}
                <CardTitle className="text-base font-medium">
                  {category.name}
                </CardTitle>
              </div>
              <Badge variant="outline" className={statusColor}>
                {category.status.toLowerCase()}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(category)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(category)}
                  className="text-red-600 focus:text-red-600"
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {parentCategory && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Parent:</span>
              <Badge variant="outline" className="text-xs">
                {parentCategory.name}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="pb-3">
          {category.description && (
            <p className="text-sm text-muted-foreground mb-3">
              {category.description}
            </p>
          )}

          {/* Large thumbnail preview for list view */}
          {viewType === "list" && hasThumbnail && (
            <div className="mb-3">
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                <Image
                  src={category.thumbnail!}
                  alt={`${category.name} thumbnail`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {/* Package Count */}
            {hasPackages ? (
              <Badge variant="secondary" className="gap-1">
                <PackageIcon className="h-3 w-3" />
                {categoryStats.packageCount} package(s)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                No packages
              </Badge>
            )}

            {/* Sales Count */}
            {categoryStats.totalSales > 0 && (
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {categoryStats.totalSales.toLocaleString()} sales
              </Badge>
            )}

            {/* Revenue */}
            {categoryStats.totalRevenue > 0 && (
              <Badge variant="outline" className="gap-1">
                <DollarSign className="h-3 w-3" />$
                {categoryStats.totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Badge>
            )}

            {/* Children Count */}
            {hasChildren && viewType === "list" && (
              <Badge variant="outline">
                {category.children!.length} sub-category(ies)
              </Badge>
            )}

            {/* Sort Order */}
            {category.sortOrder !== undefined && (
              <Badge variant="outline">Order: {category.sortOrder}</Badge>
            )}

            {/* Thumbnail Indicator */}
            {hasThumbnail ? (
              <Badge variant="outline" className="gap-1">
                <ImageIcon className="h-3 w-3" />
                Has thumbnail
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <ImageIcon className="h-3 w-3" />
                No thumbnail
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recursively render children in tree view */}
      {viewType === "tree" &&
        expanded &&
        hasChildren &&
        category.children!.map((child) => (
          <CategoryCard
            key={child.id}
            category={child}
            level={level + 1}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            deletingId={deletingId}
            onUpdate={onUpdate}
            allCategories={allCategories}
            viewType="tree"
          />
        ))}

      {/* Edit Dialog */}
      <CategoryDialog
        category={category}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          onUpdate();
          setIsEditDialogOpen(false);
        }}
      />
    </>
  );
}
