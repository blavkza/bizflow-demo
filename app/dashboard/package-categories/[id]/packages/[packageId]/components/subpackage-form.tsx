"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Search,
  Package,
  DollarSign,
  Percent,
  Clock,
  Check,
  Loader2,
  Calculator,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Subpackage form schema with discount validation
const subpackageFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    originalPrice: z.coerce
      .number()
      .min(0, "Original price must be 0 or greater"),
    discountType: z.enum(["percentage", "amount", "none"]).default("none"),
    discountValue: z.coerce
      .number()
      .min(0, "Discount must be 0 or greater")
      .optional(),
    discountPercentage: z.coerce
      .number()
      .min(0)
      .max(100, "Discount percentage cannot exceed 100%")
      .optional(),
    finalPrice: z.coerce.number().min(0, "Price must be 0 or greater"),
    duration: z.string().optional(),
    isDefault: z.boolean().default(false),
    sortOrder: z.coerce.number().default(0),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("DRAFT"),
  })
  .refine(
    (data) => {
      // Validate discount based on type
      if (
        data.discountType === "percentage" &&
        data.discountPercentage === undefined
      ) {
        return false;
      }
      if (data.discountType === "amount" && data.discountValue === undefined) {
        return false;
      }
      return true;
    },
    {
      message: "Discount value is required when discount type is selected",
      path: ["discountValue"],
    }
  );

// Define SubPackageFormValues type
export type SubPackageFormValues = z.infer<typeof subpackageFormSchema>;

export type SelectedItem = {
  id: string;
  name: string;
  type: "product" | "service";
  price: number;
  quantity?: number;
  duration?: string;
  category?: string;
  sku?: string;
  image?: string;
  description?: string;
};

type SearchableItem = {
  id: string;
  name: string;
  type: "product" | "service";
  price: number;
  category?: string;
  duration?: string;
  features?: string[];
  sku?: string;
  description?: string | null;
  image?: string | null;
};

