"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FolderIcon,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  ExternalLink,
  Box,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Layers,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
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
  const [imageError, setImageError] = useState(false);

  const hasChildren = category.children && category.children.length > 0;
  const isDeleting = deletingId === category.id;
  const hasThumbnail = !!category.thumbnail;

  // Calculate category stats
  const categoryStats = {
    packageCount: category.packages?.length || 0,
    totalSales:
      category.packages?.reduce((sum, pkg) => {
        const sales =
          pkg.totalSales || pkg.salesCount || pkg._count?.orders || 0;
        return sum + sales;
      }, 0) || 0,
    totalRevenue:
      category.packages?.reduce((sum, pkg) => {
        const revenue = pkg.totalRevenue || 0;
        return sum + Number(revenue);
      }, 0) || 0,
  };

  // Calculate average revenue per package
  const avgRevenuePerPackage =
    categoryStats.packageCount > 0
      ? categoryStats.totalRevenue / categoryStats.packageCount
      : 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  function getStatusConfig(status: string) {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          variant: "success" as const,
        };
      case "INACTIVE":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          variant: "warning" as const,
        };
      case "ARCHIVED":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Clock className="h-3 w-3 mr-1" />,
          variant: "secondary" as const,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: null,
          variant: "secondary" as const,
        };
    }
  }

  const statusConfig = getStatusConfig(category.status);
  const parentCategory = allCategories.find(
    (cat) => cat.id === category.parentId
  );

  // Package categories link
  const packagesLink = `/dashboard/package-categories/${category.id}/packages`;

  const calculateUtilizationScore = () => {
    const packageScore = Math.min(categoryStats.packageCount * 2, 50);
    const revenueScore = Math.min(categoryStats.totalRevenue / 100, 50);
    return Math.min(packageScore + revenueScore, 100);
  };

  const utilizationScore = calculateUtilizationScore();

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "overflow-hidden hover:shadow-lg transition-all duration-200 border hover:border-primary/20 group",
          level > 0 && viewType === "tree" && "ml-8 border-l border-l-gray-300"
        )}
        style={viewType === "tree" ? { marginLeft: `${level * 2}rem` } : {}}
      >
        {/* Category Image/Icon Header */}
        <div className="relative h-48 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
          {hasThumbnail && !imageError ? (
            <div className="relative h-full w-full">
              <img
                src={category.thumbnail!}
                alt={category.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="relative">
                <ImageIcon className="h-20 w-20 text-muted-foreground/30" />
                <FolderIcon className="h-10 w-10 text-muted-foreground/50 absolute inset-0 m-auto" />
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge
              className={`${statusConfig.color} border flex items-center px-2 py-1`}
            >
              {statusConfig.icon}
              {category.status.charAt(0) +
                category.status.slice(1).toLowerCase()}
            </Badge>
          </div>

          {/* Expand/Collapse Button for Tree View */}
          {viewType === "tree" && hasChildren && (
            <div className="absolute bottom-3 left-3">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {/* Quick Stats Overlay */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="bg-white/90 backdrop-blur-sm"
                >
                  <Box className="h-3 w-3 mr-1" />
                  {categoryStats.packageCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Total Packages</TooltipContent>
            </Tooltip>

            {categoryStats.totalRevenue > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="bg-white/90 backdrop-blur-sm"
                  >
                    <Layers className="h-3 w-3 mr-1" />
                    {formatCurrency(categoryStats.totalRevenue)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Total Revenue</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold line-clamp-1">
                  {category.name}
                </CardTitle>
              </div>

              <div className="text-sm text-muted-foreground line-clamp-2">
                {category.description || "No description"}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {parentCategory && (
                  <Badge variant="outline" className="text-xs">
                    Parent: {parentCategory.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Category Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setIsEditDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Category
                </DropdownMenuItem>
                {/*   <DropdownMenuItem
                  onClick={() => onDuplicate(category)}
                  className="cursor-pointer"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Category
                </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={packagesLink} className="cursor-pointer w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View All Packages
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={() => onDelete(category)}
                  disabled={true}
                >
                  {isDeleting ? (
                    <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {isDeleting ? "Deleting..." : "Delete Category"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="space-y-4">
            {/* Utilization Score */}

            <Separator />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-md font-bold text-primary">
                  {formatNumber(categoryStats.totalSales)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Sales
                </div>
              </div>

              <div className="text-center">
                <div className="text-md font-bold text-primary">
                  {formatCurrency(categoryStats.totalRevenue)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Revenue
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-md font-bold text-primary">
                  {formatCurrency(avgRevenuePerPackage)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Avg/Package
                </div>
              </div>

              <div className="text-center">
                <div className="text-md font-bold text-primary">
                  {categoryStats.packageCount}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Packages
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 transition-all duration-200 group"
            asChild
          >
            <Link href={packagesLink}>
              <div className="flex items-center justify-center w-full">
                <span>View All Packages</span>
                <ExternalLink className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          </Button>
        </CardFooter>
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
    </TooltipProvider>
  );
}
