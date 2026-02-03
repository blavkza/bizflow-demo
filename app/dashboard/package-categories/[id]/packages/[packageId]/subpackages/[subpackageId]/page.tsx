"use client";

import { useState, useEffect, useMemo } from "react";
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
  Percent,
  Receipt,
  Briefcase,
  Box,
  List,
  Layers,
  FileText,
  Grid,
} from "lucide-react";
import {
  getSubpackage,
  deleteSubpackage,
  duplicateSubpackage,
} from "./actions";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState<string>("all");

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
            itemDiscountType: p.itemDiscountType || undefined,
            itemDiscountAmount: p.itemDiscountAmount || undefined,
            taxRate: p.taxRate || undefined,
            taxAmount: p.taxAmount || undefined,
          })) || [],
        services:
          subpackage.services?.map((s) => ({
            id: s.id,
            unitPrice: s.unitPrice || undefined,
            itemDiscountType: s.itemDiscountType || undefined,
            itemDiscountAmount: s.itemDiscountAmount || undefined,
            taxRate: s.taxRate || undefined,
            taxAmount: s.taxAmount || undefined,
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

  // Helper to calculate item base amount (before any discounts)
  const calculateItemBaseAmount = (item: any) => {
    return (item.unitPrice || 0) * (item.quantity || 1);
  };

  // Helper to calculate item discount amount
  const calculateItemDiscountAmount = (item: any) => {
    if (!item.itemDiscountType || !item.itemDiscountAmount) return 0;

    const baseAmount = calculateItemBaseAmount(item);

    if (item.itemDiscountType === "PERCENTAGE") {
      return baseAmount * (item.itemDiscountAmount / 100);
    } else {
      return Math.min(item.itemDiscountAmount, baseAmount);
    }
  };

  // Helper to calculate item net amount (after discount, before tax)
  const calculateItemNetAmount = (item: any) => {
    const baseAmount = calculateItemBaseAmount(item);
    const discountAmount = calculateItemDiscountAmount(item);
    return Math.max(0, baseAmount - discountAmount);
  };

  // Helper to calculate item tax amount
  const calculateItemTaxAmount = (item: any) => {
    const netAmount = calculateItemNetAmount(item);
    const taxRate = item.taxRate || 15;
    return netAmount * (taxRate / 100);
  };

  // Helper to calculate item total (net + tax)
  const calculateItemTotal = (item: any) => {
    const netAmount = calculateItemNetAmount(item);
    const taxAmount = calculateItemTaxAmount(item);
    return netAmount + taxAmount;
  };

  // Memoized combined services data
  const combinedServices = useMemo(() => {
    if (!subpackage?.services || subpackage.services.length === 0) {
      return null;
    }

    // Calculate totals for all services combined
    let totalQuantity = 0;
    let totalBaseAmount = 0;
    let totalDiscountAmount = 0;
    let totalNetAmount = 0;
    let totalTaxAmount = 0;
    let totalAmount = 0;
    const serviceNames: string[] = [];

    subpackage.services.forEach((service) => {
      const base = calculateItemBaseAmount(service);
      const discount = calculateItemDiscountAmount(service);
      const net = calculateItemNetAmount(service);
      const tax = calculateItemTaxAmount(service);
      const total = calculateItemTotal(service);

      totalQuantity += service.quantity || 1;
      totalBaseAmount += base;
      totalDiscountAmount += discount;
      totalNetAmount += net;
      totalTaxAmount += tax;
      totalAmount += total;

      if (service.name) {
        serviceNames.push(service.name);
      }
    });

    // Calculate weighted average tax rate
    const weightedTaxRate =
      totalNetAmount > 0 ? (totalTaxAmount / totalNetAmount) * 100 : 15;

    return {
      name: "Services Package",
      description:
        serviceNames.length > 0
          ? `Includes: ${serviceNames.join(", ")}`
          : "Services included in package",
      quantity: totalQuantity,
      unitPrice: totalQuantity > 0 ? totalBaseAmount / totalQuantity : 0,
      baseAmount: totalBaseAmount,
      discountAmount: totalDiscountAmount,
      netAmount: totalNetAmount,
      taxAmount: totalTaxAmount,
      totalAmount: totalAmount,
      weightedTaxRate: weightedTaxRate.toFixed(2),
      services: subpackage.services, // Store individual services for display
    };
  }, [subpackage]);

  // Calculate all items (products + combined services)
  const allItems = useMemo(() => {
    const items: any[] = [];

    // Add all products
    if (subpackage?.products) {
      items.push(
        ...subpackage.products.map((product) => ({
          ...product,
          type: "product" as const,
          displayType: "product",
        }))
      );
    }

    // Add combined services (single row) instead of individual services
    if (combinedServices) {
      items.push({
        ...combinedServices,
        type: "service" as const,
        displayType: "combined-service",
        id: "combined-services",
        name: combinedServices.name,
        description: combinedServices.description,
        quantity: combinedServices.quantity,
        unitPrice: combinedServices.unitPrice,
        taxRate: parseFloat(combinedServices.weightedTaxRate),
        itemDiscountType:
          combinedServices.discountAmount > 0
            ? ("COMBINED" as const)
            : undefined,
        itemDiscountAmount: combinedServices.discountAmount,
        // Include individual services for reference
        individualServices: combinedServices.services,
      });
    }

    return items;
  }, [subpackage, combinedServices]);

  // Calculate package breakdown
  const calculatePackageBreakdown = () => {
    if (!subpackage) {
      return {
        totalBaseAmount: 0,
        totalItemDiscounts: 0,
        totalNetAmount: 0,
        totalTaxAmount: 0,
        totalAmount: 0,
        globalDiscountAmount: 0,
        netAfterGlobalDiscount: 0,
        taxAfterGlobalDiscount: 0,
        finalTotal: 0,
      };
    }

    let totalBaseAmount = 0;
    let totalItemDiscounts = 0;
    let totalNetAmount = 0;
    let totalTaxAmount = 0;
    let totalAmount = 0;

    // Process products
    if (subpackage.products) {
      subpackage.products.forEach((item) => {
        const base = calculateItemBaseAmount(item);
        const discount = calculateItemDiscountAmount(item);
        const net = calculateItemNetAmount(item);
        const tax = calculateItemTaxAmount(item);
        const total = calculateItemTotal(item);

        totalBaseAmount += base;
        totalItemDiscounts += discount;
        totalNetAmount += net;
        totalTaxAmount += tax;
        totalAmount += total;
      });
    }

    // Process services
    if (subpackage.services) {
      subpackage.services.forEach((item) => {
        const base = calculateItemBaseAmount(item);
        const discount = calculateItemDiscountAmount(item);
        const net = calculateItemNetAmount(item);
        const tax = calculateItemTaxAmount(item);
        const total = calculateItemTotal(item);

        totalBaseAmount += base;
        totalItemDiscounts += discount;
        totalNetAmount += net;
        totalTaxAmount += tax;
        totalAmount += total;
      });
    }

    // Calculate global package discount
    const calculateGlobalDiscount = () => {
      if (!subpackage.discount || subpackage.discount <= 0) return 0;

      // Apply discount to taxable amount (net amount after item discounts)
      const taxableAmount = totalNetAmount;

      if (subpackage.discountType === "percentage") {
        return taxableAmount * (subpackage.discount / 100);
      } else {
        return Math.min(subpackage.discount, taxableAmount);
      }
    };

    const globalDiscountAmount = calculateGlobalDiscount();

    // Calculate final amounts after global discount
    const netAfterGlobalDiscount = Math.max(
      0,
      totalNetAmount - globalDiscountAmount
    );

    // Recalculate tax based on net amount after global discount
    const taxAfterGlobalDiscount =
      totalNetAmount > 0
        ? (netAfterGlobalDiscount / totalNetAmount) * totalTaxAmount
        : 0;

    const finalTotal = netAfterGlobalDiscount + taxAfterGlobalDiscount;

    return {
      totalBaseAmount,
      totalItemDiscounts,
      totalNetAmount,
      totalTaxAmount,
      totalAmount,
      globalDiscountAmount,
      netAfterGlobalDiscount,
      taxAfterGlobalDiscount,
      finalTotal,
    };
  };

  const breakdown = calculatePackageBreakdown();

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

  return (
    <div className="px-4">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
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

        {/* Tabs and Table Section */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start h-12 rounded-none border-b-0">
                <TabsTrigger
                  value="all"
                  className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-gray-100"
                >
                  <Grid className="h-4 w-4" />
                  All Items
                  <Badge variant="secondary" className="ml-1">
                    {allItems.length}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger
                  value="products"
                  className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/30 dark:data-[state=active]:text-green-300"
                >
                  <Box className="h-4 w-4" />
                  Products
                  <Badge variant="secondary" className="ml-1">
                    {subpackage.products?.length || 0}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger
                  value="services"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-300"
                >
                  <Briefcase className="h-4 w-4" />
                  Services
                  <Badge variant="secondary" className="ml-1">
                    {subpackage.services?.length || 0}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger
                  value="combined"
                  className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/30 dark:data-[state=active]:text-purple-300"
                >
                  <Layers className="h-4 w-4" />
                  Combined Services
                  <Badge variant="secondary" className="ml-1">
                    1
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Table Header - Visible on all tabs */}
              <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-12 gap-2 text-sm font-bold text-green-800 dark:text-green-300 uppercase">
                  <div className="col-span-4">DESCRIPTION</div>
                  <div className="col-span-1 text-center">QTY</div>
                  <div className="col-span-1 text-right">UNIT PRICE</div>
                  <div className="col-span-1 text-right">DISCOUNT</div>
                  <div className="col-span-1 text-right">TAX</div>
                  <div className="col-span-2 text-right">NET AMOUNT</div>
                  <div className="col-span-1 text-right">TOTAL</div>
                </div>
              </div>

              {/* All Items Tab Content */}
              <TabsContent value="all" className="m-0">
                {allItems.length > 0 ? (
                  allItems.map((item, index) => {
                    // For combined services, use the combined calculations
                    const isCombinedService =
                      item.displayType === "combined-service";

                    const baseAmount = isCombinedService
                      ? item.baseAmount
                      : calculateItemBaseAmount(item);
                    const discountAmount = isCombinedService
                      ? item.discountAmount
                      : calculateItemDiscountAmount(item);
                    const netAmount = isCombinedService
                      ? item.netAmount
                      : calculateItemNetAmount(item);
                    const taxAmount = isCombinedService
                      ? item.taxAmount
                      : calculateItemTaxAmount(item);
                    const itemTotal = isCombinedService
                      ? item.totalAmount
                      : calculateItemTotal(item);
                    const unitPrice = item.unitPrice || item.price || 0;
                    const quantity = item.quantity || 1;

                    return (
                      <div
                        key={item.id || `item-${index}`}
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                          isCombinedService
                            ? "bg-blue-50/30 dark:bg-blue-900/10"
                            : ""
                        }`}
                      >
                        <div className="grid grid-cols-12 gap-2 px-4 py-3">
                          <div className="col-span-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {item.name ||
                                `${item.type === "product" ? "Product" : "Service"} ${index + 1}`}
                            </div>
                            {item.sku && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                SKU: {item.sku}
                              </div>
                            )}

                            <div
                              className={`text-xs mt-1 flex items-center gap-1 ${
                                item.type === "product"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : isCombinedService
                                    ? "text-purple-600 dark:text-purple-400"
                                    : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              {item.type === "product" ? (
                                <>
                                  <Box className="h-3 w-3" />
                                  Product
                                </>
                              ) : isCombinedService ? (
                                <div className="flex flex-col items-start gap-2">
                                  <div className="flex items-center gap-1">
                                    <Layers className="h-3 w-3" />
                                    Combined Services (
                                    {item.individualServices?.length || 0}{" "}
                                    services)
                                  </div>

                                  <div className="space-y-1 text-sm">
                                    {combinedServices?.services.map(
                                      (service, index) => (
                                        <div
                                          key={service.id}
                                          className="flex justify-between items-center py-1"
                                        >
                                          <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                              {service.name ||
                                                `Service ${index + 1}`}
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <Briefcase className="h-3 w-3" />
                                  Service
                                </>
                              )}
                            </div>
                          </div>
                          <div className="col-span-1 text-center text-gray-900 dark:text-gray-100">
                            {quantity}
                          </div>
                          <div className="col-span-1 text-right text-gray-900 dark:text-gray-100">
                            {isCombinedService
                              ? "-"
                              : unitPrice
                                ? formatNumber(unitPrice)
                                : "-"}
                          </div>

                          <div className="col-span-1 text-right">
                            {discountAmount > 0 ? (
                              <div className="text-red-600 dark:text-red-400">
                                -{formatNumber(discountAmount)}
                                {item.itemDiscountType === "PERCENTAGE" &&
                                  item.itemDiscountAmount && (
                                    <div className="text-xs text-gray-500">
                                      ({item.itemDiscountAmount}%)
                                    </div>
                                  )}
                                {item.itemDiscountType === "COMBINED" && (
                                  <div className="text-xs text-gray-500">
                                    (Combined Discount)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div className="col-span-1 text-right">
                            {taxAmount > 0 ? (
                              <div>
                                <div className="text-gray-900 dark:text-gray-100">
                                  {formatNumber(taxAmount)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  (
                                  {isCombinedService
                                    ? parseFloat(item.weightedTaxRate).toFixed(
                                        1
                                      )
                                    : item.taxRate || 15}
                                  %)
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div className="col-span-2 text-right text-gray-900 dark:text-gray-100">
                            {formatNumber(netAmount)}
                          </div>
                          <div className="col-span-1 text-right font-medium text-gray-900 dark:text-gray-100">
                            {formatNumber(itemTotal)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <Grid className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                      No Items
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">
                      This subpackage doesn't contain any items.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Products Tab Content */}
              <TabsContent value="products" className="m-0">
                {subpackage.products && subpackage.products.length > 0 ? (
                  subpackage.products.map((product, index) => {
                    const baseAmount = calculateItemBaseAmount(product);
                    const discountAmount = calculateItemDiscountAmount(product);
                    const netAmount = calculateItemNetAmount(product);
                    const taxAmount = calculateItemTaxAmount(product);
                    const itemTotal = calculateItemTotal(product);
                    const unitPrice = product.unitPrice || product.price || 0;
                    const quantity = product.quantity || 1;

                    return (
                      <div
                        key={product.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      >
                        <div className="grid grid-cols-12 gap-2 px-4 py-3">
                          <div className="col-span-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {product.name || `Product ${index + 1}`}
                            </div>
                            {product.sku && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                SKU: {product.sku}
                              </div>
                            )}
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                              <Box className="h-3 w-3" />
                              Product
                            </div>
                          </div>
                          <div className="col-span-1 text-center text-gray-900 dark:text-gray-100">
                            {quantity}
                          </div>
                          <div className="col-span-1 text-right text-gray-900 dark:text-gray-100">
                            {unitPrice ? formatNumber(unitPrice) : "-"}
                          </div>
                          <div className="col-span-1 text-right">
                            {discountAmount > 0 ? (
                              <div className="text-red-600 dark:text-red-400">
                                -{formatNumber(discountAmount)}
                                {product.itemDiscountType === "PERCENTAGE" &&
                                  product.itemDiscountAmount && (
                                    <div className="text-xs text-gray-500">
                                      ({product.itemDiscountAmount}%)
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div className="col-span-1 text-right">
                            {taxAmount > 0 ? (
                              <div>
                                <div className="text-gray-900 dark:text-gray-100">
                                  {formatNumber(taxAmount)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ({product.taxRate || 15}%)
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div className="col-span-2 text-right text-gray-900 dark:text-gray-100">
                            {formatNumber(netAmount)}
                          </div>
                          <div className="col-span-1 text-right font-medium text-gray-900 dark:text-gray-100">
                            {formatNumber(itemTotal)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <Box className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                      No Products
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">
                      This subpackage doesn't contain any products.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Services Tab Content */}
              <TabsContent value="services" className="m-0">
                {subpackage.services && subpackage.services.length > 0 ? (
                  subpackage.services.map((service, index) => {
                    const baseAmount = calculateItemBaseAmount(service);
                    const discountAmount = calculateItemDiscountAmount(service);
                    const netAmount = calculateItemNetAmount(service);
                    const taxAmount = calculateItemTaxAmount(service);
                    const itemTotal = calculateItemTotal(service);
                    const unitPrice = service.unitPrice || 0;
                    const quantity = service.quantity || 1;

                    return (
                      <div
                        key={service.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      >
                        <div className="grid grid-cols-12 gap-2 px-4 py-3">
                          <div className="col-span-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {service.name || `Service ${index + 1}`}
                            </div>
                            {service.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {service.description}
                              </div>
                            )}
                            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              Service
                            </div>
                          </div>
                          <div className="col-span-1 text-center text-gray-900 dark:text-gray-100">
                            {quantity}
                          </div>
                          <div className="col-span-1 text-right text-gray-900 dark:text-gray-100">
                            {unitPrice ? formatNumber(unitPrice) : "-"}
                          </div>
                          <div className="col-span-1 text-right">
                            {discountAmount > 0 ? (
                              <div className="text-red-600 dark:text-red-400">
                                -{formatNumber(discountAmount)}
                                {service.itemDiscountType === "PERCENTAGE" &&
                                  service.itemDiscountAmount && (
                                    <div className="text-xs text-gray-500">
                                      ({service.itemDiscountAmount}%)
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div className="col-span-1 text-right">
                            {taxAmount > 0 ? (
                              <div>
                                <div className="text-gray-900 dark:text-gray-100">
                                  {formatNumber(taxAmount)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ({service.taxRate || 15}%)
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div className="col-span-2 text-right text-gray-900 dark:text-gray-100">
                            {formatNumber(netAmount)}
                          </div>
                          <div className="col-span-1 text-right font-medium text-gray-900 dark:text-gray-100">
                            {formatNumber(itemTotal)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <Briefcase className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                      No Services
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">
                      This subpackage doesn't contain any services.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Combined Services Tab Content */}
              <TabsContent value="combined" className="m-0">
                {combinedServices ? (
                  <>
                    {/* Combined Services Row */}
                    <div className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 bg-blue-50/30 dark:bg-blue-900/10">
                      <div className="grid grid-cols-12 gap-2 px-4 py-3">
                        <div className="col-span-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {combinedServices.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {combinedServices.description}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            Combined Services (
                            {subpackage.services?.length || 0} items)
                          </div>
                        </div>
                        <div className="col-span-1 text-center text-gray-900 dark:text-gray-100">
                          {combinedServices.quantity}
                        </div>
                        <div className="col-span-1 text-right text-gray-900 dark:text-gray-100">
                          {combinedServices.unitPrice
                            ? formatNumber(combinedServices.unitPrice)
                            : "-"}
                        </div>
                        <div className="col-span-1 text-right">
                          {combinedServices.discountAmount > 0 ? (
                            <div className="text-red-600 dark:text-red-400">
                              -{formatNumber(combinedServices.discountAmount)}
                              <div className="text-xs text-gray-500">
                                (Combined Discount)
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        <div className="col-span-1 text-right">
                          {combinedServices.taxAmount > 0 ? (
                            <div>
                              <div className="text-gray-900 dark:text-gray-100">
                                {formatNumber(combinedServices.taxAmount)}
                              </div>
                              <div className="text-xs text-gray-500">
                                (
                                {parseFloat(
                                  combinedServices.weightedTaxRate
                                ).toFixed(1)}
                                %)
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        <div className="col-span-2 text-right text-gray-900 dark:text-gray-100">
                          {formatNumber(combinedServices.netAmount)}
                        </div>
                        <div className="col-span-1 text-right font-medium text-gray-900 dark:text-gray-100">
                          {formatNumber(combinedServices.totalAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown of individual services */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-800">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <List className="h-4 w-4" />
                        Individual Services Breakdown
                      </h4>
                      <div className="space-y-1 text-sm">
                        {combinedServices.services.map((service, index) => (
                          <div
                            key={service.id}
                            className="flex justify-between items-center py-1"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                              <span className="text-gray-600 dark:text-gray-400">
                                {service.name || `Service ${index + 1}`}
                              </span>
                            </div>
                            <div className="text-gray-900 dark:text-gray-100">
                              {formatCurrency(calculateItemTotal(service))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <Layers className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                      No Services to Combine
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">
                      This subpackage doesn't contain any services.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Totals Section - Always visible */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-4">
            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                {/* Gross Subtotal (Before any discounts) */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Gross Subtotal:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {formatCurrency(breakdown.totalBaseAmount)}
                  </span>
                </div>

                {/* Item-level Discounts */}
                {breakdown.totalItemDiscounts > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Item Discounts:
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      -{formatCurrency(breakdown.totalItemDiscounts)}
                    </span>
                  </div>
                )}

                {/* Taxable Amount (After item discounts, before global discount) */}
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Taxable Amount:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {formatCurrency(breakdown.totalNetAmount)}
                  </span>
                </div>

                {/* Tax Calculation */}
                {breakdown.totalTaxAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        VAT (
                        {breakdown.totalNetAmount > 0
                          ? `${((breakdown.totalTaxAmount / breakdown.totalNetAmount) * 100).toFixed(1)}%`
                          : "15%"}
                        ):
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        +{formatCurrency(breakdown.totalTaxAmount)}
                      </span>
                    </div>

                    {/* Subtotal with Tax */}
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-600 dark:text-gray-400">
                        Subtotal (incl. VAT):
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {formatCurrency(breakdown.totalAmount)}
                      </span>
                    </div>
                  </>
                )}

                {/* Global Package Discount */}
                {breakdown.globalDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      Package Discount
                      {subpackage.discountType === "percentage"
                        ? ` (${subpackage.discount}%)`
                        : ""}
                      :
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      -{formatCurrency(breakdown.globalDiscountAmount)}
                    </span>
                  </div>
                )}

                {/* Final Tax (adjusted for global discount) */}
                {breakdown.taxAfterGlobalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Final VAT:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      +{formatCurrency(breakdown.taxAfterGlobalDiscount)}
                    </span>
                  </div>
                )}

                {/* Final Total */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    GRAND TOTAL:
                  </span>
                  <span className="font-bold text-xl text-green-700 dark:text-green-400">
                    {formatCurrency(breakdown.finalTotal)}
                  </span>
                </div>

                {/* Summary Note */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <div>Products: {subpackage.products?.length || 0}</div>
                      <div>Services: {subpackage.services?.length || 0}</div>
                    </div>
                    <div className="text-right">
                      <div>
                        Item discounts:{" "}
                        {formatCurrency(breakdown.totalItemDiscounts)}
                      </div>
                      <div>
                        Package discount:{" "}
                        {formatCurrency(breakdown.globalDiscountAmount)}
                      </div>
                    </div>
                  </div>
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
              {(subpackage.features?.length || 0) > 0 ? (
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
        <DialogContent className="sm:max-w-[800px] min-w-[90vw] max-h-[90vh] overflow-y-auto">
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
