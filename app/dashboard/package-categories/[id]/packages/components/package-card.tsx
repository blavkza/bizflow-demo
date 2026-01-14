"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Loader2,
  PackageIcon,
  ImageIcon,
  ShoppingBag,
  TrendingUp,
  Clock,
  Tag,
  Users,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { PackageWithStats } from "@/types/package";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { PackageDialog } from "./package-dialog";

// Helper function to safely convert totalRevenue to number
function getTotalRevenueNumber(totalRevenue: any): number {
  if (typeof totalRevenue === "number") {
    return totalRevenue;
  }
  if (
    typeof totalRevenue === "object" &&
    totalRevenue !== null &&
    "toNumber" in totalRevenue
  ) {
    return totalRevenue.toNumber();
  }
  if (typeof totalRevenue === "string") {
    return parseFloat(totalRevenue) || 0;
  }
  return 0;
}

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
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
        variant: "secondary" as const,
      };
    case "DRAFT":
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="h-3 w-3 mr-1" />,
        variant: "warning" as const,
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: null,
        variant: "secondary" as const,
      };
  }
}

function getClassificationConfig(classification: string) {
  switch (classification) {
    case "Class 1 A":
      return {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        variant: "purple" as const,
      };
    case "Class 1 B":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        variant: "blue" as const,
      };
    case "Class 2 A":
      return {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        variant: "orange" as const,
      };
    case "Class 2 B":
      return {
        color: "bg-pink-100 text-pink-800 border-pink-200",
        variant: "pink" as const,
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        variant: "secondary" as const,
      };
  }
}

interface PackageCardProps {
  pkg: PackageWithStats;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (pkg: PackageWithStats) => Promise<void>;
  onUpdate?: () => void;
  deletingId: string | null;
  duplicatingId?: string | null;
}

export function PackageCard({
  pkg,
  onDelete,
  onDuplicate,
  onUpdate,
  deletingId,
  duplicatingId,
}: PackageCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const statusConfig = getStatusConfig(pkg.status);
  const classificationConfig = pkg.classification
    ? getClassificationConfig(pkg.classification)
    : null;

  const isPackageDuplicating = duplicatingId === pkg.id;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  const calculatePopularityScore = () => {
    const revenue = getTotalRevenueNumber(pkg.totalRevenue);
    const score = pkg.salesCount * 2 + Math.min(revenue / 1000, 100);
    return Math.min(Math.round(score), 100);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this package?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(pkg.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await onDuplicate(pkg);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleEditSuccess = () => {
    if (onUpdate) {
      onUpdate();
    }
    toast({
      title: "Package updated",
      description: "Package has been updated successfully.",
    });
  };

  const revenue = getTotalRevenueNumber(pkg.totalRevenue);
  const popularityScore = calculatePopularityScore();
  const hasTags = pkg.tags && pkg.tags.length > 0;
  const hasBenefits = pkg.benefits && pkg.benefits.length > 0;

  return (
    <>
      <TooltipProvider>
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border hover:border-primary/20 group">
          {/* Package Image with Overlay */}
          <div className="relative h-48 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
            {pkg.thumbnail && !imageError ? (
              <div className="relative h-full w-full">
                <img
                  src={pkg.thumbnail}
                  alt={pkg.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="relative">
                  <ImageIcon className="h-20 w-20 text-muted-foreground/30" />
                  <PackageIcon className="h-10 w-10 text-muted-foreground/50 absolute inset-0 m-auto" />
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              <Badge
                className={`${statusConfig.color} border flex items-center px-2 py-1`}
              >
                {statusConfig.icon}
                {pkg.status.charAt(0) + pkg.status.slice(1).toLowerCase()}
              </Badge>
            </div>

            {/* Classification Badge */}
            {classificationConfig && (
              <div className="absolute top-3 left-3">
                <Badge
                  className={`${classificationConfig.color} border px-2 py-1`}
                >
                  {pkg.classification}
                </Badge>
              </div>
            )}

            {/* Featured Badge */}
            {pkg.featured && (
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 border-amber-200 px-2 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}

            {/* Quick Stats Overlay */}
            {/*  <div className="absolute bottom-3 right-3 flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="bg-white/90 dark:bg-slate-600 backdrop-blur-sm"
                  >
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    {pkg.salesCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Total Sales</TooltipContent>
              </Tooltip>

              {revenue > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {formatCurrency(revenue)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Total Revenue</TooltipContent>
                </Tooltip>
              )}
            </div> */}
          </div>

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold line-clamp-1">
                    {pkg.name}
                  </CardTitle>
                </div>

                <div className="text-sm text-muted-foreground line-clamp-2">
                  {pkg.shortDescription || "No description"}
                </div>

                {/* Package Type and Category */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {pkg.category && (
                    <Badge variant="outline" className="text-xs">
                      {pkg.category.name}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {pkg.packageType.replace("_", " ")}
                  </Badge>
                  {pkg.isPublic ? (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-50 text-green-700 border-green-200"
                    >
                      Public
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs bg-gray-50 text-gray-700 border-gray-200"
                    >
                      Private
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
                  <DropdownMenuLabel>Package Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/packages/${pkg.id}`}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowEditDialog(true)}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Package
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    disabled={isDuplicating}
                    className="cursor-pointer"
                  >
                    {isDuplicating || isPackageDuplicating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={handleDelete}
                    disabled={isDeleting || deletingId === pkg.id}
                  >
                    {isDeleting || deletingId === pkg.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete Package
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="pb-3">
            <div className="space-y-4">
              {/* Subpackages and Popularity */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <PackageIcon className="h-4 w-4" />
                        <span className="font-medium">
                          {pkg.subpackageCount || 0}
                        </span>
                        <span className="hidden sm:inline">subpackages</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Number of subpackages</TooltipContent>
                  </Tooltip>

                  {hasTags && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Tag className="h-4 w-4" />
                          <span className="font-medium">
                            {pkg.tags?.length || 0}
                          </span>
                          <span className="hidden sm:inline">tags</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Number of tags</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Popularity Indicator */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <Progress value={popularityScore} className="h-2" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {popularityScore}%
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Popularity based on sales and revenue
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-md font-bold text-primary">
                    {pkg.salesCount}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Sales
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-md font-bold text-primary">
                    {formatCurrency(revenue)}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Revenue
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              {pkg.updatedAt && (
                <div className="text-xs text-muted-foreground text-center">
                  Updated {formatDate(pkg.updatedAt)}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="pt-0">
            <Button
              className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 transition-all duration-200 group"
              asChild
            >
              <Link href={`/dashboard/packages/${pkg.id}`}>
                <div className="flex items-center justify-center w-full">
                  <span>View Package Details</span>
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </TooltipProvider>

      {/* Edit Package Dialog */}
      {showEditDialog && (
        <PackageDialog
          mode="edit"
          packageData={pkg}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