interface SubpackageFormProps {
  mode: "create" | "edit";
  packageId?: string;
  subpackageData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SubpackageForm({
  mode,
  packageId,
  subpackageData,
  onSuccess,
  onCancel,
}: SubpackageFormProps) {
  const [loading, setLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [searchableItems, setSearchableItems] = useState<SearchableItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [autoCalculatedPrice, setAutoCalculatedPrice] = useState<number | null>(
    null
  );
  const [useAutoPrice, setUseAutoPrice] = useState(true);

  const form = useForm<SubPackageFormValues>({
    resolver: zodResolver(subpackageFormSchema),
    defaultValues: {
      name: "",
      description: "",
      shortDescription: "",
      originalPrice: 0,
      discountType: "none",
      discountValue: 0,
      discountPercentage: 0,
      finalPrice: 0,
      duration: "",
      isDefault: false,
      sortOrder: 0,
      status: "DRAFT",
    },
  });

  // Watch form values for calculations
  const originalPrice = form.watch("originalPrice");
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const discountPercentage = form.watch("discountPercentage");

  // Calculate total cost of selected items
  const calculateTotalCost = useCallback(() => {
    return selectedItems.reduce((total, item) => {
      if (item.type === "product") {
        return total + item.price * (item.quantity || 1);
      }
      return total + item.price;
    }, 0);
  }, [selectedItems]);

  // Calculate final price based on discount
  const calculateFinalPrice = useCallback(() => {
    let basePrice = originalPrice || 0;

    if (discountType === "percentage" && discountPercentage) {
      return basePrice * (1 - discountPercentage / 100);
    } else if (discountType === "amount" && discountValue) {
      return Math.max(0, basePrice - discountValue);
    }

    return basePrice;
  }, [originalPrice, discountType, discountPercentage, discountValue]);

  // Update auto-calculated price whenever selected items change
  useEffect(() => {
    const total = calculateTotalCost();
    setAutoCalculatedPrice(total);

    // Auto-fill original price field if useAutoPrice is true
    if (useAutoPrice && total > 0) {
      form.setValue("originalPrice", total);

      // Calculate final price based on discount
      const finalPrice = calculateFinalPrice();
      form.setValue("finalPrice", finalPrice);
    }
  }, [
    selectedItems,
    calculateTotalCost,
    useAutoPrice,
    form,
    calculateFinalPrice,
  ]);

  // Update final price when discount or original price changes
  useEffect(() => {
    const finalPrice = calculateFinalPrice();
    form.setValue("finalPrice", finalPrice);
  }, [
    originalPrice,
    discountType,
    discountValue,
    discountPercentage,
    calculateFinalPrice,
    form,
  ]);

  // Load existing data for edit mode
  useEffect(() => {
    if (mode === "edit" && subpackageData) {
      // Calculate discount type and values from existing data
      let discountType: "percentage" | "amount" | "none" = "none";
      let discountValue = 0;
      let discountPercentage = 0;
      let finalPrice = subpackageData.price || 0;
      let originalPrice =
        subpackageData.originalPrice || subpackageData.price || 0;

      // Determine discount type from existing data
      if (subpackageData.discount) {
        if (subpackageData.discount <= 100) {
          // Assume it's percentage if <= 100
          discountType = "percentage";
          discountPercentage = subpackageData.discount;
          finalPrice = originalPrice * (1 - subpackageData.discount / 100);
        } else {
          // Assume it's amount if > 100
          discountType = "amount";
          discountValue = subpackageData.discount;
          finalPrice = Math.max(0, originalPrice - subpackageData.discount);
        }
      }

      form.reset({
        name: subpackageData.name || "",
        description: subpackageData.description || "",
        shortDescription: subpackageData.shortDescription || "",
        originalPrice: originalPrice,
        discountType: discountType,
        discountValue: discountType === "amount" ? discountValue : 0,
        discountPercentage:
          discountType === "percentage" ? discountPercentage : 0,
        finalPrice: finalPrice,
        duration: subpackageData.duration || "",
        isDefault: subpackageData.isDefault || false,
        sortOrder: subpackageData.sortOrder || 0,
        status: subpackageData.status || "DRAFT",
      });

      // Load existing items
      const existingItems: SelectedItem[] = [
        ...(subpackageData.products || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          type: "product" as const,
          price: product.price || product.unitPrice || 0,
          quantity: product.quantity || 1,
          sku: product.sku,
          image: product.image,
          description: product.description,
        })),
        ...(subpackageData.services || []).map((service: any) => ({
          id: service.id,
          name: service.name,
          type: "service" as const,
          price: service.price || service.amount || 0,
          duration: service.duration,
          image: service.image,
          description: service.description,
        })),
      ];
      setSelectedItems(existingItems);

      // Load existing features
      setFeatures(subpackageData.features || []);

      // Check if we should use auto-price
      const totalItemsCost = existingItems.reduce(
        (sum, item) =>
          item.type === "product"
            ? sum + item.price * (item.quantity || 1)
            : sum + item.price,
        0
      );

      // If the current original price matches the calculated total, enable auto-price
      setUseAutoPrice(Math.abs(totalItemsCost - originalPrice) < 0.01);
    }
  }, [mode, subpackageData, form]);

  // Fetch items for search
  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      const [productsResponse, servicesResponse] = await Promise.all([
        axios.get("/api/shop/products/pos"),
        axios.get("/api/services"),
      ]);

