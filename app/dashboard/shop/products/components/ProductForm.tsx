"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, Percent } from "lucide-react";
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

  // --- STATE ---
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

  // Configuration Modes
  const [priceInputMode, setPriceInputMode] = useState<
    "BEFORE_TAX" | "AFTER_TAX"
  >(product?.priceInputMode || "AFTER_TAX");

  // Profit Mode: Percent (%) or Fixed Amount (R)
  const [profitInputMode, setProfitInputMode] = useState<"AMOUNT" | "PERCENT">(
    "PERCENT"
  );

  // Local state for the Profit Input field (visual only, truth is derived from Price - Cost)
  const [profitDisplayValue, setProfitDisplayValue] = useState<number>(0);

  // --- MATH UTILS ---
  const round = (num: number): number =>
    Math.round((num + Number.EPSILON) * 100) / 100;
  const addVat = (amount: number) => round(amount * (1 + TAX_RATE));
  const removeVat = (amount: number) => round(amount / (1 + TAX_RATE));

  // Helper function to parse decimal values
  const parseDecimal = (value: string): number => {
    if (value === "" || value === null || value === undefined) return 0;
    const cleanValue = value.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : round(parsed);
  };

  // --- FORM SETUP ---
  const form = useForm<ShopProductSchemaType>({
    resolver: zodResolver(ShopProductSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      sku: product?.sku || "",
      category: product?.category || "",
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

      // Initialize Prices
      price: product?.price || 0,
      priceBeforeTax:
        product?.priceBeforeTax ||
        (product?.price ? removeVat(product.price) : 0),
      costPrice: product?.costPrice || null,
      costPriceBeforeTax:
        product?.costPriceBeforeTax ||
        (product?.costPrice ? removeVat(product.costPrice) : null),
    },
  });

  const { isSubmitting } = form.formState;
  const watchedValues = form.watch();

  // --- CALCULATION LOGIC ---

  // Helper: Get active cost/price based on mode
  const getCurrentCost = (): number => {
    const vals = form.getValues();
    if (priceInputMode === "AFTER_TAX") {
      return vals.costPrice || 0;
    } else {
      return vals.costPriceBeforeTax || 0;
    }
  };

  const getCurrentPrice = (): number => {
    const vals = form.getValues();
    if (priceInputMode === "AFTER_TAX") {
      return vals.price || 0;
    } else {
      return vals.priceBeforeTax || 0;
    }
  };

  /**
   * Sync Tax Fields:
   * If editing Inclusive, auto-calculate Exclusive (and vice versa).
   */
  const syncTaxFields = (
    baseValue: number,
    field: "price" | "cost",
    mode: "BEFORE_TAX" | "AFTER_TAX"
  ) => {
    if (mode === "AFTER_TAX") {
      // Input is Inclusive -> Calc Exclusive
      const excl = removeVat(baseValue);
      if (field === "price") {
        form.setValue("priceBeforeTax", excl, { shouldValidate: true });
      } else {
        form.setValue("costPriceBeforeTax", excl, { shouldValidate: true });
      }
    } else {
      // Input is Exclusive -> Calc Inclusive
      const incl = addVat(baseValue);
      if (field === "price") {
        form.setValue("price", incl, { shouldValidate: true });
      } else {
        form.setValue("costPrice", incl, { shouldValidate: true });
      }
    }
  };

  /**
   * Sync Profit Display:
   * Updates the visual profit input based on current Cost vs Price.
   */
  const syncProfitDisplay = (cost: number, price: number) => {
    if (cost <= 0 || price <= 0) {
      setProfitDisplayValue(0);
      return;
    }

    // Calculate profit based on the same tax mode
    const profitAmt = round(price - cost);

    if (profitInputMode === "PERCENT") {
      // Profit percentage = (Profit Amount / Cost Price) * 100
      const margin = round((profitAmt / cost) * 100);
      setProfitDisplayValue(margin);
    } else {
      setProfitDisplayValue(profitAmt);
    }
  };

  /**
   * HANDLER: Cost Changed
   * Strategy: Update Cost -> Recalculate Selling Price (keeping Margin constant).
   */
  const handleCostChange = (valStr: string) => {
    const newCost = parseDecimal(valStr);

    // 1. Sync the other tax field
    syncTaxFields(newCost, "cost", priceInputMode);

    // 2. Calculate new Selling Price based on existing profit settings
    if (profitDisplayValue > 0 && newCost > 0) {
      let newPrice = 0;

      if (profitInputMode === "PERCENT") {
        newPrice = round(newCost * (1 + profitDisplayValue / 100));
      } else {
        newPrice = round(newCost + profitDisplayValue);
      }

      // 3. Update Price fields
      if (priceInputMode === "AFTER_TAX") {
        form.setValue("price", newPrice, { shouldValidate: true });
        syncTaxFields(newPrice, "price", "AFTER_TAX");
      } else {
        form.setValue("priceBeforeTax", newPrice, { shouldValidate: true });
        syncTaxFields(newPrice, "price", "BEFORE_TAX");
      }
    }

    // 4. Recalculate profit display if price exists
    const price = getCurrentPrice();
    if (price > 0) {
      syncProfitDisplay(newCost, price);
    }
  };

  /**
   * HANDLER: Price Changed
   * Strategy: Update Price -> Recalculate Profit Margin (Cost stays constant).
   */
  const handleSellingPriceChange = (valStr: string) => {
    const newPrice = parseDecimal(valStr);

    // 1. Sync the other tax field
    syncTaxFields(newPrice, "price", priceInputMode);

    // 2. Recalculate Profit
    const cost = getCurrentCost();
    syncProfitDisplay(cost, newPrice);
  };

  /**
   * HANDLER: Profit Changed
   * Strategy: Update Profit -> Recalculate Selling Price (Cost stays constant).
   */
  const handleProfitChange = (valStr: string) => {
    const val = parseDecimal(valStr);
    setProfitDisplayValue(val);

    const cost = getCurrentCost();
    if (cost <= 0) return;

    let newPrice = 0;
    if (profitInputMode === "PERCENT") {
      newPrice = round(cost * (1 + val / 100));
    } else {
      newPrice = round(cost + val);
    }

    if (priceInputMode === "AFTER_TAX") {
      form.setValue("price", newPrice, { shouldValidate: true });
      syncTaxFields(newPrice, "price", "AFTER_TAX");
    } else {
      form.setValue("priceBeforeTax", newPrice, { shouldValidate: true });
      syncTaxFields(newPrice, "price", "BEFORE_TAX");
    }
  };

  /**
   * HANDLER: Toggle Profit Mode (% vs R)
   * Behavior: Convert the current profit value to the new mode and recalculate price
   */
  const toggleProfitMode = () => {
    const cost = getCurrentCost();
    const price = getCurrentPrice();

    if (cost <= 0 || price <= 0) {
      // Just toggle the mode if no cost or price
      setProfitInputMode(profitInputMode === "PERCENT" ? "AMOUNT" : "PERCENT");
      return;
    }

    // Calculate the actual profit amount
    const actualProfitAmt = round(price - cost);

    if (profitInputMode === "PERCENT") {
      // Switching from % to R
      // Convert current percentage to amount
      setProfitDisplayValue(actualProfitAmt);
      setProfitInputMode("AMOUNT");
    } else {
      // Switching from R to %
      // Convert current amount to percentage
      const actualPercentage = round((actualProfitAmt / cost) * 100);
      setProfitDisplayValue(actualPercentage);
      setProfitInputMode("PERCENT");
    }
  };

  /**
   * HANDLER: Toggle Tax Mode
   * Behavior: The visible input value stays the same, but the underlying calculation changes
   */
  const handleInputModeChange = (checked: boolean) => {
    const newMode = checked ? "AFTER_TAX" : "BEFORE_TAX";
    const oldMode = priceInputMode;

    // Don't do anything if mode isn't changing
    if (newMode === oldMode) return;

    // 1. Update mode state first
    setPriceInputMode(newMode);
    form.setValue("priceInputMode", newMode);

    // 2. Get current display values
    const cost = getCurrentCost();
    const price = getCurrentPrice();
    const hasCost = cost > 0;

    // 3. Calculate and set new values based on the new mode
    if (newMode === "AFTER_TAX") {
      // Switching TO After Tax mode
      // Current values are before tax, need to convert to after tax
      const priceAfterTax = addVat(price);
      form.setValue("price", priceAfterTax, { shouldValidate: true });
      form.setValue("priceBeforeTax", price, { shouldValidate: true });

      if (hasCost) {
        const costAfterTax = addVat(cost);
        form.setValue("costPrice", costAfterTax, { shouldValidate: true });
        form.setValue("costPriceBeforeTax", cost, { shouldValidate: true });
      } else {
        form.setValue("costPrice", null, { shouldValidate: true });
        form.setValue("costPriceBeforeTax", null, { shouldValidate: true });
      }
    } else {
      // Switching TO Before Tax mode
      // Current values are after tax, need to convert to before tax
      const priceBeforeTax = removeVat(price);
      form.setValue("priceBeforeTax", priceBeforeTax, { shouldValidate: true });
      form.setValue("price", price, { shouldValidate: true });

      if (hasCost) {
        const costBeforeTax = removeVat(cost);
        form.setValue("costPriceBeforeTax", costBeforeTax, {
          shouldValidate: true,
        });
        form.setValue("costPrice", cost, { shouldValidate: true });
      } else {
        form.setValue("costPriceBeforeTax", null, { shouldValidate: true });
        form.setValue("costPrice", null, { shouldValidate: true });
      }
    }

    // 4. Recalculate profit display based on new values
    setTimeout(() => {
      const newCost = getCurrentCost();
      const newPrice = getCurrentPrice();
      syncProfitDisplay(newCost, newPrice);
    }, 0);
  };

  // --- LIFECYCLE ---
  useEffect(() => {
    loadCategories();

    // Initialize profit display based on existing product data
    if (product) {
      const cost =
        priceInputMode === "AFTER_TAX"
          ? product.costPrice || 0
          : product.costPriceBeforeTax || 0;
      const price =
        priceInputMode === "AFTER_TAX"
          ? product.price || 0
          : product.priceBeforeTax || 0;

      if (cost > 0 && price > 0) {
        syncProfitDisplay(cost, price);
      }
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

  // --- DISPLAY VALUES (Summary Table) ---
  const displayValues = useMemo(() => {
    // Get the current price and cost based on the current input mode
    const currentPrice = getCurrentPrice();
    const currentCost = getCurrentCost();

    // Calculate values based on current input mode
    let sellingBeforeTax = 0;
    let sellingAfterTax = 0;
    let costBeforeTax = 0;
    let costAfterTax = 0;

    if (priceInputMode === "AFTER_TAX") {
      // User is entering prices AFTER tax (inclusive)
      sellingAfterTax = currentPrice;
      sellingBeforeTax = removeVat(currentPrice);

      if (currentCost > 0) {
        costAfterTax = currentCost;
        costBeforeTax = removeVat(currentCost);
      }
    } else {
      // User is entering prices BEFORE tax (exclusive)
      sellingBeforeTax = currentPrice;
      sellingAfterTax = addVat(currentPrice);

      if (currentCost > 0) {
        costBeforeTax = currentCost;
        costAfterTax = addVat(currentCost);
      }
    }

    const profitAmount = round(sellingAfterTax - costAfterTax);
    const profitPercent =
      costAfterTax > 0 ? round((profitAmount / costAfterTax) * 100) : 0;

    return {
      sellingPriceBeforeTax: round(sellingBeforeTax),
      sellingPriceAfterTax: round(sellingAfterTax),
      vatAmount: round(sellingAfterTax - sellingBeforeTax),

      costBeforeTax: round(costBeforeTax),
      costAfterTax: round(costAfterTax),
      costVatAmount: round(costAfterTax - costBeforeTax),

      profitAmount,
      profitPercent,

      markup: costAfterTax > 0 ? round(sellingAfterTax / costAfterTax) : 0,
    };
  }, [watchedValues, priceInputMode, profitInputMode]); // Watch all relevant dependencies

  // --- FILE HANDLERS ---
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

  // --- SUBMIT ---
  const onFormSubmit = async (values: ShopProductSchemaType) => {
    try {
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

  // Format Helper
  const formatPrice = (val: number) => {
    if (val === null || val === undefined) return "0.00";
    return val.toFixed(2);
  };

  const getProfitInfoText = () => {
    const cost = getCurrentCost();
    const price = getCurrentPrice();

    if (cost <= 0 || price <= 0) return "-";

    const profitAmt = round(price - cost);

    if (profitInputMode === "PERCENT") {
      // Already showing percentage, show amount
      return `Amount: R${formatPrice(profitAmt)}`;
    } else {
      // Showing amount, show percentage
      const pct = round((profitAmt / cost) * 100);
      return `Percentage: ${pct}%`;
    }
  };

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
                onCheckedChange={handleInputModeChange}
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
            <div className="grid grid-cols-3 gap-4">
              {priceInputMode === "AFTER_TAX" ? (
                // AFTER TAX MODE (Inc VAT)
                <>
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Cost Price (after VAT)</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  field.onChange(null);
                                  form.setValue("costPriceBeforeTax", null);
                                } else {
                                  const numVal = parseDecimal(val);
                                  field.onChange(numVal);
                                  handleCostChange(val);
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              {field.value !== null
                                ? `Ex VAT: R${formatPrice(removeVat(field.value))}`
                                : ""}
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profit Input (Shared UI structure) */}
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
                          <span className="absolute left-3 top-2.5 h-4 w-4 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                            R
                          </span>
                        )}
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={profitDisplayValue || ""}
                          onChange={(e) => handleProfitChange(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {getProfitInfoText()}
                      </p>
                    </div>
                  </div>

                  {/* Selling Price */}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Selling Price (after VAT) *</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                const numVal =
                                  val === "" ? 0 : parseDecimal(val);
                                field.onChange(numVal);
                                handleSellingPriceChange(val);
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              Ex VAT: R{formatPrice(removeVat(field.value))}
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                // BEFORE TAX MODE (Ex VAT)
                <>
                  <FormField
                    control={form.control}
                    name="costPriceBeforeTax"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Cost Price (before VAT)</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  field.onChange(null);
                                  form.setValue("costPrice", null);
                                } else {
                                  const numVal = parseDecimal(val);
                                  field.onChange(numVal);
                                  handleCostChange(val);
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              {field.value !== null
                                ? `Inc VAT: R${formatPrice(addVat(field.value))}`
                                : ""}
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profit Input (Shared UI structure) */}
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
                          <span className="absolute left-3 top-2.5 h-4 w-4 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                            R
                          </span>
                        )}
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={profitDisplayValue || ""}
                          onChange={(e) => handleProfitChange(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {getProfitInfoText()}
                      </p>
                    </div>
                  </div>

                  {/* Selling Price */}
                  <FormField
                    control={form.control}
                    name="priceBeforeTax"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Selling Price (before VAT) *</FormLabel>
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
                                const val = e.target.value;
                                const numVal =
                                  val === "" ? 0 : parseDecimal(val);
                                field.onChange(numVal);
                                handleSellingPriceChange(val);
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              Inc VAT: R{formatPrice(addVat(field.value))}
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

          {/* Tax Summary - NOW UPDATES DYNAMICALLY */}
          <div className="p-4 border rounded-lg bg-blue-50">
            <h4 className="font-medium text-sm mb-2">15% VAT Summary</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="text-sm font-medium">Cost Price</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Cost before VAT:</p>
                    <p className="font-semibold">
                      {displayValues.costBeforeTax > 0
                        ? `R${formatPrice(displayValues.costBeforeTax)}`
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">VAT amount (15%):</p>
                    <p className="font-semibold">
                      {displayValues.costBeforeTax > 0
                        ? `R${formatPrice(displayValues.costVatAmount)}`
                        : "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Cost after VAT:</p>
                    <p className="font-semibold text-lg">
                      {displayValues.costAfterTax > 0
                        ? `R${formatPrice(displayValues.costAfterTax)}`
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
                      R{formatPrice(displayValues.sellingPriceBeforeTax)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">VAT amount (15%):</p>
                    <p className="font-semibold">
                      R{formatPrice(displayValues.vatAmount)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Price after VAT:</p>
                    <p className="font-semibold text-lg">
                      R{formatPrice(displayValues.sellingPriceAfterTax)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Summary */}
            {displayValues.costAfterTax > 0 &&
              displayValues.sellingPriceAfterTax > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h5 className="text-sm font-medium">Profit Summary</h5>
                  <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                    <div>
                      <p className="text-gray-600">Profit amount:</p>
                      <p className="font-semibold text-green-600">
                        R{formatPrice(displayValues.profitAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Profit percentage:</p>
                      <p className="font-semibold text-green-600">
                        {displayValues.profitPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Markup:</p>
                      <p className="font-semibold text-green-600">
                        {displayValues.costAfterTax > 0
                          ? displayValues.markup.toFixed(2) + "x"
                          : "-"}
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
