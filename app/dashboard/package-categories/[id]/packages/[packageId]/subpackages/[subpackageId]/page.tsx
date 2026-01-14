"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  ChevronLeft,
  Package,
  Copy,
  Trash2,
  Edit,
  ArrowLeft,
} from "lucide-react";
import {
  getSubpackage,
  deleteSubpackage,
  duplicateSubpackage,
} from "../../actions";
import { Subpackage } from "../../types";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import SubpackageForm from "../../components/subpackage-form";
import { Skeleton } from "@/components/ui/skeleton";
import SubpackageHeader from "./components/SubpackageHeader";

export default function SubpackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [subpackage, setSubpackage] = useState<Subpackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubpackage, setEditingSubpackage] = useState<Subpackage | null>(
    null
  );

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

      router.back();
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

  const handleFormSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingSubpackage(null);
    fetchSubpackage();
  };

  const handleFormCancel = () => {
    setIsEditDialogOpen(false);
    setEditingSubpackage(null);
  };

  const handleEditClick = (subpackage: Subpackage) => {
    setEditingSubpackage(subpackage);
    setIsEditDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (error) {
    return (
      <div className="p-4">
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Error loading subpackage</h3>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button onClick={() => router.back()}>Back to Package</Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !subpackage) {
    return (
      <div className="p-4">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Skeleton className="h-9 w-32" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const totalProducts = subpackage.products?.length || 0;
  const totalServices = subpackage.services?.length || 0;
  const totalFeatures = subpackage.features?.length || 0;

  const priceAfterDiscount = subpackage.discount
    ? subpackage.discountType === "PERCENTAGE"
      ? subpackage.price * (1 - subpackage.discount / 100)
      : subpackage.price - subpackage.discount
    : subpackage.price;

  // Fixed: Get product price from the correct fields
  const getProductUnitPrice = (product: Subpackage["products"][0]) => {
    // First check if there's a custom unitPrice for this package
    if (product.unitPrice !== null && product.unitPrice !== undefined) {
      return product.unitPrice;
    }
    // Otherwise use the product's standard price
    if (product.price !== null && product.price !== undefined) {
      return product.price;
    }
    return 0;
  };

  const getProductTotal = (product: Subpackage["products"][0]) => {
    const unitPrice = getProductUnitPrice(product);
    const quantity = product.quantity || 1;
    return unitPrice * quantity;
  };

  // Fixed: Get service price from the correct fields
  const getServicePrice = (service: Subpackage["services"][0]) => {
    // First check if there's a custom unitPrice for this package
    if (service.unitPrice !== null && service.unitPrice !== undefined) {
      return service.unitPrice;
    }
    // Otherwise use the service's standard price (called 'price' in the API response)
    if (service.price !== null && service.price !== undefined) {
      return service.price;
    }
    return 0;
  };

  const getServiceTotal = (service: Subpackage["services"][0]) => {
    const price = getServicePrice(service);
    const quantity = service.quantity || 1;
    return price * quantity;
  };

  // Calculate totals for the entire package
  const calculatePackageSubtotal = () => {
    let total = 0;

    // Add product totals
    if (subpackage.products) {
      subpackage.products.forEach((product) => {
        total += getProductTotal(product);
      });
    }

    // Add service totals
    if (subpackage.services) {
      subpackage.services.forEach((service) => {
        total += getServiceTotal(service);
      });
    }

    return total;
  };

  return (
    <div className="px-4">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          <Button variant={"ghost"} onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Package
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Header Section */}
        <SubpackageHeader
          subpackage={subpackage}
          onDuplicate={handleDuplicate}
          onEdit={() => handleEditClick(subpackage)}
          isDuplicating={isDuplicating}
          onDelete={() => setIsDeleteDialogOpen(true)}
          isDeleting={isDeleting}
          packageId={params.id as string}
          subpackageId={params.subpackageId as string}
        />

        {/* TABLE SECTION - Like the screenshot */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Table Header */}
          <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-12 gap-2 text-sm font-bold text-green-800 dark:text-green-300 uppercase">
              <div className="col-span-1 text-center">CODE</div>
              <div className="col-span-5">DESCRIPTION</div>
              <div className="col-span-2 text-center">QUANTITY</div>
              <div className="col-span-2 text-right">UNIT PRICE (R)</div>
              <div className="col-span-2 text-right">AMOUNT (R)</div>
            </div>
          </div>

          {/* Products Rows */}
          {subpackage.products?.map((product, index) => {
            const unitPrice = getProductUnitPrice(product);
            const total = getProductTotal(product);

            return (
              <div
                key={product.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30"
              >
                <div className="grid grid-cols-12 gap-2 px-4 py-3">
                  <div className="col-span-1 text-center text-sm text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </div>
                  <div className="col-span-5">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {product.name || `Product ${index + 1}`}
                    </div>
                    {product.sku && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        SKU: {product.sku}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-center text-gray-900 dark:text-gray-100">
                    {product.quantity || 1}
                  </div>
                  <div className="col-span-2 text-right text-gray-900 dark:text-gray-100">
                    {unitPrice ? formatNumber(unitPrice) : "-"}
                  </div>
                  <div className="col-span-2 text-right font-medium text-gray-900 dark:text-gray-100">
                    {total ? formatNumber(total) : "-"}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Services Rows */}
          {subpackage.services?.map((service, index) => {
            const price = getServicePrice(service);
            const total = getServiceTotal(service);

            return (
              <div
                key={service.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30"
              >
                <div className="grid grid-cols-12 gap-2 px-4 py-3">
                  <div className="col-span-1 text-center text-sm text-gray-500 dark:text-gray-400">
                    S{index + 1}
                  </div>
                  <div className="col-span-5">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {service.name || `Service ${index + 1}`}
                    </div>
                    {service.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {service.description}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-center text-gray-900 dark:text-gray-100">
                    1
                  </div>
                  <div className="col-span-2 text-right text-gray-900 dark:text-gray-100">
                    {price ? formatNumber(price) : "-"}
                  </div>
                  <div className="col-span-2 text-right font-medium text-gray-900 dark:text-gray-100">
                    {total ? formatNumber(total) : "-"}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Totals Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                {subpackage.originalPrice &&
                  subpackage.originalPrice > subpackage.price && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Original Price:
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 line-through">
                        {formatCurrency(subpackage.originalPrice)}
                      </span>
                    </div>
                  )}

                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    SUBTOTAL:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(calculatePackageSubtotal())}
                  </span>
                </div>

                {subpackage.discount && subpackage.discount > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>
                      DISCOUNT
                      {subpackage.discountType === "PERCENTAGE"
                        ? ` (${subpackage.discount}%)`
                        : ""}
                      :
                    </span>
                    <span>
                      {subpackage.discountType === "PERCENTAGE"
                        ? `${subpackage.discount}%`
                        : formatCurrency(subpackage.discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    TOTAL (ZAR):
                  </span>
                  <span className="font-bold text-lg text-green-700 dark:text-green-400">
                    {formatCurrency(priceAfterDiscount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Package Info Section with Features */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Package Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Status:
                    </span>
                    <Badge
                      variant={
                        subpackage.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {subpackage.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Duration:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {subpackage.duration || "Not specified"} days
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Default Package:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {subpackage.isDefault ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                Features
              </h3>
              {totalFeatures > 0 ? (
                <div className="space-y-2">
                  {subpackage.features?.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No features added to this subpackage
                </p>
              )}

              <div className="mt-6">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Timestamps
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Created:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date(subpackage.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Updated:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date(subpackage.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {subpackage.shortDescription && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Short Description
              </div>
              <p className="text-blue-700 dark:text-blue-300">
                {subpackage.shortDescription}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Subpackage Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subpackage</DialogTitle>
            <DialogDescription>Update subpackage details.</DialogDescription>
          </DialogHeader>
          {editingSubpackage && (
            <SubpackageForm
              mode="edit"
              packageId={subpackage.packageId}
              subpackageData={editingSubpackage}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