      const combinedItems: SearchableItem[] = [
        ...(productsResponse?.data?.data || productsResponse?.data || []).map(
          (product: any) => ({
            id: product.id,
            name: product.name,
            type: "product" as const,
            price: Number(product.price || product.unitPrice || 0),
            category: product.category?.name || product.category,
            sku: product.sku || undefined,
            description: product.description || undefined,
            image: product.images?.[0] || product.image || undefined,
          })
        ),
        ...(servicesResponse?.data?.data || servicesResponse?.data || []).map(
          (service: any) => ({
            id: service.id,
            name: service.name,
            type: "service" as const,
            price: Number(service.amount || service.price || 0),
            category: service.category?.name || service.category,
            duration: service.duration || undefined,
            features: service.features || [],
            description: service.description || undefined,
            image: service.image || undefined,
          })
        ),
      ];
      setSearchableItems(combinedItems);
    } catch (err) {
      console.error("Error fetching items:", err);
      toast.error("Failed to load items");
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filter items based on search term
  const filteredItems = searchableItems.filter((item) => {
    if (!searchTerm.trim()) return false;

    const searchLower = searchTerm.toLowerCase();
    const matchesName = item.name.toLowerCase().includes(searchLower);
    const matchesSku = item.sku?.toLowerCase().includes(searchLower) || false;
    const matchesCategory =
      item.category?.toLowerCase().includes(searchLower) || false;
    const matchesDescription =
      item.description?.toLowerCase().includes(searchLower) || false;

    return matchesName || matchesSku || matchesCategory || matchesDescription;
  });

  // Handle item selection
  const handleSelectItem = (item: SearchableItem) => {
    // Check if item already selected
    if (
      selectedItems.some(
        (selected) => selected.id === item.id && selected.type === item.type
      )
    ) {
      toast.error("Item already added");
      return;
    }

    const selectedItem: SelectedItem = {
      id: item.id,
      name: item.name,
      type: item.type,
      price: item.price,
      quantity: item.type === "product" ? 1 : undefined,
      duration: item.duration,
      category: item.category,
      sku: item.sku,
      image: item.image || undefined,
      description: item.description || undefined,
    };

    setSelectedItems([...selectedItems, selectedItem]);
    setSearchTerm("");
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  // Handle item removal
  const handleRemoveItem = (
    itemId: string,
    itemType: "product" | "service"
  ) => {
    setSelectedItems(
      selectedItems.filter(
        (item) => !(item.id === itemId && item.type === itemType)
      )
    );
  };

  // Update item quantity
  const handleUpdateQuantity = (
    itemId: string,
    itemType: "product" | "service",
    quantity: number
  ) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.id === itemId && item.type === itemType
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  // Calculate total cost for products
  const calculateProductsCost = () => {
    return selectedItems
      .filter((item) => item.type === "product")
      .reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  };

  // Calculate total cost for services
  const calculateServicesCost = () => {
    return selectedItems
      .filter((item) => item.type === "service")
      .reduce((total, item) => total + item.price, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredItems.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
          handleSelectItem(filteredItems[selectedIndex]);
        }
        break;

      case "Escape":
        setSelectedIndex(-1);
        setShowDropdown(false);
        break;
    }
  };

  // Handle feature management
  const addFeature = () => {
    const trimmedFeature = featureInput.trim();
    if (trimmedFeature && !features.includes(trimmedFeature)) {
      setFeatures([...features, trimmedFeature]);
      setFeatureInput("");
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setFeatures(features.filter((feature) => feature !== featureToRemove));
  };

  // Handle form submission
  const onSubmit = async (values: SubPackageFormValues) => {
    try {
      setLoading(true);

      // Prepare discount data for API
      let discountData = {};
      if (values.discountType === "percentage") {
        discountData = { discount: values.discountPercentage };
      } else if (values.discountType === "amount") {
        discountData = { discount: values.discountValue };
      }

      const data = {
        ...values,
        price: values.finalPrice, // Use final price as the actual price
        originalPrice: values.originalPrice,
        ...discountData,
        features,
        products: selectedItems
          .filter((item) => item.type === "product")
          .map((item) => ({
            id: item.id,
            quantity: item.quantity || 1,
          })),
        services: selectedItems
          .filter((item) => item.type === "service")
          .map((item) => ({
            id: item.id,
          })),
        packageId,
      };

      let response;
      if (mode === "edit" && subpackageData) {
        response = await axios.put(
          `/api/subpackages/${subpackageData.id}`,
          data
        );
        toast.success("Subpackage updated successfully!");
      } else {
        response = await axios.post("/api/subpackages", data);
        toast.success("Subpackage created successfully!");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error(`Error ${mode} subpackage:`, error);
      toast.error(`Failed to ${mode} subpackage`, {
        description: error.response?.data?.error || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Apply auto-calculated price
  const applyAutoPrice = () => {
    if (autoCalculatedPrice !== null && autoCalculatedPrice > 0) {
      form.setValue("originalPrice", autoCalculatedPrice);

      // Recalculate final price with current discount settings
      const finalPrice = calculateFinalPrice();
      form.setValue("finalPrice", finalPrice);

      setUseAutoPrice(true);
    }
  };

  // Handle manual original price change
  const handleOriginalPriceChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    form.setValue("originalPrice", numValue);

    // If user manually changes price, disable auto-price
    if (
      autoCalculatedPrice !== null &&
      Math.abs(numValue - autoCalculatedPrice) > 0.01
    ) {
      setUseAutoPrice(false);
    } else if (numValue === 0 && selectedItems.length === 0) {
      // If no items and price is 0, keep auto-price enabled
      setUseAutoPrice(true);
    }
  };

  // Get discount summary text
  const getDiscountSummary = () => {
    if (discountType === "percentage" && discountPercentage) {
      return `${discountPercentage}% off`;
    } else if (discountType === "amount" && discountValue) {
      return `${formatCurrency(discountValue)} off`;
    }
    return "No discount";
  };

  // Calculate savings amount
  const calculateSavings = () => {
    if (discountType === "percentage" && discountPercentage && originalPrice) {
      return originalPrice * (discountPercentage / 100);
    } else if (discountType === "amount" && discountValue) {
      return discountValue;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subpackage Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Basic Plan, Professional Plan"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          disabled={loading}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this subpackage includes..."
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ""}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Products & Services Selection */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Products & Services</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calculator className="h-3 w-3" />
                    {autoCalculatedPrice !== null && autoCalculatedPrice > 0
                      ? `Auto-calculated: ${formatCurrency(autoCalculatedPrice)}`
                      : "Add items to calculate price"}
                  </Badge>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    placeholder="Search products/services by name, SKU, description, or category..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (e.target.value.trim()) {
                        setShowDropdown(true);
                      } else {
                        setShowDropdown(false);
                      }
                      setSelectedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (searchTerm.trim()) {
                        setShowDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowDropdown(false);
                        setSelectedIndex(-1);
                      }, 200);
                    }}
                    disabled={loading || isLoadingItems}
                  />
                </div>

                {isLoadingItems && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Search Dropdown */}
                {showDropdown && filteredItems.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md max-h-96 overflow-auto">
                    <div className="p-1">
                      {filteredItems.slice(0, 10).map((item, itemIndex) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          className={`
                            flex items-start p-2 hover:bg-accent rounded-sm cursor-pointer border-b last:border-0 gap-3
                            ${selectedIndex === itemIndex ? "bg-accent" : ""}
                          `}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectItem(item);
                          }}
                        >
                          {/* Image thumbnail */}
                          {item.image && (
                            <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm truncate block">
                                  {item.name}
                                </span>
                                {item.sku && (
                                  <span className="text-[10px] font-mono bg-muted px-1 rounded mt-0.5 inline-block">
                                    SKU: {item.sku}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground flex-shrink-0 ml-2">
                                {formatCurrency(item.price)}
                              </span>
                            </div>

                            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                              <span>
                                {item.type === "product"
                                  ? "Product"
                                  : "Service"}
                                {item.category && ` • ${item.category}`}
                              </span>
                            </div>

                            {item.description && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {item.description.replace(/<[^>]*>/g, "")}
                              </div>
                            )}

                            {item.features && item.features.length > 0 && (
                              <div className="text-[10px] text-muted-foreground mt-1 italic truncate">
                                • Includes:{" "}
                                {item.features.slice(0, 3).join(", ")}
                                {item.features.length > 3 && "..."}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showDropdown &&
                  searchTerm.trim() &&
                  filteredItems.length === 0 &&
                  !isLoadingItems && (
                    <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No items found
                      </p>
                    </div>
                  )}
              </div>

              {/* Selected Items */}
              {selectedItems.length > 0 ? (
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">
                      All Items ({selectedItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="products">
                      Products (
                      {selectedItems.filter((i) => i.type === "product").length}
                      )
                    </TabsTrigger>
                    <TabsTrigger value="services">
                      Services (
                      {selectedItems.filter((i) => i.type === "service").length}
                      )
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    <div className="space-y-3">
                      {selectedItems.map((item) => (
                        <SelectedItemCard
                          key={`${item.type}-${item.id}`}
                          item={item}
                          onRemove={() => handleRemoveItem(item.id, item.type)}
                          onUpdateQuantity={(quantity) =>
                            handleUpdateQuantity(item.id, item.type, quantity)
                          }
                          disabled={loading}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="products" className="space-y-4">
                    <div className="space-y-3">
                      {selectedItems
                        .filter((item) => item.type === "product")
                        .map((item) => (
                          <SelectedItemCard
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onRemove={() =>
                              handleRemoveItem(item.id, item.type)
                            }
                            onUpdateQuantity={(quantity) =>
                              handleUpdateQuantity(item.id, item.type, quantity)
                            }
                            disabled={loading}
                          />
                        ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="services" className="space-y-4">
                    <div className="space-y-3">
                      {selectedItems
                        .filter((item) => item.type === "service")
                        .map((item) => (
                          <SelectedItemCard
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onRemove={() =>
                              handleRemoveItem(item.id, item.type)
                            }
                            onUpdateQuantity={(quantity) =>
                              handleUpdateQuantity(item.id, item.type, quantity)
                            }
                            disabled={loading}
                          />
                        ))}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">
                    No items added yet
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Search for products or services above to add them to this
                    subpackage
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    The total cost of selected items will automatically fill the
                    original price field below
                  </p>
                </div>
              )}

              {/* Cost Summary */}
              {selectedItems.length > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-3">Cost Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Products (
                        {
                          selectedItems.filter((i) => i.type === "product")
                            .length
                        }
                        )
                      </span>
                      <span>{formatCurrency(calculateProductsCost())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>
                        Services (
                        {
                          selectedItems.filter((i) => i.type === "service")
                            .length
                        }
                        )
                      </span>
                      <span>{formatCurrency(calculateServicesCost())}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Cost</span>
                      <span>{formatCurrency(calculateTotalCost())}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Pricing</h3>
                {selectedItems.length > 0 &&
                  autoCalculatedPrice !== null &&
                  autoCalculatedPrice > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {useAutoPrice ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Auto-calculated
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            Manual override
                          </Badge>
                        )}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={applyAutoPrice}
                        disabled={loading || useAutoPrice}
                      >
                        <Calculator className="h-3 w-3 mr-1" />
                        Apply auto-price
                      </Button>
                    </div>
                  )}
              </div>

              {/* Original Price */}
              <FormField
                control={form.control}
                name="originalPrice"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>
                      Original Price *
                      {autoCalculatedPrice !== null &&
                        autoCalculatedPrice > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Auto: {formatCurrency(autoCalculatedPrice)})
                          </span>
                        )}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10"
                          placeholder="0.00"
                          value={field.value}
                          onChange={(e) =>
                            handleOriginalPriceChange(e.target.value)
                          }
                          disabled={loading}
                        />
                      </div>
                    </FormControl>
                    {selectedItems.length > 0 && (
                      <FormDescription>
                        {useAutoPrice
                          ? "Original price is automatically calculated from selected items"
                          : "Manual price override. Click 'Apply auto-price' to use calculated total."}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Discount Configuration */}
              <div className="mb-6">
                <FormLabel className="text-sm font-medium">Discount</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select discount type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Discount</SelectItem>
                            <SelectItem value="percentage">
                              Percentage (%)
                            </SelectItem>
                            <SelectItem value="amount">
                              Fixed Amount (R)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {discountType === "percentage" && (
                    <FormField
                      control={form.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Percentage</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="pl-10"
                                placeholder="0"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value)
                                  )
                                }
                                disabled={loading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {discountType === "amount" && (
                    <FormField
                      control={form.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.01"
                                className="pl-10"
                                placeholder="0.00"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value)
                                  )
                                }
                                disabled={loading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Price Summary Card */}
              <div className="border rounded-lg p-4 mb-6 bg-muted/30">
                <h4 className="font-medium mb-3">Price Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Original Price
                    </span>
                    <span>{formatCurrency(originalPrice || 0)}</span>
                  </div>

                  {discountType !== "none" && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="text-green-600 font-medium">
                          {getDiscountSummary()}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">You Save</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(calculateSavings())}
                        </span>
                      </div>

                      <Separator />
                    </>
                  )}

                  <div className="flex justify-between font-medium text-base">
                    <span>Final Price</span>
                    <span className="text-primary">
                      {formatCurrency(form.getValues("finalPrice") || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Final Price (Hidden field for form, but shown in summary) */}
              <FormField
                control={form.control}
                name="finalPrice"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          placeholder="e.g., 3 months, 1 year, Lifetime"
                          {...field}
                          value={field.value || ""}
                          disabled={loading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Default Subpackage
                      </FormLabel>
                      <FormDescription>
                        Set as the default option for this package
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Features</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature (e.g., 24/7 Support)"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    onClick={addFeature}
                    variant="outline"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(feature)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {features.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No features added yet. Add features to highlight what's
                      included.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Update Subpackage" : "Create Subpackage"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// Selected Item Card Component
interface SelectedItemCardProps {
  item: SelectedItem;
  onRemove: () => void;
  onUpdateQuantity?: (quantity: number) => void;
  disabled?: boolean;
}

function SelectedItemCard({
  item,
  onRemove,
  onUpdateQuantity,
  disabled,
}: SelectedItemCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        {item.image ? (
          <div className="w-12 h-12 rounded-md overflow-hidden border flex-shrink-0">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement?.classList.add(
                  "hidden"
                );
              }}
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{item.name}</h4>
            <Badge variant="outline" className="text-xs capitalize">
              {item.type}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mt-1">
            <div className="text-sm text-muted-foreground">
              {formatCurrency(item.price)} each
            </div>

            {item.sku && (
              <div className="text-xs font-mono text-muted-foreground">
                SKU: {item.sku}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {item.type === "product" && onUpdateQuantity && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity((item.quantity || 1) - 1)}
              disabled={disabled || (item.quantity || 1) <= 1}
            >
              <span>-</span>
            </Button>
            <span className="w-8 text-center font-medium">
              {item.quantity || 1}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity((item.quantity || 1) + 1)}
              disabled={disabled}
            >
              <span>+</span>
            </Button>
          </div>
        )}

        <div className="text-right min-w-[100px]">
          <div className="font-medium">
            {formatCurrency(
              item.type === "product"
                ? item.price * (item.quantity || 1)
                : item.price
            )}
          </div>
          {item.type === "product" && (item.quantity || 1) > 1 && (
            <div className="text-xs text-muted-foreground">
              {item.quantity || 1} × {formatCurrency(item.price)}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onRemove}
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default SubpackageForm;
