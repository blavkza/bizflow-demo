"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import {
  ChevronLeft,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  Box,
  Wrench,
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  ArrowUpRight,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import {
  getSubpackage,
  deleteSubpackage,
  duplicateSubpackage,
} from "../../actions";
import { Subpackage } from "../../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SubpackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [subpackage, setSubpackage] = useState<Subpackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  console.log(subpackage);

  useEffect(() => {
    fetchSubpackage();
  }, [params.subpackageId]);

  async function fetchSubpackage() {
    try {
      setLoading(true);
      const data = await getSubpackage(params.subpackageId as string);
      setSubpackage(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subpackage"
      );
      toast({
        title: "Error",
        description: "Failed to load subpackage details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteSubpackage(params.subpackageId as string);

      toast({
        title: "Subpackage deleted",
        description: "The subpackage has been deleted successfully.",
      });

      router.push(`/packages/${params.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subpackage",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setIsDuplicating(true);
      if (!subpackage) return;

      const duplicateData = {
        name: `${subpackage.name} (Copy)`,
        description: subpackage.description || undefined,
        shortDescription: subpackage.shortDescription || undefined,
        price: subpackage.price,
        originalPrice: subpackage.originalPrice || undefined,
        discount: subpackage.discount || undefined,
        discountType: subpackage.discountType || undefined,
        duration: subpackage.duration || undefined,
        isDefault: false,
        sortOrder: (subpackage.sortOrder || 0) + 1,
        status: "DRAFT",
        features: subpackage.features || [],
        products:
          subpackage.products?.map((p) => ({
            id: p.id,
            quantity: p.quantity || 1,
            unitPrice: p.unitPrice || undefined,
          })) || [],
        services:
          subpackage.services?.map((s) => ({
            id: s.id,

            unitPrice: s.price || undefined,
          })) || [],
        packageId: subpackage.packageId,
      };

      await duplicateSubpackage(subpackage.id, duplicateData);

      toast({
        title: "Subpackage duplicated",
        description: "The subpackage has been duplicated successfully.",
      });

      fetchSubpackage();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate subpackage",
        variant: "destructive",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800";
    }
  };

  if (error) {
    return (
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Error loading subpackage</h3>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button
              className="mt-4"
              onClick={() => router.push(`/dashboard/packages/${params.id}`)}
            >
              Back to Package
            </Button>
          </div>
        </div>
      </SidebarInset>
    );
  }

  if (loading || !subpackage) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Skeleton className="h-9 w-32" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </SidebarInset>
    );
  }

  const totalProducts = subpackage.products?.length || 0;
  const totalServices = subpackage.services?.length || 0;
  const totalItems = totalProducts + totalServices;
  const hasDiscount = subpackage.discount && subpackage.discountType;

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/packages/${params.id}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Package
            </Link>
          </Button>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Subpackage Details</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {subpackage.name}
              </h1>
              <div className="flex gap-2">
                <Badge className={getStatusColor(subpackage.status)}>
                  {subpackage.status}
                </Badge>
                {subpackage.isDefault && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    Default
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-muted-foreground mt-1">
              {subpackage.description || "No description available"}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDuplicate}
              disabled={isDuplicating}
            >
              <Copy className="h-4 w-4 mr-2" />
              {isDuplicating ? "Duplicating..." : "Duplicate"}
            </Button>

            <Button variant="outline" asChild>
              <Link
                href={`/packages/${params.id}/subpackages/${params.subpackageId}/edit`}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/packages/${params.id}/subpackages/${params.subpackageId}/orders`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    View Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/packages/${params.id}/subpackages/${params.subpackageId}/analytics`}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Subpackage
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">
              Products ({totalProducts})
            </TabsTrigger>
            <TabsTrigger value="services">
              Services ({totalServices})
            </TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
                      <p className="text-sm text-muted-foreground">
                        Current Price
                      </p>
                      <p className="text-lg font-semibold">
                        R{Number(subpackage.price).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Original Price
                      </p>
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
                          <p className="text-sm text-muted-foreground">
                            Discount
                          </p>
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
                    <p className="text-lg font-semibold">
                      {subpackage.sortOrder}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="text-sm">
                        {new Date(subpackage.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Last Updated
                      </p>
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
                  <CardDescription>
                    {totalProducts} products included
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {totalProducts === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No products added yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {subpackage.products
                        ?.slice(0, 3)
                        .map((product, index) => (
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
                        <Button variant="ghost" className="w-full" asChild>
                          <Link
                            href={`/packages/${params.id}/subpackages/${params.subpackageId}?tab=products`}
                          >
                            View all {totalProducts} products
                          </Link>
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
                  <CardDescription>
                    {totalServices} services included
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {totalServices === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No services added yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {subpackage.services
                        ?.slice(0, 3)
                        .map((service, index) => (
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
                        <Button variant="ghost" className="w-full" asChild>
                          <Link
                            href={`/packages/${params.id}/subpackages/${params.subpackageId}?tab=services`}
                          >
                            View all {totalServices} services
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  {totalProducts} products included in this subpackage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {totalProducts === 0 ? (
                  <div className="text-center py-8">
                    <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No products yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add products to this subpackage to see them here
                    </p>
                    <Button asChild>
                      <Link
                        href={`/packages/${params.id}/subpackages/${params.subpackageId}/edit`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Subpackage
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subpackage.products?.map((product, index) => {
                        const unitPrice =
                          product.price || product.unitPrice || 0;
                        const quantity = product.quantity || 1;
                        const total = unitPrice * quantity;

                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Box className="h-4 w-4 text-muted-foreground" />
                                {product.name}
                              </div>
                              {product.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {product.description}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              {product.category || "Uncategorized"}
                            </TableCell>
                            <TableCell>
                              {product.sku ? (
                                <code className="text-xs bg-muted px-1 rounded">
                                  {product.sku}
                                </code>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No SKU
                                </span>
                              )}
                            </TableCell>
                            <TableCell>R{unitPrice.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{quantity}</Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              R{total.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  product.stock > 0 ? "outline" : "destructive"
                                }
                                className={
                                  product.stock > 0
                                    ? "bg-green-50 text-green-700"
                                    : ""
                                }
                              >
                                {product.stock}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>
                  {totalServices} services included in this subpackage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {totalServices === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No services yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add services to this subpackage to see them here
                    </p>
                    <Button asChild>
                      <Link
                        href={`/packages/${params.id}/subpackages/${params.subpackageId}/edit`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Subpackage
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Features</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subpackage.services?.map((service, index) => {
                        const price = service.amount || service.price || 0;

                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-muted-foreground" />
                                {service.name}
                              </div>
                              {service.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {service.description}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              {service.category || "Uncategorized"}
                            </TableCell>
                            <TableCell>{service.duration || "N/A"}</TableCell>
                            <TableCell className="font-semibold">
                              R{price.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {service.features &&
                              service.features.length > 0 ? (
                                <div className="max-w-xs">
                                  <span className="text-xs text-muted-foreground line-clamp-1">
                                    {service.features.slice(0, 3).join(", ")}
                                    {service.features.length > 3 && "..."}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No features
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  Features included in this subpackage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subpackage.features?.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No features defined
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add features to this subpackage to highlight its benefits
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {subpackage.features?.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subpackage Settings</CardTitle>
                <CardDescription>
                  Manage subpackage configuration and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Subpackage ID</p>
                      <p className="text-sm text-muted-foreground">
                        Unique identifier for this subpackage
                      </p>
                    </div>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {subpackage.id}
                    </code>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Package</p>
                      <p className="text-sm text-muted-foreground">
                        Parent package of this subpackage
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/packages/${params.id}`}>View Package</Link>
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Default Subpackage</p>
                      <p className="text-sm text-muted-foreground">
                        When enabled, this subpackage will be selected by
                        default
                      </p>
                    </div>
                    <Badge
                      variant={subpackage.isDefault ? "default" : "outline"}
                    >
                      {subpackage.isDefault ? "Yes" : "No"}
                    </Badge>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-medium mb-2">Notes</p>
                    {subpackage.notes ? (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-muted-foreground">
                          {subpackage.notes}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No notes added
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Subpackage"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subpackage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{subpackage.name}"? This action
              cannot be undone. This will remove the subpackage from the package
              but will not delete the products or services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Subpackage"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  );
}
