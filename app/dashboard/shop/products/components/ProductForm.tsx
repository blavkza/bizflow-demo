"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUpload } from "./ImageUpload";
import {
  Product,
  ProductFormData,
  Category,
  UploadedFile,
} from "@/types/product";
import {
  ShopProductSchema,
  ShopProductSchemaType,
} from "@/lib/formValidationSchemas";
import { toast } from "sonner";
import { Loader2, Percent, DollarSign, Calculator } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const TAX_RATE = 0.15; // 15% VAT for South Africa

export function ProductForm({
  product,
  onSubmit,
  onCancel,
  loading = false,
}: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<UploadedFile[]>(
    product?.images?.map((url) => ({
      url,
      name: `Image_${url.split("/").pop()}`,
      type: "IMAGE" as const,
      size: 0,
      mimeType: "image/jpeg",
    })) || []
  );
  const [documents, setDocuments] = useState<UploadedFile[]>(
    product?.documents?.map((doc) => ({
      url: doc.url,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      mimeType: doc.mimeType,
    })) || []
  );
  const [priceInputMode, setPriceInputMode] = useState<
    "BEFORE_TAX" | "AFTER_TAX"
  >(product?.priceInputMode || "AFTER_TAX");
  const [profitInputMode, setProfitInputMode] = useState<"AMOUNT" | "PERCENT">(
    "PERCENT"
  );
  const [profitValue, setProfitValue] = useState<number>(0);

  // Price calculation functions
  const calculateBeforeTax = (afterTaxPrice: any): number => {
    if (
      afterTaxPrice === null ||
      afterTaxPrice === undefined ||
      isNaN(afterTaxPrice)
    ) {
      return 0;
    }
    const numPrice =
      typeof afterTaxPrice === "string"
        ? parseFloat(afterTaxPrice)
        : afterTaxPrice;
    const result = numPrice / (1 + TAX_RATE);
    return Math.round(result * 100) / 100;
  };

  const calculateAfterTax = (beforeTaxPrice: any): number => {
    if (
      beforeTaxPrice === null ||
      beforeTaxPrice === undefined ||
      isNaN(beforeTaxPrice)
    ) {
      return 0;
    }
    const numPrice =
      typeof beforeTaxPrice === "string"
        ? parseFloat(beforeTaxPrice)
        : beforeTaxPrice;
    const result = numPrice * (1 + TAX_RATE);
    return Math.round(result * 100) / 100;
  };

  // Calculate selling price from cost and profit
  const calculateFromCostAndProfit = (
    cost: number,
    profit: number,
    isPercent: boolean,
    isAfterTax: boolean
  ): number => {
    if (cost <= 0) return 0;

    let sellingPrice: number;

    if (isPercent) {
      // Calculate selling price based on profit percentage
      sellingPrice = cost * (1 + profit / 100);
    } else {
      // Calculate selling price based on profit amount
      sellingPrice = cost + profit;
    }

    // Convert to appropriate tax mode
    return isAfterTax ? sellingPrice : sellingPrice / (1 + TAX_RATE);
  };

  const form = useForm<ShopProductSchemaType>({
    resolver: zodResolver(ShopProductSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      sku: product?.sku || "",
      category: product?.category || "",
      price: product?.price || 0,
      costPrice: product?.costPrice || null,
      stock: product?.stock || 0,
      minStock: product?.minStock || 0,
      maxStock: product?.maxStock || 0,
      weight: product?.weight || 0,
      dimensions: product?.dimensions || "",
      color: product?.color || "",
      size: product?.size || "",
      brand: product?.brand || "",
      status: product?.status || "ACTIVE",
      featured: product?.featured || false,
      images: product?.images || [],
      priceInputMode: product?.priceInputMode || "AFTER_TAX",
      priceBeforeTax:
        product?.priceBeforeTax ||
        (product?.price ? calculateBeforeTax(product.price) : 0),
      costPriceBeforeTax:
        product?.costPriceBeforeTax ||
        (product?.costPrice ? calculateBeforeTax(product.costPrice) : null),
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    loadCategories();

    // Calculate initial profit value if cost and price exist
    const initialPrice = product?.price || 0;
    const initialCost = product?.costPrice || 0;
    if (initialCost > 0 && initialPrice > 0) {
      const profit = initialPrice - initialCost;
      const profitPercent = initialCost > 0 ? (profit / initialCost) * 100 : 0;
      setProfitValue(profitPercent); // Default to percentage
    }
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/shop/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    }
  };

  // Handle price input mode change
  const handleInputModeChange = (mode: "BEFORE_TAX" | "AFTER_TAX") => {
    setPriceInputMode(mode);
    form.setValue("priceInputMode", mode);

    // Get current values
    const currentPrice = form.getValues("price");
    const currentPriceBefore = form.getValues("priceBeforeTax");
    const currentCost = form.getValues("costPrice");
    const currentCostBefore = form.getValues("costPriceBeforeTax");

    if (mode === "BEFORE_TAX") {
      // Convert everything to before tax
      const priceBeforeTax = currentPrice
        ? calculateBeforeTax(currentPrice)
        : 0;
      form.setValue("priceBeforeTax", priceBeforeTax);
      form.setValue("price", calculateAfterTax(priceBeforeTax));

      if (currentCost) {
        const costBeforeTax = calculateBeforeTax(currentCost);
        form.setValue("costPriceBeforeTax", costBeforeTax);
        form.setValue("costPrice", calculateAfterTax(costBeforeTax));
      }
    } else {
      // Convert everything to after tax
      const priceAfterTax = currentPriceBefore
        ? calculateAfterTax(currentPriceBefore)
        : 0;
      form.setValue("price", priceAfterTax);
      form.setValue("priceBeforeTax", calculateBeforeTax(priceAfterTax));

      if (currentCostBefore) {
        const costAfterTax = calculateAfterTax(currentCostBefore);
        form.setValue("costPrice", costAfterTax);
        form.setValue("costPriceBeforeTax", calculateBeforeTax(costAfterTax));
      }
    }
  };

  // Handle profit calculation when cost changes
  const handleCostChange = (value: string) => {
    const cost = value === "" ? 0 : parseFloat(value) || 0;

    if (cost > 0 && profitValue > 0) {
      // Recalculate selling price based on cost and profit
      const sellingPrice = calculateFromCostAndProfit(
        cost,
        profitValue,
        profitInputMode === "PERCENT",
        priceInputMode === "AFTER_TAX"
      );

      if (priceInputMode === "AFTER_TAX") {
        form.setValue("price", sellingPrice);
        form.setValue("priceBeforeTax", calculateBeforeTax(sellingPrice));
      } else {
        form.setValue("priceBeforeTax", sellingPrice);
        form.setValue("price", calculateAfterTax(sellingPrice));
      }
    }
  };

  // Handle profit input change
  const handleProfitChange = (value: string) => {
    const profit = value === "" ? 0 : parseFloat(value) || 0;
    setProfitValue(profit);

    // Get current cost
    const cost = form.getValues("costPrice") || 0;

    if (cost > 0 && profit > 0) {
      // Calculate new selling price
      const sellingPrice = calculateFromCostAndProfit(
        cost,
        profit,
        profitInputMode === "PERCENT",
        priceInputMode === "AFTER_TAX"
      );

      if (priceInputMode === "AFTER_TAX") {
        form.setValue("price", sellingPrice);
        form.setValue("priceBeforeTax", calculateBeforeTax(sellingPrice));
      } else {
        form.setValue("priceBeforeTax", sellingPrice);
        form.setValue("price", calculateAfterTax(sellingPrice));
      }
    }
  };

  // Toggle profit input mode
  const toggleProfitMode = () => {
    setProfitInputMode((prev) => (prev === "PERCENT" ? "AMOUNT" : "PERCENT"));

    // Convert profit value between percentage and amount
    const cost = form.getValues("costPrice") || 0;
    const sellingPrice =
      priceInputMode === "AFTER_TAX"
        ? form.getValues("price")
        : calculateAfterTax(form.getValues("priceBeforeTax") || 0);

    if (cost > 0 && sellingPrice > 0) {
      if (profitInputMode === "PERCENT") {
        // Switching from % to amount
        const profitAmount = sellingPrice - cost;
        setProfitValue(profitAmount);
      } else {
        // Switching from amount to %
        const profitPercent =
          cost > 0 ? ((sellingPrice - cost) / cost) * 100 : 0;
        setProfitValue(profitPercent);
      }
    }
  };

  const handleImageUpload = (file: UploadedFile) => {
    setImages((prev) => [...prev, file]);
    const currentImages = form.getValues("images") || [];
    form.setValue("images", [...currentImages, file.url]);
  };

  const handleImageRemove = (url: string) => {
    setImages((prev) => prev.filter((img) => img.url !== url));
    const currentImages = form.getValues("images") || [];
    form.setValue(
      "images",
      currentImages.filter((img) => img !== url)
    );
  };

  const handleDocumentUpload = (file: UploadedFile) => {
    setDocuments((prev) => [...prev, file]);
  };

  const handleDocumentRemove = (url: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.url !== url));
  };

  const onFormSubmit = async (values: ShopProductSchemaType) => {
    try {
      // Use the values directly - they're already correctly calculated and synchronized
      const submitData: ProductFormData = {
        name: values.name,
        description: values.description,
        sku: values.sku,
        category: values.category,
        price: Number(values.price) || 0,
        priceBeforeTax: Number(values.priceBeforeTax) || 0,
        costPrice: values.costPrice ? Number(values.costPrice) : null,
        costPriceBeforeTax: values.costPriceBeforeTax
          ? Number(values.costPriceBeforeTax)
          : null,
        priceInputMode: values.priceInputMode,
        stock: Number(values.stock),
        minStock: Number(values.minStock),
        maxStock: Number(values.maxStock),
        weight: Number(values.weight),
        dimensions: values.dimensions,
        color: values.color,
        size: values.size,
        brand: values.brand,
        status: values.status,
        featured: values.featured,
        images: images.map((img) => img.url),
        documents: documents.map((doc) => doc.url),
      };

      await onSubmit(submitData);
      toast.success(
        product
          ? "Product updated successfully"
          : "Product created successfully"
      );
    } catch (error) {
      toast.error("Failed to save product");
      console.error("Form submission error:", error);
    }
  };

  // Helper function to safely format prices
  const formatPrice = (price: any): string => {
    if (price === null || price === undefined) {
      return "0.00";
    }

    // Convert to number if it's a string
    const numPrice = typeof price === "string" ? parseFloat(price) : price;

    if (typeof numPrice !== "number" || isNaN(numPrice)) {
      return "0.00";
    }

    return numPrice.toFixed(2);
  };

  // Get current price breakdown for display
  const priceValue = form.watch("price");
  const priceBeforeTaxValue = form.watch("priceBeforeTax");
  const costPriceValue = form.watch("costPrice");
  const costPriceBeforeTaxValue = form.watch("costPriceBeforeTax");

  // Convert to numbers safely
  const priceAfterTax =
    typeof priceValue === "number"
      ? priceValue
      : typeof priceValue === "string"
        ? parseFloat(priceValue) || 0
        : 0;

  const priceBeforeTax =
    typeof priceBeforeTaxValue === "number"
      ? priceBeforeTaxValue
      : typeof priceBeforeTaxValue === "string"
        ? parseFloat(priceBeforeTaxValue) || 0
        : 0;

  const vatAmount = priceAfterTax - priceBeforeTax;

  const costAfterTax = costPriceValue
    ? typeof costPriceValue === "number"
      ? costPriceValue
      : typeof costPriceValue === "string"
        ? parseFloat(costPriceValue) || 0
        : 0
    : 0;

  const costBeforeTax = costPriceBeforeTaxValue
    ? typeof costPriceBeforeTaxValue === "number"
      ? costPriceBeforeTaxValue
      : typeof costPriceBeforeTaxValue === "string"
        ? parseFloat(costPriceBeforeTaxValue) || 0
        : 0
    : 0;

  const costVatAmount = costAfterTax - costBeforeTax;

  // Calculate current profit
  const currentProfitAmount =
    costAfterTax > 0 ? priceAfterTax - costAfterTax : 0;
  const currentProfitPercent =
    costAfterTax > 0 ? (currentProfitAmount / costAfterTax) * 100 : 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Product Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Product description and details..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SKU and Category */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>SKU *</FormLabel>
                  <FormControl>
                    <Input placeholder="Product SKU" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Pricing Mode Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div>
              <h3 className="font-medium">Price Input Mode</h3>
              <p className="text-sm text-gray-600">
                Choose whether to enter prices before or after 15% VAT
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`text-sm ${priceInputMode === "BEFORE_TAX" ? "font-semibold" : ""}`}
              >
                Before Tax
              </span>
              <Switch
                checked={priceInputMode === "AFTER_TAX"}
                onCheckedChange={(checked) =>
                  handleInputModeChange(checked ? "AFTER_TAX" : "BEFORE_TAX")
                }
              />
              <span
                className={`text-sm ${priceInputMode === "AFTER_TAX" ? "font-semibold" : ""}`}
              >
                After Tax
              </span>
            </div>
          </div>

          {/* Dynamic Pricing Fields */}
          <div className="space-y-4">
            {/* Dynamic Pricing Fields - Now in 3 columns */}
            <div className="grid grid-cols-3 gap-4">
              {priceInputMode === "AFTER_TAX" ? (
                // AFTER TAX MODE - User enters tax-inclusive prices
                <>
                  {/* Cost Price */}
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Cost Price (After 15% VAT)</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  field.onChange(null);
                                  form.setValue("costPriceBeforeTax", null);
                                } else {
                                  const afterTax = parseFloat(value) || 0;
                                  field.onChange(afterTax);
                                  form.setValue(
                                    "costPriceBeforeTax",
                                    calculateBeforeTax(afterTax)
                                  );
                                  handleCostChange(value);
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              {field.value !== null
                                ? `Before VAT: R${formatPrice(calculateBeforeTax(field.value))}`
                                : ""}
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profit Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">
                        Profit Margin
                      </FormLabel>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">%</span>
                        <Switch
                          checked={profitInputMode === "AMOUNT"}
                          onCheckedChange={toggleProfitMode}
                          className="scale-75"
                        />
                        <span className="text-xs text-gray-600">R</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="relative">
                        {profitInputMode === "PERCENT" ? (
                          <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        )}
                        <Input
                          type="number"
                          placeholder={
                            profitInputMode === "PERCENT" ? "0.00" : "0.00"
                          }
                          step="0.01"
                          min="0"
                          value={profitValue || ""}
                          onChange={(e) => handleProfitChange(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {profitInputMode === "PERCENT"
                          ? `Amount: R${formatPrice(currentProfitAmount)}`
                          : `Percentage: ${currentProfitPercent.toFixed(1)}%`}
                      </p>
                    </div>
                  </div>

                  {/* Selling Price */}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Selling Price (After 15% VAT) *</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  field.onChange(null);
                                  form.setValue("costPriceBeforeTax", null);
                                } else {
                                  const afterTax = parseFloat(value) || 0;
                                  field.onChange(afterTax);
                                  form.setValue(
                                    "costPriceBeforeTax",
                                    calculateBeforeTax(afterTax)
                                  );
                                  handleCostChange(value);
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              Before VAT: R
                              {formatPrice(calculateBeforeTax(field.value))}
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                // BEFORE TAX MODE - User enters tax-exclusive prices
                <>
                  {/* Cost Price */}
                  <FormField
                    control={form.control}
                    name="costPriceBeforeTax"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Cost Price (Before 15% VAT)</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  field.onChange(null);
                                  form.setValue("costPrice", null);
                                } else {
                                  const beforeTax = parseFloat(value) || 0;
                                  field.onChange(beforeTax);
                                  form.setValue(
                                    "costPrice",
                                    calculateAfterTax(beforeTax)
                                  );
                                  handleCostChange(value);
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              {field.value !== null
                                ? `After VAT: R${formatPrice(calculateAfterTax(field.value))}`
                                : ""}
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profit Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">
                        Profit Margin
                      </FormLabel>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">%</span>
                        <Switch
                          checked={profitInputMode === "AMOUNT"}
                          onCheckedChange={toggleProfitMode}
                          className="scale-75"
                        />
                        <span className="text-xs text-gray-600">R</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="relative">
                        {profitInputMode === "PERCENT" ? (
                          <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        )}
                        <Input
                          type="number"
                          placeholder={
                            profitInputMode === "PERCENT" ? "0.00" : "0.00"
                          }
                          step="0.01"
                          min="0"
                          value={profitValue || ""}
                          onChange={(e) => handleProfitChange(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {profitInputMode === "PERCENT"
                          ? `Amount: R${formatPrice(currentProfitAmount)}`
                          : `Percentage: ${currentProfitPercent.toFixed(1)}%`}
                      </p>
                    </div>
                  </div>

                  {/* Selling Price */}
                  <FormField
                    control={form.control}
                    name="priceBeforeTax"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Selling Price (Before 15% VAT) *</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              value={
                                field.value === undefined ||
                                field.value === null
                                  ? ""
                                  : field.value
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                const beforeTax =
                                  value === "" ? 0 : parseFloat(value) || 0;
                                field.onChange(beforeTax);
                                form.setValue(
                                  "price",
                                  calculateAfterTax(beforeTax)
                                );

                                // Update profit value
                                const costBefore =
                                  form.getValues("costPriceBeforeTax") || 0;
                                const cost = calculateAfterTax(costBefore);
                                if (cost > 0) {
                                  const sellingPrice =
                                    calculateAfterTax(beforeTax);
                                  const newProfit = sellingPrice - cost;
                                  const newProfitPercent =
                                    (newProfit / cost) * 100;
                                  setProfitValue(
                                    profitInputMode === "PERCENT"
                                      ? newProfitPercent
                                      : newProfit
                                  );
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              After VAT: R
                              {formatPrice(calculateAfterTax(field.value))}
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </div>

          {/* Tax Summary */}
          <div className="p-4 border rounded-lg bg-blue-50">
            <h4 className="font-medium text-sm mb-2">15% VAT Summary</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="text-sm font-medium">Cost Price</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Cost before VAT:</p>
                    <p className="font-semibold">
                      {costBeforeTax > 0
                        ? `R${formatPrice(costBeforeTax)}`
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">VAT amount (15%):</p>
                    <p className="font-semibold">
                      {costBeforeTax > 0
                        ? `R${formatPrice(costVatAmount)}`
                        : "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Cost after VAT:</p>
                    <p className="font-semibold text-lg">
                      {costAfterTax > 0
                        ? `R${formatPrice(costAfterTax)}`
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="text-sm font-medium">Selling Price</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Price before VAT:</p>
                    <p className="font-semibold">
                      R{formatPrice(priceBeforeTax)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">VAT amount (15%):</p>
                    <p className="font-semibold">R{formatPrice(vatAmount)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Price after VAT:</p>
                    <p className="font-semibold text-lg">
                      R{formatPrice(priceAfterTax)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Summary */}
            {costAfterTax > 0 && priceAfterTax > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-medium">Profit Summary</h5>
                <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                  <div>
                    <p className="text-gray-600">Profit amount:</p>
                    <p className="font-semibold text-green-600">
                      R{formatPrice(currentProfitAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Profit percentage:</p>
                    <p className="font-semibold text-green-600">
                      {currentProfitPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Markup:</p>
                    <p className="font-semibold text-green-600">
                      {(priceAfterTax / costAfterTax).toFixed(2)}x
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stock Management */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Stock Quantity *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? 0
                            : parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Min Stock</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? 0
                            : parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxStock"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Max Stock</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? 0
                            : parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Brand and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="Product brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.000"
                      step="0.001"
                      min="0"
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Color and Size */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="Product color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Size</FormLabel>
                  <FormControl>
                    <Input placeholder="Product size" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dimensions */}
          <FormField
            control={form.control}
            name="dimensions"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Dimensions</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 10x5x2 cm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status and Featured */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="space-y-2 flex items-center space-x-2 pt-8">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Featured Product</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Product Images */}
          <div className="space-y-2">
            <FormLabel>Product Images</FormLabel>
            <p className="text-sm text-muted-foreground mb-2">
              Upload product images (PNG, JPG, GIF up to 5MB)
            </p>
            <ImageUpload
              onFileUpload={handleImageUpload}
              onFileRemove={handleImageRemove}
              existingFiles={images}
              allowedTypes={["IMAGE"]}
              multiple={true}
            />
            <FormMessage />
          </div>

          {/* Product Documents */}
          <div className="space-y-2">
            <FormLabel>Product Documents</FormLabel>
            <p className="text-sm text-muted-foreground mb-2">
              Upload product documents, manuals, specifications (PDF, DOC, XLS
              up to 10MB)
            </p>
            <ImageUpload
              onFileUpload={handleDocumentUpload}
              onFileRemove={handleDocumentRemove}
              existingFiles={documents}
              allowedTypes={["PDF", "DOCUMENT"]}
              multiple={true}
            />
            <FormMessage />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-w-24"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-24 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : product ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
